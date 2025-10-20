import { handleUrlWidthParams, getOrigin } from './url';

const testPageUrl = 'https://favicon.nicetab.com';
const storageKey = 'session_faviconStore';
let testFaviconBase64 = '';

// 将 favicon 保存到 sessionStorage 中
function saveFaviconToStore(origin: string, faviconUrl: string) {
  const faviconStoreContent = sessionStorage.getItem(storageKey) || '{}';
  const faviconStore = JSON.parse(faviconStoreContent);
  faviconStore[origin] = faviconUrl;
  sessionStorage.setItem(storageKey, JSON.stringify(faviconStore));
}
// 从 sessionStorage 中获取 favicon
function getFaviconFromStore(origin: string) {
  const faviconStoreContent = sessionStorage.getItem(storageKey) || '{}';
  const faviconStore = JSON.parse(faviconStoreContent);
  return faviconStore[origin];
}

// 初始化 _favicon api 兜底图base64值（在 dom 环境中调用）
export async function initFaviconApiData() {
  const testFaviconUrl = getFaviconByExtApi(testPageUrl);
  testFaviconBase64 = await getBase64Value(testFaviconUrl);
}

// 获取图片链接对应的base64值
export async function getBase64Value(imageUrl: string): Promise<string> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      let canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      canvas.getContext('2d')?.drawImage(image, 0, 0, 32, 32);
      const base64 = canvas
        .toDataURL('image/png')
        .replace(/^data:image\/png;base64,/, '');
      resolve(base64);
    };
    image.onerror = () => {
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
// 获取网站图标
export async function getFaviconUrl(pageUrl: string, size: number = 32) {
  const origin = getOrigin(pageUrl);
  const faviconFromStore = getFaviconFromStore(origin);
  if (faviconFromStore) return faviconFromStore;

  if (!testFaviconBase64) {
    await initFaviconApiData();
  }

  const _faviconUrlByExt = getFaviconByExtApi(pageUrl, size);
  const base64 = await getBase64Value(_faviconUrlByExt);

  if (base64 !== testFaviconBase64) {
    saveFaviconToStore(origin, _faviconUrlByExt);
    return _faviconUrlByExt;
  } else {
    return getGstaticURL(pageUrl, size);
  }
}

export default {
  initFaviconApiData,
  getBase64Value,
  getFaviconUrl,
};
