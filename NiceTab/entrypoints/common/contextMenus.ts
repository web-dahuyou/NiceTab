import { ENUM_ACTION_NAME } from './constants';
import tabUtils from '~/entrypoints/common/tabs';

// 创建 contextMenus
function createContextMenus() {
  browser.contextMenus.create({
    id: ENUM_ACTION_NAME.SEND_ALL_TABS,
    title: '发送全部标签页',
    contexts: ['all'],
  });
  browser.contextMenus.create({
    id: ENUM_ACTION_NAME.SEND_CURRENT_TAB,
    title: '发送当前标签页',
    contexts: ['all'],
  });
  browser.contextMenus.create({
    id: ENUM_ACTION_NAME.OPEN_ADMIN_TAB,
    title: '打开NiceTab管理后台',
    contexts: ['all'],
  });
  browser.contextMenus.create({
    id: ENUM_ACTION_NAME.SEND_OTHER_TABS,
    title: '发送其他标签页',
    contexts: ['all'],
  });
  browser.contextMenus.create({
    id: ENUM_ACTION_NAME.SEND_LEFT_TABS,
    title: '发送左侧标签页',
    contexts: ['all'],
  });
  browser.contextMenus.create({
    id: ENUM_ACTION_NAME.SEND_RIGHT_TABS,
    title: '发送右侧标签页',
    contexts: ['all'],
  });
}

export default function contextMenusRegister() {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.removeAll();
    createContextMenus();
  });
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
