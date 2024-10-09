import contextMenusRegister from '~/entrypoints/common/contextMenus';
import commandsRegister from '~/entrypoints/common/commands';
import tabUtils from '~/entrypoints/common/tabs';
import initStorageListener, { themeUtils, settingsUtils } from '~/entrypoints/common/storage';
import { PRIMARY_COLOR, TAB_EVENTS, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';

const { OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH, SHOW_OPENED_TAB_COUNT } = ENUM_SETTINGS_PROPS;

// 设置插件图标徽标
async function setBadge() {
  const settings = await settingsUtils.getSettings();
  const themeData = await themeUtils.getThemeData();
  const tabs = await tabUtils.getAllTabs();
  if (!settings[SHOW_OPENED_TAB_COUNT]) {
    browser.action.setBadgeText({ text: '' });
  } else {
    browser.action.setBadgeText({ text: String(tabs.length || 0) });
  }
  browser.action.setBadgeTextColor({ color: '#fff' });
  browser.action.setBadgeBackgroundColor({ color: themeData?.colorPrimary || PRIMARY_COLOR });

  browser.tabs.onCreated.removeListener(setBadge);
  browser.tabs.onRemoved.removeListener(setBadge);
  browser.tabs.onActivated.removeListener(setBadge);
  browser.runtime.onInstalled.removeListener(setBadge);
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
  initStorageListener(async () => {
    setBadge();
  });

  // 注册 contextMenus
  contextMenusRegister();
  // 注册 commands
  commandsRegister();

  browser.runtime.onInstalled.addListener(async () => {
    const settings = await settingsUtils.getSettings();
    if (settings[OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]) {
      tabUtils.openAdminRoutePage({ path: '/home' });
    }
  });

  browser.runtime.onMessage.addListener(async (msg, msgSender, sendResponse) => {
    // console.log('browser.runtime.onMessage--background', msg, msgSender);
    const { msgType, data } = msg || {};
    if (msgType === 'setPrimaryColor') {
      const colorPrimary = data?.colorPrimary || PRIMARY_COLOR;
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
