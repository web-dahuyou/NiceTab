import { Menus } from 'wxt/browser';
import { LanguageTypes } from '~/entrypoints/types';
import { ENUM_ACTION_NAME, ENUM_SETTINGS_PROPS, TAB_EVENTS, defaultLanguage } from './constants';
import tabUtils from '~/entrypoints/common/tabs';
import initStorageListener, { settingsUtils } from './storage';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';

const { LANGUAGE, ALLOW_SEND_PINNED_TABS } = ENUM_SETTINGS_PROPS;

const getMenus = async (): Promise<Menus.CreateCreatePropertiesType[]> => {
  const settings = await settingsUtils.getSettings();
  const language = settings[LANGUAGE] as LanguageTypes || defaultLanguage;
  const customMessages = getCustomLocaleMessages(language);

  return [
    { id: ENUM_ACTION_NAME.SEND_ALL_TABS, title: customMessages['common.sendAllTabs'], contexts: ['all'] },
    { id: ENUM_ACTION_NAME.SEND_CURRENT_TAB, title: customMessages['common.sendCurrentTab'], contexts: ['all'] },
    { id: ENUM_ACTION_NAME.OPEN_ADMIN_TAB, title: customMessages['common.openAdminPage'], contexts: ['all'] },
    { id: ENUM_ACTION_NAME.SEND_OTHER_TABS, title: customMessages['common.sendOtherTabs'], contexts: ['all'] },
    { id: ENUM_ACTION_NAME.SEND_LEFT_TABS, title: customMessages['common.sendLeftTabs'], contexts: ['all'] },
    { id: ENUM_ACTION_NAME.SEND_RIGHT_TABS, title: customMessages['common.sendRightTabs'], contexts: ['all'] },
  ];
};

// 创建 contextMenus
async function createContextMenus() {
  const menus = await getMenus();
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
  initStorageListener(() => {
    browser.contextMenus.removeAll();
    createContextMenus();
  });

  TAB_EVENTS.forEach((event) =>
    browser.tabs[event]?.addListener(handleContextMenusUpdate)
  );

  browser.contextMenus.onClicked.addListener((info, tab) => {
    // console.log('info', info);
    // console.log('tab', tab);

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
