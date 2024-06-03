import { Tabs } from 'wxt/browser';
import { cyan, volcano, orange, blue, red, green, yellow, lime } from '@ant-design/colors';
import type { LanguageTypes, SettingsProps, TabEvents } from '~/entrypoints/types';

export const ENUM_COLORS = {
  primary: cyan.primary || cyan[6],
  cyan,
  volcano,
  orange,
  blue,
  red,
  green,
  yellow,
  lime,
};

// action 名称枚举
export const ENUM_ACTION_NAME = {
  SEND_ALL_TABS: 'action:sendAllTabs', // 发送全部标签页
  SEND_CURRENT_TAB: 'action:sendCurrentTab', // 发送当前标签页
  SEND_OTHER_TABS: 'action:sendOtherTabs', // 发送其他标签页
  SEND_LEFT_TABS: 'action:sendLeftTabs', // 发送左侧标签页
  SEND_RIGHT_TABS: 'action:sendRightTabs', // 发送右侧标签页
  OPEN_ADMIN_TAB: 'action:openAdminTab', // 打开管理后台
};
// 设置项枚举
export const ENUM_SETTINGS_PROPS: Record<string, keyof SettingsProps> = {
  LANGUAGE: 'language', // 语言
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH: 'openAdminTabAfterBrowserLaunch', // 启动浏览器时是否自动打开管理后台
  OPEN_ADMIN_TAB_AFTER_SEND_TABS: 'openAdminTabAfterSendTabs', // 发送标签页后是否打开管理后台
  CLOSE_TABS_AFTER_SEND_TABS: 'closeTabsAfterSendTabs', // 发送标签页后是否关闭标签页
  AUTO_PIN_ADMIN_TAB: 'autoPinAdminTab', // 是否固定管理后台
  ALLOW_SEND_PINNED_TABS: 'allowSendPinnedTabs', // 是否发送固定标签页
  DELETE_AFTER_RESTORE: 'deleteAfterRestore', // 恢复标签页/标签组时是否从列表中删除
};

// tab 事件
export const TAB_EVENTS: Array<keyof Pick<Tabs.Static, TabEvents>> = [
  'onActivated',
  'onAttached',
  'onCreated',
  'onDetached',
  'onMoved',
  'onRemoved',
  'onReplaced',
  'onUpdated',
  'onHighlighted',
];

// 语言选项
export const LANGUANGE_OPTIONS: Array<{key: LanguageTypes, locale: LanguageTypes, label: string}> = [
  { key: 'zh-CN', locale: 'zh-CN', label: '简体中文' },
  { key: 'en-US', locale: 'en-US', label: 'English' },
];

export default {
  ENUM_ACTION_NAME,
  ENUM_SETTINGS_PROPS,
  TAB_EVENTS,
  LANGUANGE_OPTIONS
};
