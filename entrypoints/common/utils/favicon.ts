import { handleUrlWidthParams } from './url';
import type { RuntimeMessageEventProps } from '~/entrypoints/types';
import {
  getFavicon,
  getOriginsWithFailedIcons,
  putFavicon,
  invalidateFavicon,
  pruneFavicons,
  MAX_DATA_URL_LENGTH,
  FAILED_ICON_TTL,
  type FaviconRecord,
  type FaviconSource,
} from './faviconDb';

const testPageUrl = 'https://favicon-test.nicetab.com';

export const defaultFaviconUrl = browser.runtime.getURL('/icon/favicon-default.png');

// ========== 状态区分 ==========
// null = 未初始化, '' = 初始化失败, 非空 = 有效值
const testFaviconBase64Map = new Map<FaviconSource, string | null>();
const initPromises = new Map<FaviconSource, Promise<void>>();
const initAttempts = new Map<FaviconSource, number>();

function getTestBase64(source: FaviconSource): string | null {
  return testFaviconBase64Map.get(source) ?? null;
}

// ========== 两级缓存 ==========
interface CacheEntry {
  url: string;
  timestamp: number;
  source: FaviconSource;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天
const MAX_CACHE_SIZE = 2000;
const FAILURE_TTL = FAILED_ICON_TTL;
const IMAGE_TIMEOUT = 3000;
// 传入图标、两级缓存和五个来源，限制连续显示失败后的恢复次数。
const MAX_FAILED_URLS = 8;

function getCacheTtl(source: FaviconSource) {
  return source === 'default' ? FAILURE_TTL : CACHE_TTL;
}

// 同站点共享失败地址，不同尺寸保留各自的来源探测请求。
interface OriginRequests {
  failedUrls: Set<string>;
  invalidations: Set<string>;
  pendingWrites: number;
  bySize: Map<number, Promise<string>>;
}

const pendingByOrigin = new Map<string, OriginRequests>();

function releaseIfIdle(origin: string, requests: OriginRequests) {
  if (!requests.bySize.size && !requests.pendingWrites) pendingByOrigin.delete(origin);
}

function reportFailures(
  origin: string,
  requests: OriginRequests,
  urls: readonly string[],
) {
  const batch = requests.invalidations;
  const wasEmpty = batch.size === 0;
  for (const url of urls) {
    if (requests.failedUrls.has(url)) continue;
    requests.failedUrls.add(url);
    batch.add(url);
    if (memoryCache.get(origin)?.url === url) memoryCache.delete(origin);
  }
  if (wasEmpty && batch.size) {
    requests.pendingWrites++;
    // 图片 error 分属不同的浏览器事件；首个报告启动固定窗口，持续报错也会定期提交。
    setTimeout(async () => {
      requests.invalidations = new Set();
      try {
        await invalidateFavicon(origin, [...batch]);
        initialIcons.delete(origin);
        failedOrigins = undefined;
        await browser.runtime.sendMessage({
          msgType: 'faviconFailuresChanged',
          data: { origin },
        } satisfies RuntimeMessageEventProps);
      } catch {
        // 持久化不可用时，读取和探测仍会跳过本轮报告的失败地址。
      } finally {
        requests.pendingWrites--;
        releaseIfIdle(origin, requests);
      }
    }, 50);
  }
}

// ========== 缓存操作 ==========

function saveToMemoryCache(
  origin: string,
  url: string,
  source: FaviconSource,
  timestamp = Date.now(),
) {
  memoryCache.delete(origin);
  // LRU 淘汰：删除最早的条目
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldest = memoryCache.keys().next().value;
    if (oldest !== undefined) memoryCache.delete(oldest);
  }
  memoryCache.set(origin, { url, timestamp, source });
}

function getFromMemoryCache(origin: string): string | null {
  const entry = memoryCache.get(origin);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > getCacheTtl(entry.source)) {
    memoryCache.delete(origin);
    return null;
  }
  // 刷新 LRU 顺序：删除后重新插入
  memoryCache.delete(origin);
  memoryCache.set(origin, entry);
  return entry.url;
}

// 将 favicon 保存到 IndexedDB 中（带时间戳）
async function saveFaviconToStore(
  origin: string,
  faviconUrl: string,
  source: FaviconSource,
) {
  if (!origin || origin === 'null') return;
  // data:image 的图标体积不可控，超过上限的不落盘，交给兜底图
  if (faviconUrl.startsWith('data:') && faviconUrl.length > MAX_DATA_URL_LENGTH) {
    return;
  }
  try {
    await putFavicon(
      { origin, url: faviconUrl, timestamp: Date.now(), source },
      () => memoryCache.get(origin)?.url === faviconUrl,
    );
    initialIcons.delete(origin);
  } catch {
    // 缓存写入失败不影响主流程
  }
}

// 从 IndexedDB 中获取 favicon（带 TTL 校验）
async function getFaviconFromStore(
  origin: string,
  freshRecord?: FaviconRecord | null,
): Promise<FaviconRecord | null> {
  try {
    const record = freshRecord === undefined ? await getFavicon(origin) : freshRecord;
    if (!record) return null;
    if (Date.now() - record.timestamp > getCacheTtl(record.source)) return null;
    return record;
  } catch {
    return null;
  }
}

// 同一页面分段挂载的标签复用站点查询，包括未命中的查询。
const initialIcons = new Map<
  string,
  {
    until: number;
    lookup: Promise<{ record: FaviconRecord; failures: Map<string, number> } | null>;
  }
>();

let failedOrigins: Promise<Set<IDBValidKey> | null> | undefined;

// 通知只携带站点；下一次使用时再共享一次读取，冷却期限以数据库为准。
interface RemoteFailureLookup {
  failedIcons?: FaviconRecord['failedIcons'];
  freshRecord?: FaviconRecord | null;
}
const remoteFailures = new Map<string, { lookup?: Promise<RemoteFailureLookup> }>();

export function onFaviconFailuresChanged(origin: string) {
  initialIcons.delete(origin);
  memoryCache.delete(origin);
  const entry = {};
  remoteFailures.set(origin, entry);
  setTimeout(() => {
    if (remoteFailures.get(origin) === entry) remoteFailures.delete(origin);
  }, FAILURE_TTL);
}

function getRemoteFailures(origin: string) {
  const entry = remoteFailures.get(origin);
  if (entry) {
    entry.lookup ??= getFavicon(origin).then(
      record => {
        const failedIcons = record?.failedIcons;
        // 同批读取共享完整记录；之后的加载只复用冷却信息。
        entry.lookup = Promise.resolve({ failedIcons });
        return { failedIcons, freshRecord: record };
      },
      () => {
        entry.lookup = undefined;
        return {};
      },
    );
    return entry.lookup;
  }
}

export async function getInitialFaviconUrl(pageUrl: string, supplied: string) {
  if (!/^https?:\/\//i.test(supplied) || !/^https?:\/\//i.test(pageUrl)) return supplied;
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return supplied;
  }
  const remote = getRemoteFailures(origin);
  if (remote) {
    const result = await remote;
    if (
      result.failedIcons?.some(([url, until]) => url === supplied && until > Date.now())
    )
      return resolveFaviconUrl(pageUrl, origin, 32, [], supplied, result);
    if (result.freshRecord !== undefined) return supplied;
  }
  failedOrigins ??= getOriginsWithFailedIcons().catch(() => {
    failedOrigins = undefined;
    return null;
  });
  const origins = await failedOrigins;
  if (origins && !origins.has(origin)) return supplied;

  let entry = initialIcons.get(origin);
  if (!entry || entry.until <= Date.now()) {
    const lookup = getFaviconFromStore(origin).then(record =>
      record?.failedIcons?.length && (!record.url || record.source !== 'default')
        ? { record, failures: new Map(record.failedIcons) }
        : null,
    );
    entry = { until: Date.now() + FAILURE_TTL, lookup };
    initialIcons.delete(origin);
    if (initialIcons.size >= MAX_CACHE_SIZE)
      initialIcons.delete(initialIcons.keys().next().value!);
    initialIcons.set(origin, entry);
  }
  const cached = await entry.lookup;
  if (!cached) return supplied;
  const { record, failures } = cached;
  const now = Date.now();
  if ((failures.get(supplied) ?? 0) <= now) return supplied;
  if (!record.url) return getFaviconUrl(pageUrl, 32, [], supplied);
  if (
    record.timestamp + CACHE_TTL <= now ||
    (failures.get(record.url) ?? 0) > now ||
    pendingByOrigin.get(origin)?.failedUrls.has(record.url)
  )
    return supplied;
  return record.url;
}

// 首次读取前清理过期/超量记录，整个页面生命周期只执行一次
let storePrunedPromise: Promise<void> | null = null;
function ensureStorePruned(): Promise<void> {
  storePrunedPromise ??= (async () => {
    // 迁移清理：旧版本 localStorage 缓存已废弃，数据已迁移到 IndexedDB
    try {
      localStorage.removeItem('local_faviconStore');
    } catch {
      // background 等无 localStorage 环境忽略
    }
    await pruneFavicons({ ttl: CACHE_TTL, max: MAX_CACHE_SIZE });
  })();
  return storePrunedPromise;
}

// ========== 核心函数 ==========

// 各来源独立初始化；失败后冷却重试，避免第三方阻塞扩展 API。
export async function initFaviconApiData(source: FaviconSource = 'ext') {
  if (source !== 'ext' && source !== 'bonjourr') return;
  const pending = initPromises.get(source);
  if (pending) return pending;
  if (getTestBase64(source)) return;
  const attemptedAt = initAttempts.get(source);
  if (attemptedAt !== undefined && Date.now() - attemptedAt < FAILURE_TTL) return;

  initAttempts.set(source, Date.now());
  const promise = (async () => {
    try {
      const url =
        source === 'ext' ? getFaviconByExtApi(testPageUrl) : getBonjourrUrl(testPageUrl);
      testFaviconBase64Map.set(source, await getBase64Value(url));
    } catch {
      testFaviconBase64Map.set(source, '');
    }
  })().finally(() => initPromises.delete(source));
  initPromises.set(source, promise);
  return promise;
}

// 每次转换使用独立 canvas，跨域读取失败不会影响其他图标。
export async function getBase64Value(imageUrl: string): Promise<string> {
  return new Promise(resolve => {
    const image = new Image();
    const finish = (value: string) => {
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
      resolve(value);
    };
    const timeout = setTimeout(() => finish(''), IMAGE_TIMEOUT);
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx || !image.naturalWidth || !image.naturalHeight) {
          finish('');
          return;
        }
        ctx.drawImage(image, 0, 0, 32, 32);
        finish(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
      } catch {
        finish('');
      }
    };
    image.onerror = () => finish('');
    // HTTP 图片使用 CORS 读取；不支持时由调用方决定是否降级为加载检测。
    if (/^https?:/i.test(imageUrl)) image.crossOrigin = 'anonymous';
    image.src = imageUrl;
  });
}

// 通过 favicon api 获取favicon
export function getFaviconByExtApi(pageUrl: string, size: number = 32) {
  const apiUrl = browser.runtime.getURL('/_favicon/');
  return handleUrlWidthParams(apiUrl, { pageUrl, size });
}

// 通过 t3.gstatic.com/faviconV2 获取网站图标
export function getGstaticURL(pageUrl: string, size: number = 32) {
  return handleUrlWidthParams('https://t3.gstatic.com/faviconV2', {
    client: 'SOCIAL',
    type: 'FAVICON',
    fallback_opts: 'TYPE,SIZE,URL',
    url: new URL(pageUrl).origin,
    size,
  });
}
// 通过 {origin}/favicon.ico 获取网站图标
export function getFaviconIcoUrl(pageUrl: string) {
  try {
    const url = new URL(pageUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return `${url.origin}/favicon.ico`;
  } catch {
    return '';
  }
}
// 通过 DuckDuckGo 获取网站图标
export function getDuckDuckGoUrl(domain: string) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
// 通过 bonjourr 获取网站图标
export function getBonjourrUrl(origin: string) {
  return `https://services.bonjourr.fr/favicon/blob/${origin}`;
}
// 检查实际图片能否解码，HEAD 状态码不能证明图片有效。
function checkImageLoadable(imageUrl: string): Promise<boolean> {
  return new Promise(resolve => {
    const image = new Image();
    const finish = (valid: boolean) => {
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
      resolve(valid);
    };
    const timeout = setTimeout(() => finish(false), IMAGE_TIMEOUT);
    image.onload = () => finish(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => finish(false);
    image.src = imageUrl;
  });
}

// 扩展图标必须排除默认图；Bonjourr 无法读取像素时降级为加载检测。
async function tryFaviconSource(
  origin: string,
  imgUrl: string,
  source: FaviconSource,
  failedUrls: ReadonlySet<string>,
): Promise<string | null> {
  if (failedUrls.has(imgUrl)) return null;
  let valid = false;

  if (source === 'ext' || source === 'bonjourr') {
    await initFaviconApiData(source);
    const testBase64 = getTestBase64(source);
    if (source === 'ext' && !testBase64) return null;
    const base64 = testBase64 ? await getBase64Value(imgUrl) : '';
    if (base64 && testBase64) {
      valid = base64 !== testBase64;
    } else if (source === 'bonjourr') {
      valid = await checkImageLoadable(imgUrl);
    }
  } else {
    valid = await checkImageLoadable(imgUrl);
  }

  if (!valid || failedUrls.has(imgUrl)) return null;
  // 先写内存缓存保证立即命中，IndexedDB 落盘异步执行，不阻塞图标返回
  saveToMemoryCache(origin, imgUrl, source);
  saveFaviconToStore(origin, imgUrl, source);
  return imgUrl;
}

// 实际的网络请求逻辑（fallback 链路：_favicon → gstatic → ddg → bonjourr → favicon.ico）
async function fetchFavicon(
  pageUrl: string,
  origin: string,
  size: number,
  failedUrls: ReadonlySet<string>,
): Promise<string> {
  try {
    if (!origin || origin === 'null') {
      saveToMemoryCache(origin, defaultFaviconUrl, 'default');
      return defaultFaviconUrl;
    }

    // 1. _favicon 扩展 API（base64 对比检测兜底图）
    const extUrl = getFaviconByExtApi(pageUrl, size);
    const extResult = await tryFaviconSource(origin, extUrl, 'ext', failedUrls);
    if (extResult) return extResult;

    // 2. gstatic（图片加载检测）
    const gstaticUrl = getGstaticURL(pageUrl, size);
    const gstaticResult = await tryFaviconSource(
      origin,
      gstaticUrl,
      'gstatic',
      failedUrls,
    );
    if (gstaticResult) return gstaticResult;

    // 3. DuckDuckGo（图片加载检测）
    try {
      const domain = new URL(pageUrl).hostname;
      const ddgUrl = getDuckDuckGoUrl(domain);
      const ddgResult = await tryFaviconSource(origin, ddgUrl, 'ddg', failedUrls);
      if (ddgResult) return ddgResult;
    } catch {}

    // 4. bonjourr（第三方兜底）
    const bonjourrUrl = getBonjourrUrl(origin);
    const bonjourrResult = await tryFaviconSource(
      origin,
      bonjourrUrl,
      'bonjourr',
      failedUrls,
    );
    if (bonjourrResult) return bonjourrResult;

    // 5. {origin}/favicon.ico（同源兜底）
    const icoUrl = getFaviconIcoUrl(pageUrl);
    if (icoUrl) {
      const icoResult = await tryFaviconSource(origin, icoUrl, 'ico', failedUrls);
      if (icoResult) return icoResult;
    }

    // 6. 最终兜底：返回 defaultFaviconUrl 兜底图
    saveToMemoryCache(origin, defaultFaviconUrl, 'default');
    saveFaviconToStore(origin, defaultFaviconUrl, 'default');
    return defaultFaviconUrl;
  } catch {
    saveToMemoryCache(origin, defaultFaviconUrl, 'default');
    saveFaviconToStore(origin, defaultFaviconUrl, 'default');
    return defaultFaviconUrl;
  }
}

// 同一站点和尺寸共享读取与回退，所有尺寸完成后释放站点状态。
export async function getFaviconUrl(
  pageUrl: string,
  size: number = 32,
  failedUrls: readonly string[] = [],
  knownFailedUrl?: string,
): Promise<string> {
  let origin: string;
  try {
    const url = new URL(pageUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return defaultFaviconUrl;
    origin = url.origin;
  } catch {
    return defaultFaviconUrl;
  }

  const remote = getRemoteFailures(origin);
  return resolveFaviconUrl(
    pageUrl,
    origin,
    size,
    failedUrls,
    knownFailedUrl,
    remote && (await remote),
  );
}

async function resolveFaviconUrl(
  pageUrl: string,
  origin: string,
  size: number,
  failedUrls: readonly string[],
  knownFailedUrl?: string,
  remote?: RemoteFailureLookup,
): Promise<string> {
  let requests = pendingByOrigin.get(origin);
  if (!requests) {
    requests = {
      failedUrls: new Set(),
      invalidations: new Set(),
      pendingWrites: 0,
      bySize: new Map(),
    };
    pendingByOrigin.set(origin, requests);
  }
  // 首屏从占位记录读到的地址只需跳过，重复上报会延长原有冷却期。
  if (knownFailedUrl) requests.failedUrls.add(knownFailedUrl);
  reportFailures(origin, requests, failedUrls);
  for (const [url, until] of remote?.failedIcons ?? []) {
    if (until > Date.now()) requests.failedUrls.add(url);
  }
  // 上限针对单个组件的连续失败；其他组件报告不同地址仍可共享有效候选。
  if (
    failedUrls.length >= MAX_FAILED_URLS &&
    new Set(failedUrls).size >= MAX_FAILED_URLS
  ) {
    releaseIfIdle(origin, requests);
    return defaultFaviconUrl;
  }

  const pending = requests.bySize.get(size);
  if (pending) return pending;
  const active = requests;
  // 延迟到当前调用栈结束，让同一批请求先登记失败地址和共享的 Promise。
  const promise = Promise.resolve().then(async () => {
    try {
      const memHit = getFromMemoryCache(origin);
      if (memHit && !active.failedUrls.has(memHit)) return memHit;

      await ensureStorePruned();
      const storeHit = await getFaviconFromStore(origin, remote?.freshRecord);
      if (storeHit?.url && !active.failedUrls.has(storeHit.url)) {
        saveToMemoryCache(origin, storeHit.url, storeHit.source, storeHit.timestamp);
        return storeHit.url;
      }

      // 在图片加载和 Promise 返回之间也可能收到该候选的新失败报告。
      let result: string;
      do {
        result = await fetchFavicon(pageUrl, origin, size, active.failedUrls);
      } while (result !== defaultFaviconUrl && active.failedUrls.has(result));
      return result;
    } finally {
      active.bySize.delete(size);
      releaseIfIdle(origin, active);
    }
  });
  active.bySize.set(size, promise);
  return promise;
}

export default {
  initFaviconApiData,
  getBase64Value,
  getFaviconUrl,
};
