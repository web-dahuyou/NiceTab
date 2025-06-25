import dayjs from 'dayjs';
import { FETCH_ERROR } from '~/entrypoints/common/constants';
import { handleUrlWidthParams } from './url';

// 合并class  示例：classNames(className1, className2, className3)
export function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}
// 首字母转大写
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// 驼峰转中划线 Hyphenate
export const toKebabCase = (str: string = '') => {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase();
};

// 中划线转驼峰 Camelize
export const toCamelCase = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
};

/**
 * @description: 生成随机字符串
 * @param digit 想要生成的随机字符串长度
 * @param isPlainNumber 随机字符串是否纯数字
 * @return 要输出的字符串
 */
export function getRandomId(digit: number = 8, isPlainNumber: boolean = false) {
  return 'x'.repeat(digit).replace(/[x]/g, (c) => {
    const radix = isPlainNumber ? 10 : 16;
    return ((Math.random() * radix) | 0).toString(radix);
  });
}

/**
 * @description: 从对象中挑选指定的keys
 * @param obj 原始对象
 * @param keys 想要挑选的属性列表
 * @return 返回过滤后的对象
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((result, key) => {
    if (key in obj) {
      return { ...result, [key]: obj[key] };
    } else {
      return result;
    }
  }, {} as Pick<T, K>);
}
/**
 * @description: 从对象中过滤掉指定的keys
 * @param obj 原始对象
 * @param keys 想要过滤的属性列表
 * @return 返回过滤后的对象
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return Object.keys(obj).reduce((result, key) => {
    if (keys.includes(key as K)) {
      return result;
    } else {
      return { ...result, [key]: obj[key] };
    }
  }, {} as Omit<T, K>);
}

// 将数组按照size进行分组
export const groupBySize = (list: any[], size: number = 3) => {
  const result = [];
  let index = 0;
  while (index < list.length) {
    result.push(list.slice(index, index + size));
    index += size;
  }
  return result;
};

// 生成创建时间
export const newCreateTime = (stamp: number = Date.now()) => {
  return dayjs(stamp).format('YYYY-MM-DD HH:mm');
};

/**
 * @description: 列表去重
 * @param list 原始列表
 * @param key 去重依据的字段名
 * @return 返回去重后的列表
 */
export function getUniqueList<T>(list: T[], key: keyof T): T[] {
  const existKeys = new Map();
  const result: T[] = [];
  for (const item of list) {
    if (!existKeys.has(item[key])) {
      existKeys.set(item[key], true);
      result.push(item);
    }
  }
  return result;
}

/**
 * @description: 列表去重
 * @param list 原始列表
 * @param key 合并对象依据的字段名
 * @param handler 合并去重handler
 * @return 返回合并后的列表
 */
export function getMergedList<T, K extends keyof T>(
  list: T[],
  key: K,
  handler: (previousValue: T, currentValue: T) => T
): T[] {
  const resultMap = new Map<T[K], T>();

  for (const item of list) {
    let groupValue = resultMap.get(item[key]);
    if (!groupValue) {
      groupValue = item;
    } else {
      groupValue = handler(groupValue, item);
    }
    resultMap.set(item[key], groupValue);
  }

  return [...resultMap.values()];
}

// 通用超时包装方法
export async function withTimeout<T>(promise: Promise<T>, timeout = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(FETCH_ERROR.TIMEOUT)), timeout)
    ),
  ]);
}

// 请求api
export const fetchApi = (
  url: string,
  params: Record<string, any> = {},
  options?: RequestInit & { timeout?: number },
  responseType: XMLHttpRequestResponseType = 'json'
) => {
  const timeout = options?.timeout ?? 10000; // 默认超时时间 10 秒
  const controller = new AbortController();
  const _options = {
    method: 'GET',
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // 'Content-Type': 'application/x-www-form-urlencoded',
      ...options?.headers,
    },
  };
  let _url = url;

  if (_options.method === 'GET') {
    _url = handleUrlWidthParams(url, params);
  } else {
    _options.body = JSON.stringify(params);
  }

  let timeoutId: ReturnType<typeof setTimeout>;

  return new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(FETCH_ERROR.TIMEOUT));
    }, timeout);

    fetch(_url, _options)
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (res.ok) {
          if (responseType === 'json') {
            resolve(await res.json());
          } else if (responseType === 'text') {
            resolve(await res.text());
          }
        }
        reject(await res.json());
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // console.log('fetch-err', err);
        if (err?.name === 'AbortError') {
          reject(new Error(FETCH_ERROR.ABORTED));
        } else if (
          err?.name === 'TypeError' &&
          (err?.message === 'Failed to fetch' || err?.message?.includes('NetworkError'))
        ) {
          reject(new Error(FETCH_ERROR.NETWORK_ERROR));
        } else {
          reject(err);
        }
      });
  });
};

export default {
  classNames,
  capitalize,
  toKebabCase,
  getRandomId,
  pick,
  omit,
  groupBySize,
  getUniqueList,
  getMergedList,
  fetchApi,
};
