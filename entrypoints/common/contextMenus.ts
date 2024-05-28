import { Menus } from 'wxt/browser';
import { ENUM_ACTION_NAME, ENUM_SETTINGS_PROPS } from './constants';
import tabUtils from '~/entrypoints/common/tabs';
import { TAB_EVENTS } from '~/entrypoints/common/constants';
import { settingsUtils } from './storage';

const { ALLOW_SEND_PINNED_TABS } = ENUM_SETTINGS_PROPS;

const menus: Menus.CreateCreatePropertiesType[] = [
  { id: ENUM_ACTION_NAME.SEND_ALL_TABS, title: '发送全部标签页', contexts: ['all'] },
  { id: ENUM_ACTION_NAME.SEND_CURRENT_TAB, title: '发送当前标签页', contexts: ['all'] },
  {
    id: ENUM_ACTION_NAME.OPEN_ADMIN_TAB,
    title: '打开NiceTab管理后台',
    contexts: ['all'],
  },
  { id: ENUM_ACTION_NAME.SEND_OTHER_TABS, title: '发送其他标签页', contexts: ['all'] },
  { id: ENUM_ACTION_NAME.SEND_LEFT_TABS, title: '发送左侧标签页', contexts: ['all'] },
  { id: ENUM_ACTION_NAME.SEND_RIGHT_TABS, title: '发送右侧标签页', contexts: ['all'] },
];

// 创建 contextMenus
function createContextMenus() {
  menus.forEach((menu) => {
    browser.contextMenus.create(menu);
  });
}

// 根据标签页状态更新 contextMenus
async function handleContextMenusUpdate() {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const currTab = tabs?.find((tab) => tab.highlighted);

  // 获取插件设置
  const settings = await settingsUtils.getSettings();
  const filteredTabs = await tabUtils.getFilteredTabs(tabs, settings);

  browser.contextMenus.update(ENUM_ACTION_NAME.SEND_CURRENT_TAB, {
    enabled: !!currTab?.id && !(currTab?.pinned && !settings[ALLOW_SEND_PINNED_TABS]),
  });
  browser.contextMenus.update(ENUM_ACTION_NAME.SEND_OTHER_TABS, {
    enabled: !!currTab?.id,
  });
  browser.contextMenus.update(ENUM_ACTION_NAME.SEND_LEFT_TABS, {
    enabled: !!currTab?.id && currTab?.index > 0,
  });
  browser.contextMenus.update(ENUM_ACTION_NAME.SEND_RIGHT_TABS, {
    enabled: !!currTab?.id && currTab?.index < tabs.length - 1,
  });
  browser.contextMenus.update(ENUM_ACTION_NAME.SEND_ALL_TABS, {
    enabled: filteredTabs?.length > 0,
  });
}

export default function contextMenusRegister() {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.removeAll();
    createContextMenus();
  });

  TAB_EVENTS.forEach((event) =>
    browser.tabs[event]?.addListener(handleContextMenusUpdate)
  );

  browser.contextMenus.onClicked.addListener((info, tab) => {
    // console.log('info', info);
    console.log('tab', tab);

    const actionName = String(info.menuItemId);
    switch (actionName) {
      case ENUM_ACTION_NAME.SEND_ALL_TABS:
        tabUtils.sendAllTabs();
        break;
      case ENUM_ACTION_NAME.SEND_CURRENT_TAB:
        tabUtils.sendCurrentTab();
        break;
      case ENUM_ACTION_NAME.SEND_OTHER_TABS:
        tabUtils.sendOtherTabs();
        break;
      case ENUM_ACTION_NAME.SEND_LEFT_TABS:
        tabUtils.sendLeftTabs(tab);
        break;
      case ENUM_ACTION_NAME.SEND_RIGHT_TABS:
        tabUtils.sendRightTabs(tab);
        break;
      case ENUM_ACTION_NAME.OPEN_ADMIN_TAB:
        tabUtils.openAdminTab();
        break;
      default:
        break;
    }
  });
}
