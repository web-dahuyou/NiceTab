import dayjs from 'dayjs';

// 合并class  示例：classNames(className1, className2, className3)
export function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}
// 首字母转大写
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 拼接url
export function handleUrlWidthParams(url: string, params: Record<string, any> = {}): string {
  const urlObject = new URL(url);
  const searchParams = new URLSearchParams(urlObject.search);
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, value);
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

/**
 * @description: 生成随机字符串
 * @param digit 想要生成的随机字符串长度
 * @param isPlainNumber 随机字符串是否纯数字
 * @return 要输出的字符串
 */
export function getRandomId(digit: number = 8, isPlainNumber: boolean = false) {
  return 'x'.repeat(digit).replace(/[x]/g, (c) => {
    return ((Math.random() * digit) | 0).toString(isPlainNumber ? 10 : 16);
  });
}

/**
 * @description: 从对象中挑选指定的keys
 * @param obj 原始对象
 * @param keys 想要挑选的属性列表
 * @return 返回过滤后的对象
 */
export function pick(
  obj: Record<string | number | symbol, any>,
  keys: Array<keyof typeof obj>
) {
  return Object.keys(obj).reduce((result, key) => {
    if (key && keys.includes(key)) {
      return { ...result, [key]: obj[key] };
    } else {
      return result;
    }
  }, {});
}
/**
 * @description: 从对象中过滤掉指定的keys
 * @param obj 原始对象
 * @param keys 想要过滤的属性列表
 * @return 返回过滤后的对象
 */
export function omit(
  obj: Record<string | number | symbol, any>,
  keys: Array<keyof typeof obj>
) {
  return Object.keys(obj).reduce((result, key) => {
    if (key && keys.includes(key)) {
      return result;
    } else {
      return { ...result, [key]: obj[key] };
    }
  }, {});
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
export const newCreateTime = () => {
  return dayjs().format('YYYY-MM-DD HH:mm');
}

// 发送消息
export function sendBrowserMessage(msgType: string, data: Record<string, any>) {
  browser.runtime.sendMessage({ msgType, data });
}

// 判断系统类型
export function getOSInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isWin = userAgent.includes('win32') || userAgent.includes('windows');
  const isMac = userAgent.includes('macintosh') || userAgent.includes('mac68k') || userAgent.includes('macppc') || userAgent.includes('macintel');
  const isLinux = userAgent.includes('linux');
  const isUnix = userAgent.includes('x11') && !isWin && !isMac;

  return { isWin, isMac, isLinux, isUnix };
}
// 获取功能键的别名
export function getKeysByOS (): Record<string, { key: string, symbol: string }> {
  const osInfo = getOSInfo();

  return {
    command: { key: 'Command', symbol: osInfo.isMac ? '⌘' : 'Ctrl' },
    cmd: { key: 'Command', symbol: osInfo.isMac ? '⌘' : 'Ctrl' },
    option: { key: 'Option', symbol: osInfo.isMac ? '⌥' : 'Alt' },
    alt: { key: 'Alt', symbol: osInfo.isMac ? '⌥' : 'Alt' },
    control: { key: 'Control', symbol: osInfo.isMac ? '⌃' : 'Ctrl' },
    ctrl: { key: 'Ctrl', symbol: osInfo.isMac ? '⌃' : 'Ctrl' },
    shift: { key: 'Shift', symbol: osInfo.isMac ? '⇧' : 'Shift' },
    up: { key: 'ArrowUp', symbol: '↑' },
    down: { key: 'ArrowDown', symbol: '↓' },
    left: { key: 'ArrowLeft', symbol: '←' },
    right: { key: 'ArrowRight', symbol: '→' },
  }
}

export default {
  classNames,
  getRandomId,
  handleUrlWidthParams,
  getUrlParams,
  pick,
  omit,
  groupBySize,
  sendBrowserMessage
};
