import contextMenusRegister from '../common/contextMenus';
import tabUtils from '~/entrypoints/common/tabs';
import { ENUM_COLORS, TAB_EVENTS } from '~/entrypoints/common/constants';

// 设置插件图标徽标
async function setBadge() {
  const tabs = await tabUtils.getAllTabs();
  browser.action.setBadgeText({ text: String(tabs.length || 0) });
  browser.action.setBadgeTextColor({ color: '#fff' });
  browser.action.setBadgeBackgroundColor({ color: ENUM_COLORS.primary });

  browser.tabs.onCreated.addListener(setBadge);
  browser.tabs.onRemoved.addListener(setBadge);
  browser.tabs.onActivated.addListener(setBadge);
  browser.runtime.onInstalled.addListener(setBadge);
  // TAB_EVENTS.forEach((event) => browser.tabs[event]?.addListener(setBadge));
}

export default defineBackground(() => {
  // console.log('Hello background!', { id: browser.runtime.id });
  // 设置插件图标徽标
  setBadge();
  // 注册 contextMenus
  contextMenusRegister();

  tabUtils.openAdminTab();
});
