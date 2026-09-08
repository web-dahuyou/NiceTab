/**
 * 将代码段的每一行缩进指定数量的空格
 * @param code 代码字符串
 * @param spaces 缩进空格数，默认 2
 * @returns 缩进后的代码字符串
 */
export function indent(code: string, spaces: number = 2): string {
  const padding = ' '.repeat(spaces);
  return code
    .split('\n')
    .map(line => line.trim() ? `${padding}${line}` : line)
    .join('\n');
}
