import { satisfies } from 'compare-versions';

// 浏览器是否支持 group Api
export const isGroupSupported = () =>
  typeof browser.tabs.group === 'function' && !!browser.tabGroups;

// firefox 浏览器是否支持 group Api
export const isFirefoxTabGroupSupported = async () => {
  if (!import.meta.env.FIREFOX) return false;

  const { version } = await browser.runtime.getBrowserInfo();
  if (satisfies(version, '<139')) return false;
  return typeof browser.tabs.group === 'function';
};

// 特性检测：先看 API 是否存在
export async function checkPermission(permissions: string[] = []) {
  // 如果支持但还没被授予权限，按需请求
  const granted = await browser.permissions.contains({ permissions });

  if (granted) {
    console.log(`已具有 ${permissions} 权限`);
    return true;
  }

  return false;
}
