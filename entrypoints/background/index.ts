import contextMenusRegister, {
  strategyHandler,
  handleSendTabsAction,
} from '~/entrypoints/common/contextMenus';
import commandsRegister from '~/entrypoints/common/commands';
import tabUtils from '~/entrypoints/common/tabs';
import {
  initSettingsStorageListener,
  initTabListStorageListener,
  themeUtils,
  settingsUtils,
  stateUtils,
  snapshotUtils,
  tabListUtils,
} from '~/entrypoints/common/storage';
import { autoSyncAlarm, autoSaveOpenedTabsAlarm } from '~/entrypoints/common/alarms';
import {
  defaultThemeColorName,
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
  ENUM_ACTION_NAME,
  BROWSER_ACTION_API_NAME,
} from '~/entrypoints/common/constants';
import type { RuntimeMessageEventProps } from '~/entrypoints/types';

import { initBatchRemoval } from './batchRemoval';
import {
  initPopup,
  initTabEventListener,
  initTabsUpdateListener,
  initNewTabRedirectListener,
  handleSnapshotStartup,
  setBadge,
} from './handler';
import { initPortMessageListener } from './portMessage';

const {
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH,
  OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED,
  POPUP_MODULE_DISPLAYS,
} = ENUM_SETTINGS_PROPS;

export default defineBackground(() => {
  // console.log('Hello background!', { id: browser.runtime.id });
  if (!browser.extension.inIncognitoContext) {
    tabListUtils.requestRepair = initBatchRemoval(ids =>
      tabListUtils.removeTabGroups(ids),
    );
  }
  initPortMessageListener();
  initTabsUpdateListener();
  // 初始化新标签页重定向监听
  initNewTabRedirectListener();
  // 初始化tab事件
  initTabEventListener();
  // 初始化 popup 交互
  initPopup();
  initSettingsStorageListener(async (settings, oldSettings) => {
    initTabEventListener();
    initPopup();
    initNewTabRedirectListener();
    autoSyncAlarm.checkReset(settings, oldSettings);
    autoSaveOpenedTabsAlarm.checkReset(settings, oldSettings);
  });

  initTabListStorageListener(async () => {
    setTimeout(() => {
      tabUtils.sendTabMessage({
        msgType: 'action:refresh-global-search-modal',
        sendToAdminTab: true,
      });
    }, 500);
  });

  // 注册 contextMenus
  contextMenusRegister();
  // 注册 commands
  commandsRegister();

  // 创建自动同步闹钟
  autoSyncAlarm.create();
  // 按当前配置维护定时快照的采集闹钟
  autoSaveOpenedTabsAlarm.create();

  // 左键点击图标 (如果有 popup 是不会触发的，可以执行 browser[BROWSER_ACTION_API_NAME].setPopup({ popup: '' }) 来监听事件)
  // Fired when an action icon is clicked. This event will not fire if the action has a popup.
  browser[BROWSER_ACTION_API_NAME].onClicked.addListener(async tab => {
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
  browser.runtime.onInstalled.addListener(async details => {
    console.log('browser.runtime.onInstalled---', details.reason);
    await stateUtils.setStateByModule('global', { snapshotStatus: 'on' });

    if (details.reason === 'update') {
      setTimeout(async () => {
        const tabs = await browser.tabs.query({});
        const adminUrl = browser.runtime.getURL('/options.html');
        const filteredTabs = tabs.filter(tab => tab.id && !tab.url?.startsWith(adminUrl));
        for (const tab of filteredTabs) {
          browser.tabs.reload(tab.id);
        }
      }, 200);
    }

    startup();
  });
  browser.runtime.onStartup.addListener(async () => {
    console.log('browser.runtime.onStartup');

    await handleSnapshotStartup();
    startup();
  });
  browser.windows.onCreated.addListener(async () => {
    // console.log('browser.windows.onCreated');
    const settings = await settingsUtils.getSettings();
    if (settings[OPEN_ADMIN_TAB_AFTER_WINDOW_CREATED]) {
      tabUtils.openAdminRoutePage({ path: '/home' });
    }
  });

  // 每次切换都要记录聚焦时间，由快照写入队列串行处理。
  browser.windows.onFocusChanged.addListener(windowId => {
    snapshotUtils.focusScheduledWindow(windowId);
  });
  browser.windows.onRemoved.addListener(async windowId => {
    // console.log('browser.windows.onRemoved--windowId', windowId);
    stateUtils.clearSelectedKeysOfInvalidWindows();
    const windows = await browser.windows.getAll();
    if (!windows.length) {
      stateUtils.setStateByModule('global', { snapshotStatus: 'off' });
    }
  });

  // 监听浏览器关闭事件
  browser.runtime.onSuspend.addListener(async () => {
    console.log('browser.runtime.onSuspend');
  });

  browser.runtime.onMessage.addListener(async (msg: unknown) => {
    // console.log('browser.runtime.onMessage--background--msg', msg);
    const {
      msgType,
      data,
      targetPageContext = 'background',
    } = (msg || {}) as RuntimeMessageEventProps;

    if (msgType === 'setPrimaryColor') {
      const colorName = data?.colorName || defaultThemeColorName;
      await themeUtils.setThemeData({ colorName });
      if (targetPageContext === 'contentScriptPage') {
        tabUtils.sendTabMessage({ msgType: 'setThemeData', data: { colorName } });
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
