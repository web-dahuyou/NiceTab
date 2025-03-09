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
  ThemeTypes,
  ThemeTypeConfig,
  ColorItem,
  ThemeColors,
  TabEvents,
  SyncType,
  AutoSyncType,
  PopupModuleNames,
  PageContextType,
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

// 发送标签页操作名称
export const SEND_TAB_ACTION_NAMES = [
  'sendAllTabs', // 发送全部标签页
  'sendCurrentTab', // 发送当前标签页
  'sendOtherTabs', // 发送其他标签页
  'sendLeftTabs', // 发送左侧标签页
  'sendRightTabs', // 发送右侧标签页
];

// popup面板模块名称
export const POPUP_MODULE_NAMES: PopupModuleNames[] = [
  'extensionInfo', // 插件信息
  'goto', // 前往
  'actions', // 操作
  'theme', // 主题色
  'openedTabs', // 已打开的标签页
];

// action 名称枚举
export enum ENUM_ACTION_NAME {
  SEND_ALL_TABS = 'action:sendAllTabs', // 发送全部标签页
  SEND_CURRENT_TAB = 'action:sendCurrentTab', // 发送当前标签页
  SEND_OTHER_TABS = 'action:sendOtherTabs', // 发送其他标签页
  SEND_LEFT_TABS = 'action:sendLeftTabs', // 发送左侧标签页
  SEND_RIGHT_TABS = 'action:sendRightTabs', // 发送右侧标签页
  OPEN_ADMIN_TAB = 'action:openAdminTab', // 打开管理后台
}
// 设置项枚举
export enum ENUM_SETTINGS_PROPS {
  LANGUAGE = 'language', // 语言
  THEME_TYPE = 'themeType', // 主题类型
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH = 'openAdminTabAfterBrowserLaunch', // 启动浏览器时是否自动打开管理后台
  SHOW_SEND_TARGET_MODAL = 'showSendTargetModal', // 发送标签页时是否显示目标选择弹窗
  AUTO_PIN_ADMIN_TAB = 'autoPinAdminTab', // 是否固定管理后台
  OPEN_ADMIN_TAB_AFTER_SEND_TABS = 'openAdminTabAfterSendTabs', // 发送标签页后是否打开管理后台
  CLOSE_TABS_AFTER_SEND_TABS = 'closeTabsAfterSendTabs', // 发送标签页后是否关闭标签页
  ACTION_AUTO_CLOSE_FLAGS = 'actionAutoCloseFlags', // 各种发送标签页操作的自动关闭标签页标志
  ALLOW_SEND_PINNED_TABS = 'allowSendPinnedTabs', // 是否发送固定标签页
  EXCLUDE_DOMAINS_FOR_SENDING = 'excludeDomainsForSending', // 发送标签页时排除的域名
  RESTORE_IN_NEW_WINDOW = 'restoreInNewWindow', // 是否在新窗口打开标签组
  DELETE_AFTER_RESTORE = 'deleteAfterRestore', // 恢复标签页/标签组时是否从列表中删除
  UNNAMED_GROUP_RESTORE_AS_GROUP = 'unnamedGroupRestoreAsGroup', // 是否以标签组形式恢复未命名标签组
  NAMED_GROUP_RESTORE_AS_GROUP = 'namedGroupRestoreAsGroup', // 是否以标签组形式恢复已命名标签组
  SILENT_OPEN_TAB_MODIFIER_KEY = 'silentOpenTabModifierKey', // 静默打开标签页的修饰键
  OPEN_TAB_MODIFIER_KEY = 'openTabModifierKey', // 前台打开标签页的修饰键
  DELETE_UNLOCKED_EMPTY_GROUP = 'deleteUnlockedEmptyGroup', // 是否删除未锁定的空标签组
  CONFIRM_BEFORE_DELETING_TABS = 'confirmBeforeDeletingTabs', // 删除标签页前是否需要确认
  ALLOW_DUPLICATE_TABS = 'allowDuplicateTabs', // 同一个标签组中是否允许重复的标签页
  ALLOW_DUPLICATE_GROUPS = 'allowDuplicateGroups', // 同一个分类中是否允许重复的标签组
  LINK_TEMPLATE = 'linkTemplate', // 链接模板
  TAB_COUNT_THRESHOLD = 'tabCountThreshold', // 分类中标签页超过该数量时，则右侧面板开启虚拟滚动
  SHOW_OPENED_TAB_COUNT = 'showOpenedTabCount', // 扩展图标上是否显示打开的标签页数量
  SHOW_PAGE_CONTEXT_MENUS = 'showPageContextMenus', // 网页中是否显示NiceTab右键菜单
  POPUP_MODULE_DISPLAYS = 'popupModuleDisplays', // popup弹窗中需要展示的模块
  AUTO_EXPAND_HOME_TREE = 'autoExpandHomeTree', // 进入列表页时，是否自动展开全部节点
  MAIN_CONTENT_WIDTH_TYPE = 'pageWidthType', // 主内容区域宽度类型
  AUTO_SYNC = 'autoSync', // 是否开启自动同步
  AUTO_SYNC_INTERVAL = 'autoSyncInterval', // 自动同步间隔时间
  AUTO_SYNC_TYPE = 'autoSyncType', // 自动同步方式
}

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
export const LANGUAGE_OPTIONS: Array<{
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

// export const IS_GROUP_SUPPORT = typeof browser.tabs.group === 'function' && !!browser.tabGroups;

// 状态标识
export const SUCCESS_KEY = 'success';
export const FAILED_KEY = 'failed';

// 默认排除的链接
export const DEFAULT_EXCLUDE_DOMAINS = [
  'about:blank',
  'chrome://newtab/',
  'edge://newtab/',
];

// 同步方式枚举
export const syncTypeMap: Record<string, SyncType> = {
  AUTO_PULL_MERGE: 'auto-pull-merge',
  AUTO_PULL_FORCE: 'auto-pull-force',
  AUTO_PUSH_MERGE: 'auto-push-merge',
  AUTO_PUSH_FORCE: 'auto-push-force',
  MANUAL_PULL_MERGE: 'manual-pull-merge',
  MANUAL_PULL_FORCE: 'manual-pull-force',
  MANUAL_PUSH_MERGE: 'manual-push-merge',
  MANUAL_PUSH_FORCE: 'manual-push-force',
};

export const defaultAutoSyncType: AutoSyncType = 'auto-push-merge';

// 页面上下文类型枚举
export const pageContextTypes: PageContextType[] = [
  'optionsPage',
  'popupPage',
  'contentScriptPage',
];

export default {
  ENUM_COLORS,
  THEME_COLORS,
  THEME_TYPE_CONFIG,
  defaultThemeType,
  ENUM_ACTION_NAME,
  ENUM_SETTINGS_PROPS,
  TAB_EVENTS,
  LANGUAGE_OPTIONS,
  defaultLanguage,
  defaultAutoSyncType,
  UNNAMED_TAG,
  UNNAMED_GROUP,
};
