import { browser, Tabs } from 'wxt/browser';
import { settingsUtils, tabListUtils } from './storage';
import type { SettingsProps, TabItem } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { pick } from '~/entrypoints/common/utils';

const {
  OPEN_ADMIN_TAB_AFTER_SEND_TABS,
  CLOSE_TABS_AFTER_SEND_TABS,
  AUTO_PIN_ADMIN_TAB,
  ALLOW_SEND_PINNED_TAB,
} = ENUM_SETTINGS_PROPS;

const matchUrls: string[] = ['https://*/*', 'http://*/*', 'chrome://*/*', 'file://*/*'];

// 打开管理后台
export async function openAdminTab(settingsData?: SettingsProps) {
  const settings = settingsData || await settingsUtils.getSettings();
  if (!settings?.[OPEN_ADMIN_TAB_AFTER_SEND_TABS]) return;
  const highlightedTabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
  if (highlightedTabs.length) {
    highlightedTabs.forEach((tab) => browser.tabs.update(tab.id, { highlighted: false, active: false }));
  }
  const adminTabUrl = browser.runtime.getURL('/options.html');
  const [tab] = await browser.tabs.query({ url: `${adminTabUrl}*`, currentWindow: true });
  if (tab?.id) {
    await browser.tabs.move(tab.id, { index: 0 });
    browser.tabs.update(tab.id, {
      highlighted: true,
      pinned: settings[AUTO_PIN_ADMIN_TAB],
    });
    browser.tabs.reload(tab.id);
  } else {
    browser.tabs.create({
      index: 0,
      url: adminTabUrl,
      pinned: settings[AUTO_PIN_ADMIN_TAB],
    });
  }
}
// 获取过滤后的标签页
async function getFilteredTabs(
  tabs: Tabs.Tab[],
  settings: SettingsProps,
  validator?: (tab: Tabs.Tab) => boolean
) {
  return tabs.filter((tab) => {
    if (!tab?.id) return false;
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

  await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true,
  );
  openAdminTab(settings);
  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
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
  await tabListUtils.addTabs([pick(tab, ['title', 'url', 'favIconUrl'])]);
  openAdminTab(settings);
  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    if (tab?.id && !tab?.pinned) {
      browser.tabs.remove(tab.id);
    }
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
  await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true,
  );
  openAdminTab(settings);
  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  }
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
  await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true,
  );
  openAdminTab(settings);

  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  }
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
  await tabListUtils.addTabs(
    filteredTabs.map((tab) => pick(tab, ['title', 'url', 'favIconUrl'])),
    true,
  );
  openAdminTab(settings);

  if (settings[CLOSE_TABS_AFTER_SEND_TABS]) {
    browser.tabs.remove(filteredTabs.map((t) => t.id as number).filter(Boolean));
  }
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
