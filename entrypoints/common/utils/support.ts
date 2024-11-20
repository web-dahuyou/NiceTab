
// 浏览器是否支持 group Api
export const isGroupSupported = () => typeof browser.tabs.group === 'function' && !!browser.tabGroups;
