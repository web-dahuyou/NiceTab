import { Tabs } from 'wxt/browser';
import { debounce } from 'lodash-es';
import { settingsUtils, tabListUtils, stateUtils } from './storage';
import type {
  SettingsProps,
  ActionNames,
  SendTargetProps,
  SendTabMsgEventProps,
} from '~/entrypoints/types';
import {
  ENUM_SETTINGS_PROPS,
  defaultLanguage,
  USER_GUIDE_URL_MAP,
} from '~/entrypoints/common/constants';
import {
  objectToUrlParams,
  setUrlParams,
  getRandomId,
  isGroupSupported,
  isDomainAllowed,
  isContentMatched,
  sendRuntimeMessage,
} from '~/entrypoints/common/utils';
import { getCustomLocaleMessages } from '~/entrypoints/common/locale';

const {
  LANGUAGE,
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  ACTION_AUTO_CLOSE_FLAGS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TABS,
  EXCLUDE_DOMAINS_FOR_SENDING,
  RESTORE_IN_NEW_WINDOW,
} = ENUM_SETTINGS_PROPS;

// const matchUrls: string[] = ['https://*/*', 'http://*/*', 'chrome://*/*', 'file://*/*'];

// 向tab页发送消息
export async function sendTabMessage(
  {
    msgType,
    data,
    onlyCurrentTab = false,
    onlyCurrentWindow = false,
    sendToAdminTab = false,
  }: SendTabMsgEventProps,
  errorCallback?: () => void,
) {
  if (onlyCurrentTab) {
    const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = currentTabs?.[0];

    if (currentTab?.id) {
      try {
        const res = await browser.tabs.sendMessage(currentTab?.id, { msgType, data });
        console.log('browser.tabs.sendMessage__result', res);
      } catch (error) {
        console.log('browser.tabs.sendMessage__error', error);
        errorCallback?.();
      }
    }
    return;
  }

  let windows = [];
  if (onlyCurrentWindow) {
    windows = [await browser.windows.getCurrent({ populate: true })];
  } else {
    windows = await browser.windows.getAll({ populate: true, windowTypes: ['normal'] });
  }

  for (const win of windows) {
    const { tab: adminTab } = await getAdminTabInfo(win.id);
    const allTabs = await getAllTabs(win.id);
    const filteredTabs = allTabs.filter(tab => {
      if (!tab?.id) return false;
      if (!sendToAdminTab && adminTab && adminTab.id === tab.id) return false;
      return true;
    });

    filteredTabs?.forEach(async tab => {
      try {
        const res = await browser.tabs.sendMessage(tab.id!, { msgType, data });
        console.log('browser.tabs.sendMessage__result', res);
      } catch (error) {
        console.log('browser.tabs.sendMessage__error', error);
      }
    });
  }
}
// 执行contentScript展示message提示
export async function executeContentScript(
  actionName: string,
  resultType: 'success' | 'error' = 'success',
) {
  const settings = await settingsUtils.getSettings();
  const language = settings[LANGUAGE] || defaultLanguage;
  const customMessages = getCustomLocaleMessages(language);
  const openAdminTabAfterSendTabs = settings[OPEN_ADMIN_TAB_AFTER_SEND_TABS];
  const closeTabsAfterSendTabs = settings[CLOSE_TABS_AFTER_SEND_TABS];
  const actionAutoCloseFlags = settings[ACTION_AUTO_CLOSE_FLAGS];

  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const currentTab = tabs?.[0];
  const _actionName: ActionNames = actionName.replace('action:', '') as ActionNames;
  if (
    currentTab?.id &&
    !openAdminTabAfterSendTabs &&
    !closeTabsAfterSendTabs &&
    !actionAutoCloseFlags?.includes(_actionName)
  ) {
    const status = resultType === 'success' ? 'success' : 'failed';

    sendTabMessage({
      msgType: 'action:callback-message',
      data: {
        type: resultType,
        content: `${customMessages[`common.${status}`]}: ${customMessages[`common.${_actionName}` as keyof typeof customMessages]
          }`,
      },
      onlyCurrentTab: true,
    });
  }
}

export async function getAdminTabInfo(windowId?: number) {
  const adminTabUrl = browser.runtime.getURL('/options.html');
  const queryInfo: Tabs.QueryQueryInfoType = { url: `${adminTabUrl}*` };
  if (windowId) {
    queryInfo.windowId = windowId;
  } else {
    queryInfo.currentWindow = true;
  }
  const [tab] = await browser.tabs.query(queryInfo);

  return { tab, adminTabUrl };
}
// 打开管理后台
export async function openAdminRoutePage(
  route: { path: string; query?: Record<string, string> },
  needOpen = true,
) {
  const paramsStr = objectToUrlParams(route?.query || {});
  const settings = await settingsUtils.getSettings();
  const { tab, adminTabUrl } = await getAdminTabInfo();
  const urlWithParams = `${adminTabUrl}#${route.path || '/home'}${paramsStr ? `?${paramsStr}` : ''
    }`;

  // 如果发送标签页后不需要打开管理后台页面
  if (!needOpen) {
    if (!tab?.id) return;
    // 如果存在打开的nicetab管理后台页，则刷新管理后台页
    await browser.tabs.update(tab.id, { url: urlWithParams });
    return;
  }

  if (tab?.id) {
    await browser.tabs.move(tab.id, { index: 0 });
    await browser.tabs.update(tab.id, {
      highlighted: true,
      pinned: !!settings[AUTO_PIN_ADMIN_TAB],
      url: urlWithParams,
    });
    // browser.tabs.reload(tab.id); // 这个方法会清空路由参数，切记
  } else {
    await browser.tabs.create({
      index: 0,
      url: urlWithParams,
      pinned: !!settings[AUTO_PIN_ADMIN_TAB],
    });
  }

  cancelHighlightTabs();
}
// 多窗口时，刷新其他窗口的管理后台页面
export async function reloadOtherAdminPage() {
  const currWindow = await browser.windows.getCurrent();
  sendRuntimeMessage({
    msgType: 'reloadOtherAdminPage',
    data: { currWindowId: currWindow.id },
    targetPageContexts: ['optionsPage'],
  });
}
// 更新管理后台页面的URL参数，页面判断params中的randomId有更新则重新加载数据
export async function updateAdminPageUrl() {
  const { tab } = await getAdminTabInfo();
  if (!tab?.id) return;

  const newUrl = setUrlParams(tab.url || '', { randomId: getRandomId(6) });
  await browser.tabs.update(tab.id, { url: newUrl });
}
export const updateAdminPageUrlDebounced = debounce(updateAdminPageUrl, 500);

// 打开管理后台
export async function openAdminTab(
  settingsData?: SettingsProps,
  params?: { tagId: string; groupId: string },
) {
  const settings = settingsData || (await settingsUtils.getSettings());
  const openAdminTabAfterSendTabs = settings[OPEN_ADMIN_TAB_AFTER_SEND_TABS];
  await openAdminRoutePage({ path: '/home', query: params }, openAdminTabAfterSendTabs);
}
// 获取过滤后的标签页
export async function getFilteredTabs(
  tabs: Tabs.Tab[],
  settings: SettingsProps,
  validator?: (tab: Tabs.Tab) => boolean,
) {
  const { tab: adminTab } = await getAdminTabInfo();
  return tabs.filter(tab => {
    if (!tab?.id) return false;
    if (adminTab && adminTab.id === tab.id) return false;
    // 如果设置不允许发送固定标签页，则过滤掉固定标签页
    if (tab.pinned && !settings[ALLOW_SEND_PINNED_TABS]) {
      return false;
    }
    const excludeDomainsString = settings[EXCLUDE_DOMAINS_FOR_SENDING] || '';
    if (tab.url && excludeDomainsString) {
      const isAllowed = isDomainAllowed(tab.url, excludeDomainsString);
      if (!isAllowed) {
        return false;
      }
    }

    if (validator) {
      return validator(tab);
    }
    return true;
  });
}
// 取消标签页高亮
export async function cancelHighlightTabs(tabs?: Tabs.Tab[]) {
  await new Promise(res => setTimeout(res, 50));
  if (tabs) {
    tabs.forEach(tab => {
      tab?.highlighted &&
        browser.tabs.update(tab.id, { highlighted: false, active: false });
    });
  } else {
    const highlightedTabs = await browser.tabs.query({
      highlighted: true,
      currentWindow: true,
    });
    const { tab: adminTab } = await getAdminTabInfo();
    highlightedTabs.forEach(tab => {
      if (adminTab && adminTab.id !== tab.id) {
        browser.tabs.update(tab.id, { highlighted: false, active: false });
      }
    });
  }
}
// 获取全部标签页
export async function getAllTabs(windowId?: number) {
  const queryInfo: Tabs.QueryQueryInfoType = {};
  if (windowId) {
    queryInfo.windowId = windowId;
  } else {
    queryInfo.currentWindow = true;
  }
  return await browser.tabs.query(queryInfo);
}

// 发送标签页逻辑
async function sendAllTabs(targetData: SendTargetProps = {}) {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    currentWindow: true,
  });

  // 获取插件设置
  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(tabs, settings);
  if (!filteredTabs?.length) return;
  const { tagId, groupId } = await tabListUtils.createTabs(filteredTabs, targetData);
  await openAdminTab(settings, { tagId, groupId });
  const actionAutoCloseFlags = settings[ACTION_AUTO_CLOSE_FLAGS];
  if (
    settings[CLOSE_TABS_AFTER_SEND_TABS] ||
    actionAutoCloseFlags?.includes('sendAllTabs')
  ) {
    setTimeout(() => {
      browser.tabs.remove(filteredTabs.map(t => t.id as number).filter(Boolean));
    }, 30);
  } else {
    // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
    cancelHighlightTabs(filteredTabs);
  }
}
// 发送当前选中的标签页（支持多选）
async function sendCurrentTab(targetData: SendTargetProps = {}, tab?: Tabs.Tab) {
  let filteredTabs: Tabs.Tab[] = [];
  const settings = await settingsUtils.getSettings();

  if (tab) {
    if (tab.id) {
      // 如果传入了 tab（通常来自右键菜单），检查它是否在当前高亮的标签页中
      // 如果是，则发送所有高亮的标签页（多选发送）
      // 如果不是，则只发送该特定标签页
      const highlightedTabs = await browser.tabs.query({
        highlighted: true,
        currentWindow: true,
      });

      const isHighlighted = highlightedTabs.some(t => t.id === tab.id);
      if (isHighlighted) {
        filteredTabs = await getFilteredTabs(highlightedTabs, settings);
      } else {
        filteredTabs = await getFilteredTabs([tab], settings);
      }
    }
  } else {
    const tabs = await browser.tabs.query({
      // url: matchUrls,
      highlighted: true,
      currentWindow: true,
    });
    filteredTabs = await getFilteredTabs(tabs, settings);
  }

  // 发送当前选中的标签页时，选中的标签页成组，不考虑原生标签组（即多选时，选中的非标签组的标签页和标签组中的标签页合并到一个组）
  filteredTabs = filteredTabs.map(tab => ({ ...tab, groupId: -1 }));
  if (!filteredTabs?.length) return;
  const { tagId, groupId } = await tabListUtils.createTabs(filteredTabs, targetData);
  await openAdminTab(settings, { tagId, groupId });
  const actionAutoCloseFlags = settings[ACTION_AUTO_CLOSE_FLAGS];
  if (
    settings[CLOSE_TABS_AFTER_SEND_TABS] ||
    actionAutoCloseFlags?.includes('sendCurrentTab')
  ) {
    browser.tabs.remove(filteredTabs.map(t => t.id as number).filter(Boolean));
  } else {
    // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
    cancelHighlightTabs(filteredTabs);
  }
}
async function sendOtherTabs(targetData: SendTargetProps = {}) {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    highlighted: false,
    currentWindow: true,
  });
  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(tabs, settings);
  if (!filteredTabs?.length) return;
  const { tagId, groupId } = await tabListUtils.createTabs(filteredTabs, targetData);
  openAdminTab(settings, { tagId, groupId });
  const actionAutoCloseFlags = settings[ACTION_AUTO_CLOSE_FLAGS];
  if (
    settings[CLOSE_TABS_AFTER_SEND_TABS] ||
    actionAutoCloseFlags?.includes('sendOtherTabs')
  ) {
    browser.tabs.remove(filteredTabs.map(t => t.id as number).filter(Boolean));
  }
  // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
  cancelHighlightTabs();
}
async function sendLeftTabs(targetData: SendTargetProps = {}, currTab?: Tabs.Tab) {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    currentWindow: true,
  });
  let leftTabs = [];
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    if ((currTab && tab.id === currTab?.id) || tab.active) break;
    leftTabs.push(tab);
  }

  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(leftTabs, settings);
  if (!filteredTabs?.length) return;
  const { tagId, groupId } = await tabListUtils.createTabs(filteredTabs, targetData);
  openAdminTab(settings, { tagId, groupId });
  const actionAutoCloseFlags = settings[ACTION_AUTO_CLOSE_FLAGS];
  if (
    settings[CLOSE_TABS_AFTER_SEND_TABS] ||
    actionAutoCloseFlags?.includes('sendLeftTabs')
  ) {
    browser.tabs.remove(filteredTabs.map(t => t.id as number).filter(Boolean));
  }
  // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
  cancelHighlightTabs();
}
async function sendRightTabs(targetData: SendTargetProps = {}, currTab?: Tabs.Tab) {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    currentWindow: true,
  });
  let rightTabs = [];
  for (let i = tabs.length - 1; i >= 0; i--) {
    const tab = tabs[i];
    if (tab.id === currTab?.id || tab.active) break;
    rightTabs.unshift(tab);
  }

  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(rightTabs, settings);
  if (!filteredTabs?.length) return;
  const { tagId, groupId } = await tabListUtils.createTabs(filteredTabs, targetData);
  openAdminTab(settings, { tagId, groupId });
  const actionAutoCloseFlags = settings[ACTION_AUTO_CLOSE_FLAGS];
  if (
    settings[CLOSE_TABS_AFTER_SEND_TABS] ||
    actionAutoCloseFlags?.includes('sendRightTabs')
  ) {
    browser.tabs.remove(filteredTabs.map(t => t.id as number).filter(Boolean));
  }
  // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
  cancelHighlightTabs();
}

// 打开页面后等待加载完成才能执行discard
export async function waitToDiscard(tab: Tabs.Tab) {
  let title = '',
    url = '';

  // 等待标签页加载完成后再discard
  const listener = (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType) => {
    if (tabId === tab.id) {
      if (changeInfo.title) title = changeInfo.title;
      if (changeInfo.url) url = changeInfo.url;
      if ((title && url) || changeInfo.status === 'complete') {
        browser.tabs.discard(tabId);
        browser.tabs.onUpdated.removeListener(listener);
      }
    }
  };
  browser.tabs.onUpdated.addListener(listener);
}

/*
打开新标签页
active：打开标签页是否激活
openToNext：是否紧随管理后台页之后打开
*/
export async function openNewTab(
  url?: string,
  {
    active = false,
    openToNext = false,
    discard = false,
  }: { active?: boolean; openToNext?: boolean; discard?: boolean } = {},
) {
  if (!url) return;

  if (!browser?.tabs?.create) {
    window.open(url, '_blank');
    return;
  }

  if (!openToNext) {
    const tab = await browser.tabs.create({ url, active });
    if (discard && tab.id && !active) {
      waitToDiscard(tab);
    }
    return;
  }

  const { tab } = await getAdminTabInfo();
  const newTabIndex = (tab?.index || 0) + 1;
  // 注意：如果打开标签页不想 active, 则 active 必须设置默认值为 false，
  // create 方法 active参数传 undefined 也会激活 active
  const createdTab = await browser.tabs.create({ url, active, index: newTabIndex });
  if (discard && createdTab.id && !active) {
    waitToDiscard(tab);
  }
}

// 打开标签组
export async function openNewGroup(
  groupName: string,
  urls: Array<string | undefined>,
  { discard = false, asGroup = true }: { discard?: boolean; asGroup?: boolean },
) {
  const settings = await settingsUtils.getSettings();

  if (settings[RESTORE_IN_NEW_WINDOW]) {
    const _urls = urls.filter(url => !!url) as string[];
    const windowInfo = await browser.windows.create({ focused: true, url: _urls });

    const tabs = await browser.tabs.query({ windowId: windowInfo.id, pinned: false });

    tabs
      .filter(tab => !tab.active)
      .forEach(tab => {
        if (discard && tab.id) {
          waitToDiscard(tab);
        }
      });

    if (!isGroupSupported()) return;
    if (!asGroup) return;

    const bsGroupId = await browser.tabs.group!({
      createProperties: { windowId: windowInfo.id },
      tabIds: tabs.map(tab => tab.id!),
    });
    browser.tabGroups?.update(bsGroupId, { title: groupName });
  } else {
    if (!isGroupSupported() || !asGroup) {
      for (let url of urls) {
        openNewTab(url, { discard });
      }
      return;
    }

    Promise.all(
      urls.map(url => {
        return browser.tabs.create({ url, active: false });
      }),
    ).then(async tabs => {
      const filteredTabs = tabs.filter(tab => !!tab.id);
      filteredTabs.forEach(tab => {
        if (discard && tab.id) {
          waitToDiscard(tab);
        }
      });
      const bsGroupId = await browser.tabs.group!({
        tabIds: filteredTabs.map(tab => tab.id!),
      });
      browser.tabGroups?.update(bsGroupId, { title: groupName });
    });
  }
}

// 冻结当前标签页以外的标签页
export async function discardOtherTabs() {
  const { tab: adminTab } = await getAdminTabInfo();
  const tabs = await browser.tabs.query({ currentWindow: true });
  for (let tab of tabs) {
    if (tab.id && tab.id !== adminTab?.id && !tab.active && !tab.discarded) {
      browser.tabs.discard(tab.id);
    }
  }
}

// 将已打开的标签页生保存为快照
export const saveOpenedTabsAsSnapshot = async (
  type: 'autoSave' | 'manualSave' = 'autoSave',
) => {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const { tab: adminTab } = await getAdminTabInfo();
  const filteredTabs = tabs.filter(tab => {
    if (!tab?.id) return false;
    if (adminTab && adminTab.id === tab.id) return false;
    if (tab.pinned) return false;
    return true;
  });

  if (!filteredTabs.length) return;

  const openedTabs = await tabListUtils.createOpenedTabsSnapshot(filteredTabs);
  if (type === 'autoSave') {
    await stateUtils.setStateByModule('global', { openedTabsAutoSave: openedTabs });
  } else if (type === 'manualSave') {
    await stateUtils.setStateByModule('global', { openedTabsManualSave: openedTabs });
  }
};
// 恢复快照
export const restoreOpenedTabsSnapshot = async (
  type: 'autoSave' | 'manualSave' = 'autoSave',
) => {
  const globalState = await stateUtils.getState('global');
  if (type === 'autoSave') {
    await tabListUtils.restoreTabsSnapshot(globalState.openedTabsAutoSave || []);
  } else if (type === 'manualSave') {
    await tabListUtils.restoreTabsSnapshot(globalState.openedTabsManualSave || []);
  }
};

// 设置网页标题
export const setPageTitle = async ({
  tabId,
  windowId,
}: {
  tabId?: number;
  windowId?: number;
} = {}) => {
  async function setSinglePageTitle(tabId: number) {
    try {
      // 获取标签页信息
      const tab = await browser.tabs.get(tabId);

      // 检查标签页是否包含必要的信息
      if (!tab?.url || tab.status !== 'complete') return;

      // 获取设置中的页面标题配置
      const settings = await settingsUtils.getSettings();
      const pageTitleConfig = settings.pageTitleConfig || [];

      // 查找匹配的配置项
      let newTitle = null;
      for (const config of pageTitleConfig) {
        if (!config.url || !config.title) continue;

        if (isContentMatched(tab.url, config.url, config.mode)) {
          newTitle = config.title;
          break;
        }
      }

      // 如果找到了匹配的标题配置，则通过内容脚本更新页面标题
      if (newTitle) {
        // 使用现代的executeScript API更新页面标题
        browser.scripting.executeScript({
          target: { tabId: tabId },
          func: (title: string) => {
            document.title = title;
          },
          args: [newTitle],
        });
      }
    } catch (error) {
      console.error('Error setting page title:', error);
    }
  }

  if (tabId) {
    setSinglePageTitle(tabId);
  } else {
    const windows = await browser.windows.getAll({
      populate: true,
      windowTypes: ['normal'],
    });

    for (const win of windows) {
      const allTabs = await getAllTabs(win.id);

      for (const tab of allTabs) {
        if (tab.id) {
          setSinglePageTitle(tab.id);
        }
      }
    }
  }
};

// 打开用户指南
export const openUserGuide = async () => {
  // TODO: 等英文版翻译完成后再启用
  // const settings = await settingsUtils.getSettings();
  // const language = settings.language || 'en-US';
  const language = 'zh-CN';
  const guideUrl = USER_GUIDE_URL_MAP[language];
  openNewTab(guideUrl, {
    active: true,
    openToNext: true,
  });
};

export default {
  sendTabMessage,
  executeContentScript,
  getAdminTabInfo,
  openAdminRoutePage,
  openAdminTab,
  reloadOtherAdminPage,
  updateAdminPageUrl,
  updateAdminPageUrlDebounced,
  getFilteredTabs,
  cancelHighlightTabs,
  getAllTabs,
  sendAllTabs,
  sendCurrentTab,
  sendOtherTabs,
  sendLeftTabs,
  sendRightTabs,
  openNewTab,
  discardOtherTabs,
  saveOpenedTabsAsSnapshot,
  restoreOpenedTabsSnapshot,
  setPageTitle,
  openUserGuide,
};
