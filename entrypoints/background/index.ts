import contextMenusRegister from '../common/contextMenus';
import tabUtils from '~/entrypoints/common/tabs';
import { themeUtils } from '~/entrypoints/common/storage';
import { ENUM_COLORS, TAB_EVENTS } from '~/entrypoints/common/constants';

// 设置插件图标徽标
async function setBadge() {
  const themeData = await themeUtils.getThemeData();
  const tabs = await tabUtils.getAllTabs();
  browser.action.setBadgeText({ text: String(tabs.length || 0) });
  browser.action.setBadgeTextColor({ color: '#fff' });
  browser.action.setBadgeBackgroundColor({ color: themeData?.colorPrimary || ENUM_COLORS.primary });

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

  browser.runtime.onMessage.addListener(async (msg, msgSender, sendResponse) => {
    // console.log('browser.runtime.onMessage--background', msg);
    const { msgType, data } = msg || {};
    if (msgType === 'setPrimaryColor') {
      const colorPrimary = data?.colorPrimary || ENUM_COLORS.primary;
      await themeUtils.setThemeData({ colorPrimary });
      setBadge();
    } else if (msgType === 'setThemeData') {
      await themeUtils.setThemeData(data);
      setBadge();
    } else if (msgType === 'openAdminRoutePage') {
      tabUtils.openAdminRoutePage(data || {});
    }
  });
});
