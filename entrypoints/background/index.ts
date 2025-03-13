import contextMenusRegister, {
  strategyHandler,
  handleSendTabsAction,
} from '~/entrypoints/common/contextMenus';
import commandsRegister from '~/entrypoints/common/commands';
import tabUtils from '~/entrypoints/common/tabs';
import initSettingsStorageListener, {
  themeUtils,
  settingsUtils,
} from '~/entrypoints/common/storage';
import { autoSyncAlarm } from '~/entrypoints/common/alarms';
import {
  PRIMARY_COLOR,
  // TAB_EVENTS,
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
  ENUM_ACTION_NAME,
} from '~/entrypoints/common/constants';
import type { RuntimeMessageEventProps } from '~/entrypoints/types';

const {
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  SHOW_OPENED_TAB_COUNT,
  POPUP_MODULE_DISPLAYS,
} = ENUM_SETTINGS_PROPS;

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
  browser.action.setBadgeBackgroundColor({
    color: themeData?.colorPrimary || PRIMARY_COLOR,
  });

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

// 初始化 popup 交互
async function initPopup() {
  const settings = await settingsUtils.getSettings();
  const modules = settings[POPUP_MODULE_DISPLAYS] || POPUP_MODULE_NAMES;
  if (modules.length > 0) {
    console.log('配置了popup模块, 点击图标显示popup面板');
    browser.action.setPopup({ popup: 'popup.html' });
  } else {
    console.log('没有配置popup模块, 点击图标不显示popup面板， 直接发送所有标签页');
    browser.action.setPopup({ popup: '' });
  }
}

export default defineBackground(() => {
  // console.log('Hello background!', { id: browser.runtime.id });
  // 设置插件图标徽标
  setBadge();
  // 初始化 popup 交互
  initPopup();
  initSettingsStorageListener(async (settings, oldSettings) => {
    setBadge();
    initPopup();
    autoSyncAlarm.checkReset(settings, oldSettings);
  });

  // 注册 contextMenus
  contextMenusRegister();
  // 注册 commands
  commandsRegister();

  // 创建自动同步闹钟
  autoSyncAlarm.create();

  // 左键点击图标 (如果有 popup 是不会触发的，可以执行 browser.action.setPopup({ popup: '' }) 来监听事件)
  // Fired when an action icon is clicked. This event will not fire if the action has a popup.
  browser.action.onClicked.addListener(async (tab) => {
    const settings = await settingsUtils.getSettings();
    const modules = settings[POPUP_MODULE_DISPLAYS] || POPUP_MODULE_NAMES;
    if (!modules.length) {
      strategyHandler(ENUM_ACTION_NAME.SEND_ALL_TABS);
    }
  });

  browser.runtime.onInstalled.addListener(async () => {
    console.log('browser.runtime.onInstalled');
    const settings = await settingsUtils.getSettings();
    if (settings[OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]) {
      tabUtils.openAdminRoutePage({ path: '/home' });
    }
  });

  browser.runtime.onMessage.addListener(async (msg: unknown, msgSender, sendResponse) => {
    // console.log('browser.runtime.onMessage--background--msg', msg);
    const {
      msgType,
      data,
      targetPageContext = 'background',
    } = (msg || {}) as RuntimeMessageEventProps;

    if (msgType === 'setPrimaryColor') {
      const colorPrimary = data?.colorPrimary || PRIMARY_COLOR;
      await themeUtils.setThemeData({ colorPrimary });
      if (targetPageContext === 'contentScriptPage') {
        tabUtils.sendTabMessage({ msgType: 'setThemeData', data: { colorPrimary } });
      }
      setBadge();
    } else if (msgType === 'setThemeData') {
      await themeUtils.setThemeData(data);
      if (targetPageContext === 'contentScriptPage') {
        tabUtils.sendTabMessage({ msgType: 'setThemeData', data });
      }
      setBadge();
    } else if (msgType === 'setThemeType') {
      if (targetPageContext === 'contentScriptPage') {
        tabUtils.sendTabMessage({ msgType: 'setThemeType', data });
      }
    } else if (msgType === 'setLocale') {
      if (targetPageContext === 'contentScriptPage') {
        tabUtils.sendTabMessage({ msgType: 'setLocale', data });
      }
      setBadge();
    } else if (msgType === 'openAdminRoutePage') {
      tabUtils.openAdminRoutePage(data || {});
    } else if (msgType === 'sendTabsActionConfirm') {
      handleSendTabsAction(data.actionName, data.targetData);
    }
  });
});
