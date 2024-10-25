// 拼接url
export function handleUrlWidthParams(
  url: string,
  params: Record<string, any> = {}
): string {
  const urlObject = new URL(url);
  const searchParams = new URLSearchParams(urlObject.search);
  for (const [key, value] of Object.entries(params)) {
    if (!searchParams.has(key)) searchParams.append(key, value);
  }

  urlObject.search = searchParams.toString();
  return urlObject.toString();
}

// 解析url参数
export function getUrlParams(url?: string): Record<string, string> {
  const urlObj = new URL(url || window.location.href);
  const searchParams = new URLSearchParams(urlObj.search);
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}
// 对象转化为url参数
export function objectToUrlParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && value !== '') {
      searchParams.append(key, value);
    }
  }

  return searchParams.toString();
}

// 获取网站 favicon
export function getFaviconURL(pageUrl: string, size: number = 16) {
  let pageOrigin = pageUrl;
  try {
    pageOrigin = new URL(pageUrl)?.origin || pageUrl;
  } catch {
    pageOrigin = pageUrl;
  }
  // 通过 favicon api 获取网站图标 (官方文档: https://developer.chrome.com/docs/extensions/how-to/ui/favicons?hl=en)
  if (pageOrigin.includes('extension://')) {
    const apiUrl = browser.runtime.getURL('/_favicon/');
    return handleUrlWidthParams(apiUrl, { pageUrl: pageOrigin, size });
  }

  // 通过 t3.gstatic.com/faviconV2 获取网站图标
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${pageOrigin}&size=${size}`;
}

export default {
  handleUrlWidthParams,
  getUrlParams,
  objectToUrlParams,
};
