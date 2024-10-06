import { ThemeConfig } from 'antd';
import { MessageDescriptor } from 'react-intl';

// 扩展版本信息
export type VersionInfo = { updateAvailable: boolean; version?: string };

// 订阅事件类型
export type EventsEmitterProps = {
  'is-dragging': boolean;
  'home:set-tree-searchValue': string;
};

// 全局 Context
export interface GlobalContextProps {
  colorPrimary: string;
  themeTypeConfig: ThemeTypeConfig;
  setThemeType: (themeType: ThemeTypes) => void;
  setThemeData: (themeData: Partial<ThemeProps>) => void;
  setLocale: (language?: LanguageTypes, callback?: () => void) => Promise<void>;
}

// 语言
export type LanguageTypes = 'zh-CN' | 'en-US';
// react-intl formatMessage 参数
export type IntlForamtMessageParams = MessageDescriptor & {
  values?: Record<string, any>;
  opts?: Record<string, any>;
};

// styled-components ThemeProvider
export type StyledThemeProps = ThemeConfig['token'] & ThemeTypeConfig;

// 主题类型
export type ThemeTypes = 'light' | 'dark';

export interface ThemeTypeConfig {
  type: ThemeTypes;
  bgColor: string;
  algorithm: 'defaultAlgorithm' | 'darkAlgorithm';
}

// 主题token
export interface ThemeProps {
  colorPrimary: string;
  colorBgContainer: string;
}

export type ThemeColors =
  | 'blue'
  | 'cyan'
  | 'volcano'
  | 'orange'
  | 'red'
  | 'green'
  | 'purple'
  | 'magenta'
  | 'gold'
  | 'lime';

// toggle theme color block item
export interface ColorItem {
  key: ThemeColors;
  color: string;
}

// 标签页事件
export type TabEvents =
  | 'onActivated'
  | 'onAttached'
  | 'onCreated'
  | 'onDetached'
  | 'onMoved'
  | 'onRemoved'
  | 'onReplaced'
  | 'onUpdated'
  | 'onHighlighted';

// 管理后台-设置信息
export type SettingsProps = {
  language?: LanguageTypes; // 语言
  themeType?: ThemeTypes; // 主题类型
  openAdminTabAfterBrowserLaunch?: boolean; // 启动浏览器时是否自动打开管理后台
  autoPinAdminTab?: boolean; // 是否固定管理后台
  allowSendPinnedTabs?: boolean; // 是否发送固定标签页
  deleteAfterRestore?: boolean; // 恢复标签页/标签组时是否从列表中删除
  openAdminTabAfterSendTabs?: boolean; // 发送标签页后是否打开管理后台
  closeTabsAfterSendTabs?: boolean; // 发送标签页后是否关闭标签页
  deleteUnlockedEmptyGroup?: boolean; // 是否删除未锁定的空标签组
  allowDuplicateTabs?: boolean; // 同一个标签组中是否允许重复的标签页
  allowDuplicateGroups?: boolean; // 同一个分类中是否允许重复的标签组
  linkTemplate?: string; // 链接模板
  tabCountThreshold?: number; // 分类中标签页超过该数量时，则右侧面板只展示单个分组
  showOpenedTabCount?: boolean; // 扩展图标上是否显示打开的标签页数量
};

export type EnumSettingsProps = {
  LANGUAGE: 'language';
  THEME_TYPE: 'themeType';
  OPEN_ADMIN_TAB_AFTER_BROWSER_LAUNCH: 'openAdminTabAfterBrowserLaunch';
  OPEN_ADMIN_TAB_AFTER_SEND_TABS: 'openAdminTabAfterSendTabs';
  CLOSE_TABS_AFTER_SEND_TABS: 'closeTabsAfterSendTabs';
  AUTO_PIN_ADMIN_TAB: 'autoPinAdminTab';
  ALLOW_SEND_PINNED_TABS: 'allowSendPinnedTabs';
  DELETE_AFTER_RESTORE: 'deleteAfterRestore';
  DELETE_UNLOCKED_EMPTY_GROUP: 'deleteUnlockedEmptyGroup';
  ALLOW_DUPLICATE_TABS: 'allowDuplicateTabs';
  ALLOW_DUPLICATE_GROUPS: 'allowDuplicateGroups';
  LINK_TEMPLATE: 'linkTemplate';
  TAB_COUNT_THRESHOLD: 'tabCountThreshold';
  SHOW_OPENED_TAB_COUNT: 'showOpenedTabCount';
};
// 状态相关
export interface StateProps {
  'home:sidebarCollapsed'?: boolean;
}

export interface HotkeyOption {
  macKey: string;
  winKey: string;
  action: string;
}
export type HotkeyItem = HotkeyOption & {
  key: string;
  combo: string[];
  label?: string;
};

export default { name: 'global-types' };
