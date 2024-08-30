// 判断系统类型
export function getOSInfo() {
  const userAgent = navigator?.userAgent?.toLowerCase();
  const isWin = userAgent.includes('win32') || userAgent.includes('windows');
  const isMac =
    userAgent.includes('macintosh') ||
    userAgent.includes('mac68k') ||
    userAgent.includes('macppc') ||
    userAgent.includes('macintel');
  const isLinux = userAgent.includes('linux');
  const isUnix = userAgent.includes('x11') && !isWin && !isMac;

  return { isWin, isMac, isLinux, isUnix };
}
// 获取功能键的别名
export function getKeysByOS(): Record<string, { key: string; symbol: string }> {
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
  };
}

export default {
  getOSInfo,
  getKeysByOS,
};
