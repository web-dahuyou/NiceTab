// 合并class  示例：classNames(className1, className2, className3)
export function classNames(...classes: Array<string | boolean | undefined | null>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * @description: 生成随机字符串
 * @param digit 想要生成的随机字符串长度
 * @param isPlainNumber 随机字符串是否纯数字
 * @return 要输出的字符串
 */
export function getRandomId(digit: number = 16, isPlainNumber: boolean = false) {
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

export default {
  classNames,
  getRandomId,
  pick,
  omit,
};
