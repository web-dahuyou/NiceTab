// 拼接url
export function handleUrlWidthParams(
  url: string,
  params: Record<string, any> = {},
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

// 获取origin
export function getOrigin(url: string): string {
  let pageOrigin = url;
  try {
    pageOrigin = new URL(url)?.origin || url;
  } catch {
    pageOrigin = url;
  }

  return pageOrigin;
}
// 获取domain
export function getBaseDomain(url: string): string {
  if (!url) return 'undefined';

  // 补全协议
  if (url.startsWith('//')) {
    url = 'http:' + url;
  }
  if (!url.includes('://')) {
    url = 'http://' + url;
  }

  // 提取域名部分
  let domain = url.split('://')[1].split('/')[0];

  // 移除端口号、查询参数和片段标识符
  domain = domain.split(':')[0].split('?')[0].split('#')[0];

  // 移除 `www.` 前缀
  // if (domain.toLowerCase().startsWith('www.')) {
  //   domain = domain.substring('www.'.length);
  // }

  return domain.toLowerCase();
}

/**
 * @description: 该域名的链接是否符合要求，排除指定域名
 * @param {string} url 链接
 * @param {string} excludeString 排除的域名列表字符串（可通过空格和换行分隔）
 * @return {boolean} 是否符合要求（不在排除列表中）
 */
export function isDomainAllowed(
  url: string | undefined,
  excludeString: string | undefined,
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

/**
 * @description: 判断两个url是否相同（参数相同，顺序可不同）
 * @param {string} url1 链接1
 * @param {string} url2 链接2
 * @return {boolean} 是否相同
 */
export function isSameUrl(url1: string, url2: string): boolean {
  if (url1 === url2) return true;

  try {
    // 对于非标准协议的 URL，直接比较
    if (!url1?.includes('://') || !url2?.includes('://')) {
      return url1 === url2;
    }

    const url1Obj = new URL(url1);
    const url2Obj = new URL(url2);

    // 比较协议、主机名和路径
    if (
      // url1Obj.protocol !== url2Obj.protocol ||
      url1Obj.hostname !== url2Obj.hostname ||
      url1Obj.pathname !== url2Obj.pathname
    ) {
      return false;
    }

    // 获取查询参数
    const params1 = url1Obj.searchParams;
    const params2 = url2Obj.searchParams;

    // 比较参数数量
    if (params1.size !== params2.size) {
      return false;
    }

    // 比较每个参数的键值对
    for (const [key, value] of params1) {
      if (!params2.has(key) || params2.get(key) !== value) {
        return false;
      }
    }

    return true;
  } catch (e) {
    // 如果 URL 解析失败，则直接比较字符串
    return url1 === url2;
  }
}

export default {
  handleUrlWidthParams,
  getUrlParams,
  objectToUrlParams,
  getOrigin,
  getBaseDomain,
  isSameUrl,
};
