import { handleUrlWidthParams } from './url';
import {
  getFavicon,
  putFavicon,
  invalidateFavicon,
  pruneFavicons,
  MAX_DATA_URL_LENGTH,
  type FaviconRecord,
  type FaviconSource,
} from './faviconDb';

const testPageUrl = 'https://favicon-test.nicetab.com';

const defaultFaviconUrl = browser.runtime.getURL('/icon/favicon-default.png');

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
const FAILURE_TTL = 5 * 60 * 1000;
const IMAGE_TIMEOUT = 3000;
// 传入图标、两级缓存和五个来源，限制连续显示失败后的恢复次数。
const MAX_FAILED_URLS = 8;

function getCacheTtl(source: FaviconSource) {
  return source === 'default' ? FAILURE_TTL : CACHE_TTL;
}

// 并发请求去重
const pendingRequests = new Map<
  string,
  { promise: Promise<string>; version: number; origin: string }
>();
// 恢复请求使同站点的旧请求失效；有界保存版本，避免长驻页面无限增长。
const requestVersions = new Map<string, number>();
let nextRequestVersion = 0;

// 旧请求等待最新恢复结果，避免恢复尚未完成时提前显示默认图。
async function getCurrentFavicon(origin: string): Promise<string> {
  for (const pending of pendingRequests.values()) {
    if (pending.origin === origin && pending.version === requestVersions.get(origin)) {
      return pending.promise;
    }
  }
  return getFromMemoryCache(origin) || defaultFaviconUrl;
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
  isCurrent: () => boolean,
) {
  if (!origin || origin === 'null') return;
  // data:image 的图标体积不可控，超过上限的不落盘，交给兜底图
  if (faviconUrl.startsWith('data:') && faviconUrl.length > MAX_DATA_URL_LENGTH) {
    return;
  }
  try {
    await putFavicon(
      { origin, url: faviconUrl, timestamp: Date.now(), source },
      isCurrent,
    );
  } catch {
    // 缓存写入失败不影响主流程
  }
}

// 从 IndexedDB 中获取 favicon（带 TTL 校验）
async function getFaviconFromStore(origin: string): Promise<FaviconRecord | null> {
  try {
    const record = await getFavicon(origin);
    if (!record) return null;
    if (Date.now() - record.timestamp > getCacheTtl(record.source)) return null;
    return record;
  } catch {
    return null;
  }
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
  failedUrls: readonly string[],
  isCurrent: () => boolean,
): Promise<string | null> {
  if (!isCurrent() || failedUrls.includes(imgUrl)) return null;
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

  if (!valid || !isCurrent()) return null;
  // 先写内存缓存保证立即命中，IndexedDB 落盘异步执行，不阻塞图标返回
  saveToMemoryCache(origin, imgUrl, source);
  saveFaviconToStore(origin, imgUrl, source, isCurrent);
  return imgUrl;
}

// 实际的网络请求逻辑（fallback 链路：_favicon → gstatic → ddg → bonjourr → favicon.ico）
async function fetchFavicon(
  pageUrl: string,
  origin: string,
  size: number,
  failedUrls: readonly string[],
  isCurrent: () => boolean,
): Promise<string> {
  try {
    if (!origin || origin === 'null') {
      saveToMemoryCache(origin, defaultFaviconUrl, 'default');
      return defaultFaviconUrl;
    }

    // 1. _favicon 扩展 API（base64 对比检测兜底图）
    const extUrl = getFaviconByExtApi(pageUrl, size);
    const extResult = await tryFaviconSource(
      origin,
      extUrl,
      'ext',
      failedUrls,
      isCurrent,
    );
    if (extResult) return extResult;

    // 2. gstatic（图片加载检测）
    const gstaticUrl = getGstaticURL(pageUrl, size);
    const gstaticResult = await tryFaviconSource(
      origin,
      gstaticUrl,
      'gstatic',
      failedUrls,
      isCurrent,
    );
    if (gstaticResult) return gstaticResult;

    // 3. DuckDuckGo（图片加载检测）
    try {
      const domain = new URL(pageUrl).hostname;
      const ddgUrl = getDuckDuckGoUrl(domain);
      const ddgResult = await tryFaviconSource(
        origin,
        ddgUrl,
        'ddg',
        failedUrls,
        isCurrent,
      );
      if (ddgResult) return ddgResult;
    } catch {}

    // 4. bonjourr（第三方兜底）
    const bonjourrUrl = getBonjourrUrl(origin);
    const bonjourrResult = await tryFaviconSource(
      origin,
      bonjourrUrl,
      'bonjourr',
      failedUrls,
      isCurrent,
    );
    if (bonjourrResult) return bonjourrResult;

    // 5. {origin}/favicon.ico（同源兜底）
    const icoUrl = getFaviconIcoUrl(pageUrl);
    if (icoUrl) {
      const icoResult = await tryFaviconSource(
        origin,
        icoUrl,
        'ico',
        failedUrls,
        isCurrent,
      );
      if (icoResult) return icoResult;
    }

    // 6. 最终兜底：返回 defaultFaviconUrl 兜底图
    if (!isCurrent()) return getFromMemoryCache(origin) || defaultFaviconUrl;
    saveToMemoryCache(origin, defaultFaviconUrl, 'default');
    saveFaviconToStore(origin, defaultFaviconUrl, 'default', isCurrent);
    return defaultFaviconUrl;
  } catch {
    if (!isCurrent()) return getFromMemoryCache(origin) || defaultFaviconUrl;
    saveToMemoryCache(origin, defaultFaviconUrl, 'default');
    saveFaviconToStore(origin, defaultFaviconUrl, 'default', isCurrent);
    return defaultFaviconUrl;
  }
}

// 同一 origin、尺寸和恢复条件共享完整读取流程，避免重复读取 IndexedDB。
export async function getFaviconUrl(
  pageUrl: string,
  size: number = 32,
  failedUrls: readonly string[] = [],
): Promise<string> {
  let origin: string;
  try {
    const url = new URL(pageUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return defaultFaviconUrl;
    origin = url.origin;
  } catch {
    return defaultFaviconUrl;
  }

  const key = JSON.stringify([origin, size, [...failedUrls].sort()]);
  const pending = pendingRequests.get(key);
  if (pending && pending.version === requestVersions.get(origin)) return pending.promise;

  const version =
    failedUrls.length > 0 || !requestVersions.has(origin)
      ? ++nextRequestVersion
      : requestVersions.get(origin)!;
  requestVersions.delete(origin);
  requestVersions.set(origin, version);
  if (requestVersions.size > MAX_CACHE_SIZE) {
    const oldest = requestVersions.keys().next().value;
    if (oldest !== undefined) requestVersions.delete(oldest);
  }
  const isCurrent = () => requestVersions.get(origin) === version;

  const promise = (async () => {
    try {
      if (failedUrls.length > 0) {
        const entry = memoryCache.get(origin);
        if (entry && failedUrls.includes(entry.url)) memoryCache.delete(origin);
        try {
          await invalidateFavicon(origin, failedUrls);
        } catch {
          // 持久化不可用时仍通过 failedUrls 跳过失败地址，继续回退。
        }
        if (new Set(failedUrls).size >= MAX_FAILED_URLS) return defaultFaviconUrl;
      }
      const memHit = getFromMemoryCache(origin);
      if (memHit && !failedUrls.includes(memHit)) return memHit;

      await ensureStorePruned();
      const storeHit = await getFaviconFromStore(origin);
      if (!isCurrent()) return getCurrentFavicon(origin);
      if (storeHit && !failedUrls.includes(storeHit.url)) {
        saveToMemoryCache(origin, storeHit.url, storeHit.source, storeHit.timestamp);
        return storeHit.url;
      }

      const result = await fetchFavicon(pageUrl, origin, size, failedUrls, isCurrent);
      return isCurrent() ? result : getCurrentFavicon(origin);
    } catch {
      if (!isCurrent()) return getCurrentFavicon(origin);
      saveToMemoryCache(origin, defaultFaviconUrl, 'default');
      return defaultFaviconUrl;
    }
  })().finally(() => {
    if (pendingRequests.get(key)?.promise === promise) pendingRequests.delete(key);
  });
  pendingRequests.set(key, { promise, version, origin });
  return promise;
}

export default {
  initFaviconApiData,
  getBase64Value,
  getFaviconUrl,
};
