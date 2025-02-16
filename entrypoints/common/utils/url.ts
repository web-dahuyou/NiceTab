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
export function getUrlParams(url: string): Record<string, string> {
  const params: { [key: string]: string } = {};
  const queryString = url.split('?')[1];
  if (!queryString) return params;

  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }

  return params;
}
// 设置url参数
export function setUrlParams(url: string, params: Record<string, any>): string {
  const _params = getUrlParams(url);
  const baseUrl = url.split('?')[0];
  const queryString = objectToUrlParams({ ..._params, ...params });
  return `${baseUrl}?${queryString}`;
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

/**
 * @description: url是否匹配，排除某些域名
 * @param {string} url 链接
 * @param {string} excludeString 排除的域名列表字符串（可通过空格和换行分隔）
 * @return {boolean} 是否匹配（不在排除列表中）
 */
export function isUrlMatched(
  url: string | undefined,
  excludeString: string | undefined
): boolean {
  if (url && excludeString) {
    const excludeDomainList = excludeString
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      ?.split(' ')
      ?.filter(Boolean);
    const baseUrl = url?.split('?')?.[0] || url;
    for (let domain of excludeDomainList) {
      const reg = new RegExp(domain);
      if (reg.test(baseUrl)) {
        return false;
      }
    }
  }

  return true;
}

export default {
  handleUrlWidthParams,
  getUrlParams,
  objectToUrlParams,
};
