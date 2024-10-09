import { Menus } from 'wxt/browser';
import {
  ENUM_ACTION_NAME,
  ENUM_SETTINGS_PROPS,
  TAB_EVENTS,
  defaultLanguage,
} from './constants';
import tabUtils from '~/entrypoints/common/tabs';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';
import initStorageListener, { settingsUtils } from './storage';
import { getCommandsHotkeys } from './commands';
import { pick } from './utils';

const { LANGUAGE, ALLOW_SEND_PINNED_TABS } = ENUM_SETTINGS_PROPS;

export type ContextMenuHotKeys = Record<string, string>;

export const getMenuHotkeys = async () => {
  const commandsHotkeysMap = await getCommandsHotkeys();
  const settings = await settingsUtils.getSettings();
  const language = settings[LANGUAGE] || defaultLanguage;
  const customMessages = getCustomLocaleMessages(language);
  const noneKey = customMessages['common.none'] || 'None';

  return [
    ENUM_ACTION_NAME.OPEN_ADMIN_TAB,
    ENUM_ACTION_NAME.SEND_ALL_TABS,
    ENUM_ACTION_NAME.SEND_CURRENT_TAB,
    ENUM_ACTION_NAME.SEND_OTHER_TABS,
    ENUM_ACTION_NAME.SEND_LEFT_TABS,
    ENUM_ACTION_NAME.SEND_RIGHT_TABS,
  ].reduce<ContextMenuHotKeys>((result, id) => {
    const hotkey = commandsHotkeysMap.get(id) || noneKey;
    return { ...result, [id]: hotkey };
  }, {});
};

const getMenus = async (): Promise<Menus.CreateCreatePropertiesType[]> => {
  const settings = await settingsUtils.getSettings();
  const language = settings[LANGUAGE] || defaultLanguage;
  const customMessages = getCustomLocaleMessages(language);

  const tabs = await browser.tabs.query({ currentWindow: true });
  const { tab: adminTab } = await tabUtils.getAdminTabInfo();
  const currTab = tabs?.find((tab) => tab.highlighted);
  const filteredTabs = await tabUtils.getFilteredTabs(tabs, settings);

  const hotkeysMap = await getMenuHotkeys();

  const _openAdminTab: Menus.CreateCreatePropertiesType = {
    id: ENUM_ACTION_NAME.OPEN_ADMIN_TAB,
    title:
      customMessages['common.openAdminTab'] +
      ` (${hotkeysMap?.[ENUM_ACTION_NAME.OPEN_ADMIN_TAB]})`,
    contexts: ['all'],
  };

  const _sendAllTabs: Menus.CreateCreatePropertiesType = {
    id: ENUM_ACTION_NAME.SEND_ALL_TABS,
    title:
      customMessages['common.sendAllTabs'] +
      ` (${hotkeysMap?.[ENUM_ACTION_NAME.SEND_ALL_TABS]})`,
    contexts: ['all'],
    enabled: filteredTabs?.length > 0,
  };

  const _sendCurrentTab: Menus.CreateCreatePropertiesType = {
    id: ENUM_ACTION_NAME.SEND_CURRENT_TAB,
    title:
      customMessages['common.sendCurrentTab'] +
      ` (${hotkeysMap?.[ENUM_ACTION_NAME.SEND_CURRENT_TAB]})`,
    contexts: ['all'],
    enabled:
      !!currTab?.id &&
      currTab?.id != adminTab?.id &&
      !(currTab?.pinned && !settings[ALLOW_SEND_PINNED_TABS]),
  };

  const _sendOtherTabs: Menus.CreateCreatePropertiesType = {
    id: ENUM_ACTION_NAME.SEND_OTHER_TABS,
    title:
      customMessages['common.sendOtherTabs'] +
      ` (${hotkeysMap?.[ENUM_ACTION_NAME.SEND_OTHER_TABS]})`,
    contexts: ['all'],
    enabled: !!currTab?.id,
  };

  const _sendLeftTabs: Menus.CreateCreatePropertiesType = {
    id: ENUM_ACTION_NAME.SEND_LEFT_TABS,
    title:
      customMessages['common.sendLeftTabs'] +
      ` (${hotkeysMap?.[ENUM_ACTION_NAME.SEND_LEFT_TABS]})`,
    contexts: ['all'],
    enabled: !!currTab?.id && currTab?.index > 0,
  };

  const _sendRightTabs: Menus.CreateCreatePropertiesType = {
    id: ENUM_ACTION_NAME.SEND_RIGHT_TABS,
    title:
      customMessages['common.sendRightTabs'] +
      ` (${hotkeysMap?.[ENUM_ACTION_NAME.SEND_RIGHT_TABS]})`,
    contexts: ['all'],
    enabled: !!currTab?.id && currTab?.index < tabs.length - 1,
  };

  return [
    _openAdminTab,
    _sendAllTabs,
    _sendCurrentTab,
    _sendOtherTabs,
    _sendLeftTabs,
    _sendRightTabs,
  ];
};

// 创建 contextMenus
async function createContextMenus(callback?: () => void) {
  const menus = await getMenus();
  for (let menu of menus) {
    await browser.contextMenus.create(menu);
  }
  callback?.();
}

// 根据标签页状态更新 contextMenus
async function handleContextMenusUpdate() {
  const menus = await getMenus();
  for (let menu of menus) {
    if (menu.id) browser.contextMenus.update(menu.id, pick(menu, ['title', 'enabled']));
  }
}

export async function actionHandler(actionName: string) {
  switch (actionName) {
    case ENUM_ACTION_NAME.SEND_ALL_TABS:
      await tabUtils.sendAllTabs();
      break;
    case ENUM_ACTION_NAME.SEND_CURRENT_TAB:
      await tabUtils.sendCurrentTab();
      break;
    case ENUM_ACTION_NAME.SEND_OTHER_TABS:
      await tabUtils.sendOtherTabs();
      break;
    case ENUM_ACTION_NAME.SEND_LEFT_TABS:
      await tabUtils.sendLeftTabs();
      break;
    case ENUM_ACTION_NAME.SEND_RIGHT_TABS:
      await tabUtils.sendRightTabs();
      break;
    case ENUM_ACTION_NAME.OPEN_ADMIN_TAB:
      await tabUtils.openAdminRoutePage({ path: '/home' });
      break;
    default:
      break;
  }
}

// 注册 contextMenus
export default async function contextMenusRegister() {
  await browser.contextMenus.removeAll();
  createContextMenus(() => {
    TAB_EVENTS.forEach((event) => {
      browser.tabs[event]?.addListener(handleContextMenusUpdate);
    });
  });

  initStorageListener(handleContextMenusUpdate);

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    // console.log('info', info);
    // console.log('tab', tab);

    const actionName = String(info.menuItemId);
    try {
      await actionHandler(actionName);
      if (actionName === ENUM_ACTION_NAME.OPEN_ADMIN_TAB) return;
      tabUtils.executeContentScript(actionName);
    } catch (error) {
      console.error(error);
      tabUtils.executeContentScript(actionName, 'error');
    }
  });
}
