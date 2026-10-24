import { Tabs } from 'wxt/browser';
import { debounce } from 'lodash-es';
import tabUtils from '~/entrypoints/common/tabs';
import { themeUtils, settingsUtils, stateUtils } from '~/entrypoints/common/storage';

import { putFavicon, MAX_DATA_URL_LENGTH } from '~/entrypoints/common/utils/faviconDb';
import {
  defaultThemeColorName,
  getThemeColorHex,
  // TAB_EVENTS,
  ENUM_SETTINGS_PROPS,
  POPUP_MODULE_NAMES,
  BROWSER_ACTION_API_NAME,
} from '~/entrypoints/common/constants';

const { SHOW_OPENED_TAB_COUNT, POPUP_MODULE_DISPLAYS, NEW_TAB_DISPLAY } =
  ENUM_SETTINGS_PROPS;

// 初始化 popup 交互
export async function initPopup() {
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

// 设置插件图标徽标
export async function setBadge() {
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
    // 徽标在浏览器工具条上，不跟随页面主题，固定使用亮色主题色
    color: getThemeColorHex(themeData?.colorName || defaultThemeColorName, 'light'),
  });
}

/* ----------- 设置页面标题 start ------------- */
// 页面创建后设置页面标题
export async function setPageTitleOnCreated(tab: Tabs.Tab) {
  if (tab.status === 'complete') {
    tabUtils.setPageTitle({ windowId: tab.windowId, tabId: tab.id });
  }
}
// 页面更新时设置页面标题
export async function setPageTitleOnUpdated(
  tabId: number,
  changeInfo: Tabs.OnUpdatedChangeInfoType,
  tab: Tabs.Tab,
) {
  if (
    changeInfo.status === 'complete' ||
    (tab.status === 'complete' && tab.index !== -1)
  ) {
    tabUtils.setPageTitle({ windowId: tab.windowId, tabId: tab.id });
  }
}
/* ----------- 设置页面标题 end ------------- */

// tab 事件监听（会跟随settings设置项更新）
export async function initTabEventListener() {
  function handler() {
    setBadge();
    tabUtils.setPageTitle();
  }

  handler();

  browser.tabs.onCreated.removeListener(setBadge);
  browser.tabs.onRemoved.removeListener(setBadge);
  browser.tabs.onActivated.removeListener(setBadge);
  browser.runtime.onInstalled.removeListener(setBadge);
  browser.tabs.onCreated.addListener(setBadge);
  browser.tabs.onRemoved.addListener(setBadge);
  browser.tabs.onActivated.addListener(setBadge);
  browser.runtime.onInstalled.addListener(setBadge);
  // TAB_EVENTS.forEach((event) => browser.tabs[event]?.addListener(handler));

  browser.tabs.onCreated.removeListener(setPageTitleOnCreated);
  browser.tabs.onCreated.addListener(setPageTitleOnCreated);
  browser.tabs.onUpdated.removeListener(setPageTitleOnUpdated);
  browser.tabs.onUpdated.addListener(setPageTitleOnUpdated);
}

// 限制最多可固定一个NiceTab管理页面
async function adminPageLimitControl(tabId: number) {
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

/* ----------- 设置favicon start ------------- */
// 标签页 favicon 变化时写入 IndexedDB，供各扩展页面共享读取
const savedFaviconMap = new Map<string, string>();

function isValidFaviconUrl(faviconUrl: string): boolean {
  if (!/^(https?:|data:image\/)/.test(faviconUrl)) return false;
  // data:image 的图标体积不可控，超过上限的不缓存，交给页面侧兜底链路
  if (faviconUrl.startsWith('data:') && faviconUrl.length > MAX_DATA_URL_LENGTH) {
    return false;
  }
  return true;
}

async function setFaviconOnUpdated(
  tabId: number,
  changeInfo: Tabs.OnUpdatedChangeInfoType,
  tab: Tabs.Tab,
) {
  // favicon 可能在页面 complete 后单独到达（此时 changeInfo.status 为空），仅 favIconUrl 变化时也要处理
  if (changeInfo.status !== 'complete' && !changeInfo.favIconUrl) return;

  const pageUrl = changeInfo.url || tab.url || tab.pendingUrl;
  if (!pageUrl) return;

  let origin: string;
  try {
    const url = new URL(pageUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    origin = url.origin;
  } catch {
    return;
  }

  const faviconUrl = changeInfo.favIconUrl || tab.favIconUrl;
  if (!faviconUrl || !isValidFaviconUrl(faviconUrl)) return;

  // 同一个 origin 的图标没有变化时不重复写入
  if (savedFaviconMap.get(origin) === faviconUrl) return;
  savedFaviconMap.set(origin, faviconUrl);

  try {
    await putFavicon({
      origin,
      url: faviconUrl,
      timestamp: Date.now(),
      source: 'browser',
    });
  } catch {
    // 写入失败时移除去重标记，下次事件再试
    savedFaviconMap.delete(origin);
  }
}
/* ----------- 设置favicon end ------------- */

// 页面更新时自动创建快照（模块级单例，保证 removeListener 能移除旧监听）
const autoCreateSnapshot = debounce(async () => {
  const globalState = await stateUtils.getState('global');
  if (globalState.snapshotStatus === 'on') {
    tabUtils.saveOpenedTabsAsSnapshot();
  }
}, 1000);

// 初始化监听 tabs 更新（与settings设置项无关）
export async function initTabsUpdateListener() {
  browser.tabs.onUpdated.removeListener(adminPageLimitControl);
  browser.tabs.onUpdated.addListener(adminPageLimitControl);

  browser.tabs.onUpdated.removeListener(setFaviconOnUpdated);
  browser.tabs.onUpdated.addListener(setFaviconOnUpdated);

  browser.tabs.onUpdated.removeListener(autoCreateSnapshot);
  browser.tabs.onUpdated.addListener(autoCreateSnapshot);
  browser.tabs.onMoved.removeListener(autoCreateSnapshot);
  browser.tabs.onMoved.addListener(autoCreateSnapshot);
  browser.tabs.onRemoved.removeListener(autoCreateSnapshot);
  browser.tabs.onRemoved.addListener(autoCreateSnapshot);
  browser.tabGroups?.onUpdated?.removeListener(autoCreateSnapshot);
  browser.tabGroups?.onUpdated?.addListener(autoCreateSnapshot);
  browser.tabGroups?.onMoved?.removeListener(autoCreateSnapshot);
  browser.tabGroups?.onMoved?.addListener(autoCreateSnapshot);
}

/* ----------- 新标签页重定向 start ------------- */
async function handleNewTabRedirect(tabId: number | undefined, url: string) {
  if (!tabId || !url) return;

  const newTabPatterns = [
    'chrome://newtab/',
    'edge://newtab/',
    'about:newtab',
    'about:privatebrowsing',
  ];

  const matches = newTabPatterns.some(
    pattern => url === pattern || url.startsWith(pattern),
  );
  if (!matches) return;

  const settings = await settingsUtils.getSettings();
  const display = settings[NEW_TAB_DISPLAY];

  if (display === 'homePage') {
    browser.tabs.update(tabId, { url: browser.runtime.getURL('/options.html#/home') });
  } else if (display === 'niceNewtab') {
    browser.tabs.update(tabId, { url: browser.runtime.getURL('/nice-newtab.html') });
  }
}

async function handleNewTabCreated(tab: Tabs.Tab) {
  const url = tab.url || tab.pendingUrl || '';
  await handleNewTabRedirect(tab.id, url);
}

async function handleNewTabUpdated(
  tabId: number,
  changeInfo: Tabs.OnUpdatedChangeInfoType,
) {
  if (changeInfo.status === 'loading') {
    const url = changeInfo.url || '';
    await handleNewTabRedirect(tabId, url);
  }
}

// 新标签页重定向监听（不使用chrome_url_overrides，根据settings配置项进行控制）
export async function initNewTabRedirectListener() {
  browser.tabs.onCreated.removeListener(handleNewTabCreated);
  browser.tabs.onUpdated.removeListener(handleNewTabUpdated);
  browser.tabs.onCreated.addListener(handleNewTabCreated);
  browser.tabs.onUpdated.addListener(handleNewTabUpdated);
}
/* ----------- 新标签页重定向 end ------------- */

export default {
  setBadge,
  initPopup,
  initTabsUpdateListener,
  initNewTabRedirectListener,
  initTabEventListener,
};
