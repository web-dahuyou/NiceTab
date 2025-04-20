import { Tabs } from 'wxt/browser';
import contextMenusRegister, {
  strategyHandler,
  handleSendTabsAction,
} from '~/entrypoints/common/contextMenus';
import commandsRegister from '~/entrypoints/common/commands';
import tabUtils from '~/entrypoints/common/tabs';
import initSettingsStorageListener, {
  themeUtils,
  settingsUtils,
  stateUtils,
} from '~/entrypoints/common/storage';
import { autoSyncAlarm, autoSaveOpenedTabsAlarm } from '~/entrypoints/common/alarms';
import {
  PRIMARY_COLOR,
  // TAB_EVENTS,
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
  ENUM_ACTION_NAME,
  BROWSER_ACTION_API_NAME,
} from '~/entrypoints/common/constants';
import type { RuntimeMessageEventProps } from '~/entrypoints/types';

const {
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED,
  SHOW_OPENED_TAB_COUNT,
  POPUP_MODULE_DISPLAYS,
} = ENUM_SETTINGS_PROPS;

// 设置插件图标徽标
async function setBadge() {
  const settings = await settingsUtils.getSettings();
  const themeData = await themeUtils.getThemeData();
  const tabs = await tabUtils.getAllTabs();
  if (!settings[SHOW_OPENED_TAB_COUNT]) {
    browser[BROWSER_ACTION_API_NAME].setBadgeText?.({ text: '' });
  } else {
    browser[BROWSER_ACTION_API_NAME].setBadgeText({ text: String(tabs.length || 0) });
  }
  browser[BROWSER_ACTION_API_NAME].setBadgeTextColor({ color: '#fff' });
  browser[BROWSER_ACTION_API_NAME].setBadgeBackgroundColor({
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
    browser[BROWSER_ACTION_API_NAME].setPopup({ popup: 'popup.html' });
  } else {
    console.log('没有配置popup模块, 点击图标不显示popup面板， 直接发送所有标签页');
    browser[BROWSER_ACTION_API_NAME].setPopup({ popup: '' });
  }
}

// 初始化监听 tabs 更新
async function initTabsUpdateListener() {
  // 限制最多可固定一个NiceTab管理页面
  async function adminPageLimitControl(
    tabId: number,
    changeInfo: Tabs.OnUpdatedChangeInfoType,
    tab: Tabs.Tab
  ) {

    const adminTabUrl = browser.runtime.getURL('/options.html');
    const tabs = await browser.tabs.query({
      url: `${adminTabUrl}*`,
      currentWindow: true,
    });
    let pinnedAdminPageCount = 0;
    for (let tab of tabs) {
      if (tab.pinned) {
        pinnedAdminPageCount++;
      }
      if (pinnedAdminPageCount > 1) {
        browser.tabs.remove(tabId);
      }
    }
  }
  browser.tabs.onUpdated.addListener(adminPageLimitControl);
}

export default defineBackground(() => {
  // console.log('Hello background!', { id: browser.runtime.id });
  initTabsUpdateListener();
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
  // 创建自动保存已打开标签页的闹钟
  autoSaveOpenedTabsAlarm.create();

  // 左键点击图标 (如果有 popup 是不会触发的，可以执行 browser[BROWSER_ACTION_API_NAME].setPopup({ popup: '' }) 来监听事件)
  // Fired when an action icon is clicked. This event will not fire if the action has a popup.
  browser[BROWSER_ACTION_API_NAME].onClicked.addListener(async (tab) => {
    const settings = await settingsUtils.getSettings();
    const modules = settings[POPUP_MODULE_DISPLAYS] || POPUP_MODULE_NAMES;
    if (!modules.length) {
      strategyHandler(ENUM_ACTION_NAME.SEND_ALL_TABS);
    }
  });

  async function startup() {
    const settings = await settingsUtils.getSettings();
    if (settings[OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH]) {
      tabUtils.openAdminRoutePage({ path: '/home' });
    }
  }
  browser.runtime.onInstalled.addListener(() => {
    console.log('browser.runtime.onInstalled');
    startup();
  });
  browser.runtime.onStartup.addListener(() => {
    console.log('browser.runtime.onStartup');
    startup();
  });
  browser.windows.onCreated.addListener(async () => {
    console.log('browser.windows.onCreated');
    const settings = await settingsUtils.getSettings();
    if (settings[OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED]) {
      tabUtils.openAdminRoutePage({ path: '/home' });
    }
  });

  browser.windows.onRemoved.addListener(async (windowId) => {
    console.log('browser.windows.onRemoved--windowId', windowId);
    stateUtils.clearSelectedKeysOfInvalidWindows();
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
      await tabUtils.openAdminRoutePage(data || {});
      tabUtils.cancelHighlightTabs();
    } else if (msgType === 'sendTabsActionStart') {
      strategyHandler(data.actionName);
    } else if (msgType === 'sendTabsActionConfirm') {
      handleSendTabsAction(data.actionName, data.targetData);
    }
  });
});
