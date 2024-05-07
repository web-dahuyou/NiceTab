import { browser, Tabs } from 'wxt/browser';
import { settingsUtils, tabListUtils } from './storage';
import type { SettingsProps, TabItem } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { pick, getUrlWithParams, objectToUrlParams } from '~/entrypoints/common/utils';

const {
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TAB,
} = ENUM_SETTINGS_PROPS;

const matchUrls: string[] = ['https://*/*', 'http://*/*', 'chrome://*/*', 'file://*/*'];

export async function getAdminTabInfo() {
  const adminTabUrl = browser.runtime.getURL('/options.html');
  const [tab] = await browser.tabs.query({ url: `${adminTabUrl}*`, currentWindow: true });

  return { tab, adminTabUrl };
}
// 打开管理后台
export async function openAdminTab(
  settingsData?: SettingsProps,
  params?: { tagId: string; groupId: string }
) {
  const settings = settingsData || (await settingsUtils.getSettings());
  if (!settings?.[OPEN_ADMIN_TAB_AFTER_SEND_TABS]) return;

  const { tab, adminTabUrl } = await getAdminTabInfo();
  const paramsStr = objectToUrlParams(params || {});
  const urlWithParams = `${adminTabUrl}/#/home${paramsStr ? `?${paramsStr}` : ''}`; // url传参形式

  if (tab?.id) {
    browser.tabs.remove(tab.id);
  }
  browser.tabs.create({
    index: 0,
    // url: adminTabUrl,
    url: urlWithParams,
    pinned: settings[AUTO_PIN_ADMIN_TAB],
  });
}
// 获取过滤后的标签页
async function getFilteredTabs(
  tabs: Tabs.Tab[],
  settings: SettingsProps,
  validator?: (tab: Tabs.Tab) => boolean
) {
  const { tab: adminTab } = await getAdminTabInfo();
  return tabs.filter((tab) => {
    if (!tab?.id) return false;
    if (adminTab && adminTab.id === tab.id) return false;
    // 如果设置不允许发送固定标签页，则过滤掉固定标签页
    if (tab.pinned && !settings[ALLOW_SEND_PINNED_TAB]) {
      return false;
    }
    if (validator) {
      return validator(tab);
    }
    return true;
  });
}
// 取消标签页高亮
async function cancelHighlightTabs(tabs?: Tabs.Tab[]) {
  if (tabs) {
    tabs.forEach((tab) => {
      tab?.highlighted && browser.tabs.update(tab.id, { highlighted: false, active: false });
    });
  } else {
    const highlightedTabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
    const { tab: adminTab } = await getAdminTabInfo();
    highlightedTabs.forEach((tab) => {
      if (adminTab && adminTab.id !== tab.id) {
        browser.tabs.update(tab.id, { highlighted: false, active: false });
      }
    })
  }
}
// 获取全部标签页
export async function getAllTabs() {
  return await browser.tabs.query({ currentWindow: true });
}
// 发送标签页逻辑
async function sendAllTabs() {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    currentWindow: true,
  });

  // 获取插件设置
  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(tabs, settings);

  const { tagId, groupId } = await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true
  );
  openAdminTab(settings, { tagId, groupId });
  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  } else {
    // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
    cancelHighlightTabs(filteredTabs);
  }
}
async function sendCurrentTab() {
  const [tab] = await browser.tabs.query({
    // url: matchUrls,
    highlighted: true,
    currentWindow: true,
  });

  if (!tab?.id) return;
  const settings = await settingsUtils.getSettings();
  const { tagId, groupId } = await tabListUtils.addTabs([
    pick(tab, ['title', 'url', 'favIconUrl']),
  ]);
  openAdminTab(settings, { tagId, groupId });
  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    if (tab?.id && !tab?.pinned) {
      browser.tabs.remove(tab.id);
    }
  } else {
    // 如果发送标签页后打开管理后台，则跳转之后将标签页取消高亮
    cancelHighlightTabs([tab]);
  }
}
async function sendOtherTabs() {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    highlighted: false,
    currentWindow: true,
  });
  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(tabs, settings);
  const { tagId, groupId } = await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true
  );
  openAdminTab(settings, { tagId, groupId });
  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  }
  // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
  cancelHighlightTabs();
}
async function sendLeftTabs(currTab?: Tabs.Tab) {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    currentWindow: true,
  });
  let leftTabs = [];
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    if (tab.id === currTab?.id) break;
    leftTabs.push(tab);
  }

  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(leftTabs, settings);
  const { tagId, groupId } = await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true
  );
  openAdminTab(settings, { tagId, groupId });

  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  }
  // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
  cancelHighlightTabs();
}
async function sendRightTabs(currTab?: Tabs.Tab) {
  const tabs = await browser.tabs.query({
    // url: matchUrls,
    currentWindow: true,
  });
  let rightTabs = [];
  for (let i = tabs.length - 1; i >= 0; i--) {
    const tab = tabs[i];
    if (tab.id === currTab?.id) break;
    rightTabs.push(tab);
  }

  const settings = await settingsUtils.getSettings();
  const filteredTabs = await getFilteredTabs(rightTabs, settings);
  const { tagId, groupId } = await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true
  );
  openAdminTab(settings, { tagId, groupId });

  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  }
  // 如果发送标签页后打开管理后台，则跳转之后将之前高亮的标签页取消高亮
  cancelHighlightTabs();
}

export function openNewTab(tab: TabItem) {
  browser.tabs.create({ url: tab.url, active: false });
}

export default {
  openAdminTab,
  getAllTabs,
  sendAllTabs,
  sendCurrentTab,
  sendOtherTabs,
  sendLeftTabs,
  sendRightTabs,
  openNewTab,
};
