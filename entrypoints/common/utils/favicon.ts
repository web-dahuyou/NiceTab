import { handleUrlWidthParams, getOrigin } from './url';
import {
  getFavicon,
  putFavicon,
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
let initPromise: Promise<void> | null = null;

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

// 并发请求去重
const pendingRequests = new Map<string, Promise<string>>();

// 复用 canvas
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

// ========== 缓存操作 ==========

function saveToMemoryCache(origin: string, url: string, source: FaviconSource) {
  // LRU 淘汰：删除最早的条目
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldest = memoryCache.keys().next().value;
    if (oldest !== undefined) memoryCache.delete(oldest);
  }
  memoryCache.set(origin, { url, timestamp: Date.now(), source });
}

function getFromMemoryCache(origin: string): string | null {
  const entry = memoryCache.get(origin);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
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
    // 兜底图不覆盖已经缓存的真实图标
    if (source === 'default') {
      const existing = await getFavicon(origin);
      if (existing?.url && existing.url !== defaultFaviconUrl) return;
    }
    await putFavicon({ origin, url: faviconUrl, timestamp: Date.now(), source });
  } catch {
    // 缓存写入失败不影响主流程
  }
}

// 从 IndexedDB 中获取 favicon（带 TTL 校验）
async function getFaviconFromStore(origin: string): Promise<FaviconRecord | null> {
  try {
    const record = await getFavicon(origin);
    if (!record) return null;
    if (Date.now() - record.timestamp > CACHE_TTL) return null;
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

// base64 对比检测的来源
const base64CheckSources: FaviconSource[] = ['ext', 'bonjourr'];
// fetch 状态码检测的来源
const fetchCheckSources: FaviconSource[] = ['gstatic', 'ddg', 'ico'];

// 初始化各来源的兜底图base64值（在 dom 环境中调用）
export async function initFaviconApiData() {
  if (initPromise) return initPromise;
  if (testFaviconBase64Map.size > 0) return; // 已初始化

  initPromise = (async () => {
    try {
      const [extBase64, bonjourrBase64] = await Promise.all([
        getBase64Value(getFaviconByExtApi(testPageUrl)),
        getBase64Value(getBonjourrUrl(testPageUrl)),
      ]);
      testFaviconBase64Map.set('ext', extBase64 || '');
      testFaviconBase64Map.set('bonjourr', bonjourrBase64 || '');
    } catch {
      testFaviconBase64Map.set('ext', '');
      testFaviconBase64Map.set('bonjourr', '');
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// 获取图片链接对应的base64值（复用 canvas + 超时）
export async function getBase64Value(imageUrl: string): Promise<string> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(''), 5000);
    const image = new Image();
    image.onload = () => {
      clearTimeout(timeout);
      if (!sharedCanvas) {
        sharedCanvas = document.createElement('canvas');
        sharedCanvas.width = 32;
        sharedCanvas.height = 32;
        sharedCtx = sharedCanvas.getContext('2d');
      }
      sharedCtx?.clearRect(0, 0, 32, 32);
      sharedCtx?.drawImage(image, 0, 0, 32, 32);
      try {
        const base64 = sharedCanvas
          .toDataURL('image/png')
          .replace(/^data:image\/png;base64,/, '');
        resolve(base64);
      } catch {
        resolve('');
      }
    };
    image.onerror = () => {
      clearTimeout(timeout);
      resolve('');
    };
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
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${pageUrl}&size=${size}`;
}
// 通过 {origin}/favicon.ico 获取网站图标
export function getFaviconIcoUrl(pageUrl: string) {
  try {
    const origin = getOrigin(pageUrl);
    return `${origin}/favicon.ico`;
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
// fetch 状态码检测（通过 HEAD 请求判断资源是否有效）
async function checkFetchStatus(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    });

    clearTimeout(timeout);
    // no-cors 模式下 opaque response status 为 0，也算可访问
    return resp.status === 0 || (resp.status >= 200 && resp.status < 400);
  } catch {
    return false;
  }
}

// 轻量级图片加载检测（仅检测能否加载成功，不做 canvas 转换）
function checkImageLoadable(imageUrl: string): Promise<boolean> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(false), 5000);
    const image = new Image();
    image.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    image.src = imageUrl;
  });
}

// 尝试保存并返回 URL
// - ext/bonjourr: base64 对比检测（有兜底图基准）
// - gstatic/ddg: fetch 状态码检测
// - ico: 轻量 loadable 检测
async function tryFaviconSource(
  origin: string,
  imgUrl: string,
  source: FaviconSource,
): Promise<string | null> {
  let valid = false;

  if (base64CheckSources.includes(source)) {
    const testBase64 = getTestBase64(source);
    if (testBase64 !== null) {
      const base64 = await getBase64Value(imgUrl);
      valid = !!base64 && base64 !== testBase64;
    }
  } else if (fetchCheckSources.includes(source)) {
    valid = await checkFetchStatus(imgUrl);
  } else {
    valid = await checkImageLoadable(imgUrl);
  }

  if (!valid) return null;
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
): Promise<string> {
  try {
    if (!origin || origin === 'null') {
      saveToMemoryCache(origin, defaultFaviconUrl, 'default');
      return defaultFaviconUrl;
    }

    // 1. _favicon 扩展 API（base64 对比检测兜底图）
    if (getTestBase64('ext') !== '') {
      const extUrl = getFaviconByExtApi(pageUrl, size);
      const extResult = await tryFaviconSource(origin, extUrl, 'ext');
      if (extResult) return extResult;
    }

    // 2. gstatic（fetch 状态码检测）
    const gstaticUrl = getGstaticURL(pageUrl, size);
    const gstaticResult = await tryFaviconSource(origin, gstaticUrl, 'gstatic');
    if (gstaticResult) return gstaticResult;

    // 3. DuckDuckGo（fetch 状态码检测）
    try {
      const domain = new URL(pageUrl).hostname;
      const ddgUrl = getDuckDuckGoUrl(domain);
      const ddgResult = await tryFaviconSource(origin, ddgUrl, 'ddg');
      if (ddgResult) return ddgResult;
    } catch {}

    // 4. bonjourr（第三方兜底）
    const bonjourrUrl = getBonjourrUrl(origin);
    const bonjourrResult = await tryFaviconSource(origin, bonjourrUrl, 'bonjourr');
    if (bonjourrResult) return bonjourrResult;

    // 5. {origin}/favicon.ico（同源兜底）
    const icoUrl = getFaviconIcoUrl(pageUrl);
    if (icoUrl) {
      const icoResult = await tryFaviconSource(origin, icoUrl, 'ico');
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

// 获取网站图标（try-catch + 并发去重 + 两级缓存）
export async function getFaviconUrl(pageUrl: string, size: number = 32): Promise<string> {
  const origin = getOrigin(pageUrl);

  try {
    // 1. 内存缓存
    const memHit = getFromMemoryCache(origin);
    if (memHit) return memHit;

    // 2. IndexedDB 缓存
    await ensureStorePruned();
    const storeHit = await getFaviconFromStore(origin);
    if (storeHit) {
      saveToMemoryCache(origin, storeHit.url, storeHit.source);
      return storeHit.url;
    }

    await initFaviconApiData();

    // 3. 并发去重
    const pending = pendingRequests.get(origin);
    if (pending) return pending;

    const promise = fetchFavicon(pageUrl, origin, size).finally(() => {
      pendingRequests.delete(origin);
    });
    pendingRequests.set(origin, promise);
    return promise;
  } catch {
    saveToMemoryCache(origin, defaultFaviconUrl, 'default');
    saveFaviconToStore(origin, defaultFaviconUrl, 'default');
    return defaultFaviconUrl;
  }
}

export default {
  initFaviconApiData,
  getBase64Value,
  getFaviconUrl,
};
