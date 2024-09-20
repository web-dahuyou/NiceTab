import { Tabs } from 'wxt/browser';
import {
  blue,
  cyan,
  volcano,
  orange,
  red,
  green,
  purple,
  magenta,
  gold,
  lime,
} from '@ant-design/colors';
import type {
  LanguageTypes,
  EnumSettingsProps,
  ThemeTypes,
  ThemeTypeConfig,
  ColorItem,
  ThemeColors,
  TabEvents,
  SyncType,
} from '~/entrypoints/types';

export const GITHUB_URL = 'https://github.com/web-dahuyou/NiceTab';

// 主题列表（供切换选择）
export const ENUM_COLORS = {
  blue: blue.primary || blue[6],
  cyan: cyan.primary || cyan[6],
  volcano: volcano.primary || volcano[6],
  orange: orange.primary || orange[6],
  red: red.primary || red[6],
  green: green.primary || green[6],
  purple: purple.primary || purple[6],
  magenta: magenta.primary || magenta[6],
  gold: gold.primary || gold[6],
  lime: lime.primary || lime[6],
};

export const THEME_COLOR_NAMES: ThemeColors[] = [
  'blue',
  'cyan',
  'volcano',
  'orange',
  'red',
  'green',
  'purple',
  'magenta',
  'gold',
  'lime',
];
// 主色
export const PRIMARY_COLOR = ENUM_COLORS.blue;
export const THEME_COLORS: ColorItem[] = THEME_COLOR_NAMES.map((name) => {
  return {
    key: name,
    color: ENUM_COLORS?.[name],
  };
});


// 主题类型
export const THEME_TYPE_CONFIG: Record<ThemeTypes, ThemeTypeConfig> = {
  light: {
    type: 'light',
    bgColor: '#fff',
    algorithm: 'defaultAlgorithm',
  },
  dark: {
    type: 'dark',
    bgColor: '#2f2f2f',
    algorithm: 'darkAlgorithm',
  },
};
// 默认主题类型
export const defaultThemeType: ThemeTypes = 'light';

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
export const ENUM_SETTINGS_PROPS: EnumSettingsProps = {
  LANGUAGE: 'language', // 语言
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH: 'openAdminTabAfterBrowserLaunch', // 启动浏览器时是否自动打开管理后台
  OPEN_ADMIN_TAB_AFTER_SEND_TABS: 'openAdminTabAfterSendTabs', // 发送标签页后是否打开管理后台
  CLOSE_TABS_AFTER_SEND_TABS: 'closeTabsAfterSendTabs', // 发送标签页后是否关闭标签页
  AUTO_PIN_ADMIN_TAB: 'autoPinAdminTab', // 是否固定管理后台
  ALLOW_SEND_PINNED_TABS: 'allowSendPinnedTabs', // 是否发送固定标签页
  DELETE_AFTER_RESTORE: 'deleteAfterRestore', // 恢复标签页/标签组时是否从列表中删除
  DELETE_UNLOCKED_EMPTY_GROUP: 'deleteUnlockedEmptyGroup', // 是否删除未锁定的空标签组
  ALLOW_DUPLICATE_TABS: 'allowDuplicateTabs', // 同一个标签组中是否允许重复的标签页
  ALLOW_DUPLICATE_GROUPS: 'allowDuplicateGroups', // 同一个分类中是否允许重复的标签组
  LINK_TEMPLATE: 'linkTemplate', // 链接模板
  TAB_COUNT_THRESHOLD: 'tabCountThreshold', // 分类中标签页超过该数量时，则右侧面板只展示单个分组
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
export const LANGUANGE_OPTIONS: Array<{
  key: LanguageTypes;
  locale: LanguageTypes;
  label: string;
}> = [
  { key: 'zh-CN', locale: 'zh-CN', label: '简体中文' },
  { key: 'en-US', locale: 'en-US', label: 'English' },
];

export const defaultLanguage: LanguageTypes = 'en-US';

export const UNNAMED_TAG = 'Unnamed Tag';
export const UNNAMED_GROUP = 'Unnamed Group';

export const IS_GROUP_SUPPORT = 'group' in browser.tabs && 'tabGroups' in browser;

// 状态标识
export const SUCCESS_KEY = 'success';
export const FAILED_KEY = 'failed';

// 同步方式枚举
export const syncTypeMap: Record<string, SyncType> = {
  AUTO: 'auto',
  MANUAL_PULL_MERGE: 'manual-pull-merge',
  MANUAL_PULL_FORCE: 'manual-pull-force',
  MANUAL_PUSH_MERGE: 'manual-push-merge',
  MANUAL_PUSH_FORCE: 'manual-push-force',
};

export default {
  ENUM_COLORS,
  THEME_COLORS,
  THEME_TYPE_CONFIG,
  defaultThemeType,
  ENUM_ACTION_NAME,
  ENUM_SETTINGS_PROPS,
  TAB_EVENTS,
  LANGUANGE_OPTIONS,
  defaultLanguage,
  UNNAMED_TAG,
  UNNAMED_GROUP,
  IS_GROUP_SUPPORT,
};
