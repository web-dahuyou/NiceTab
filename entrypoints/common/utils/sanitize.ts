import emojiRegex from 'emoji-regex';

/**
 * 过滤emoji表情符号
 * @param content 需要过滤的字符串
 * @param replacement 替换字符，默认为空字符串
 * @returns 过滤后的字符串
 */
export function filterEmoji(content: string, replacement: string = ''): string {
  if (!content) return content;
  const emojiReg = emojiRegex();
  return content.replaceAll(emojiReg, replacement);
}

/**
 * 过滤4字节UTF-8字符（包括emoji和其他补充平面字符）
 * MySQL的utf8编码只支持3字节字符，而utf8mb4支持4字节字符
 * 如果数据库使用的是utf8而非utf8mb4，则需要过滤掉4字节字符
 * @param content 需要过滤的字符串
 * @param replacement 替换字符，默认为空字符串
 * @returns 过滤后的字符串
 */
export function filter4ByteChars(content: string, replacement: string = ''): string {
  if (!content) return content;
  // 匹配所有4字节UTF-8字符（包括emoji和其他补充平面字符）
  return content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, replacement);
}

/**
 * 过滤MySQL中可能导致问题的特殊字符
 * @param content 需要过滤的字符串
 * @param replacement 替换字符，默认为空字符串
 * @returns 过滤后的字符串
 */
export function filterMySQLSpecialChars(
  content: string,
  replacement: string = '',
): string {
  if (!content) return content;
  // 过滤MySQL中可能导致问题的特殊字符，如NULL字节、控制字符等
  return content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, replacement);
}

export function sanitizeContent(content: string, replacement: string = ''): string {
  if (!content) return content;

  // 先过滤emoji
  let result = filterEmoji(content, replacement);

  // 再过滤其他4字节UTF-8字符
  result = filter4ByteChars(result, replacement);

  // 最后过滤MySQL特殊字符
  result = filterMySQLSpecialChars(result, replacement);

  return result;
}

export default {
  filterEmoji,
  filter4ByteChars,
  filterMySQLSpecialChars,
  sanitizeContent,
};
