import { ThemeConfig } from 'antd';
import { MessageDescriptor } from 'react-intl';
import type { MessageInstance } from 'antd/es/message/interface';
import type {
  SyncStatusChangeEventProps,
  SyncStartEventProps,
  AutoSyncTimeUnits,
  AutoSyncType,
} from './sync';
import { PageContextType } from './runtimeMsg';
import { LocaleKeys } from '../common/locale';

// 扩展版本信息
export type VersionInfo = { updateAvailable: boolean; version?: string };

// 订阅事件类型
export type EventsEmitterProps = {
  'global:open-global-search-modal': void;
  'home:is-dragging': boolean;
  'home:set-tree-searchValue': { value: string; callback?: () => void };
  'home:set-editing-status': boolean;
  'sync:push-to-all-remotes': undefined;
  'sync:sync-status-change--gist': SyncStatusChangeEventProps<'gist'>;
  'sync:sync-status-change--webdav': SyncStatusChangeEventProps<'webdav'>;
  'sync:sync-start': SyncStartEventProps;
};

// 全局 Context
export interface GlobalContextProps {
  version: string;
  colorPrimary: string;
  themeTypeConfig: ThemeTypeConfig;
  pageWidthType: PageWidthTypes;
  pageContext: PageContextType;
  $message: MessageInstance;
  setThemeType: (themeType: ThemeTypes) => void;
  setThemeData: (themeData: Partial<ThemeProps>) => void;
  setSettings: (settings: Partial<SettingsProps>) => void;
  setLocale: (language?: LanguageTypes, callback?: () => void) => Promise<void>;
  setPageWidthType: (pageWidthType: PageWidthTypes) => void;
}

// 语言
export type LanguageTypes = 'zh-CN' | 'en-US';
// react-intl formatMessage 参数
export type IntlForamtMessageParams = MessageDescriptor & {
  id?: LocaleKeys;
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

// 操作名称
export type ActionNames =
  | 'openAdminTab'
  | 'sendAllTabs'
  | 'sendCurrentTab'
  | 'sendOtherTabs'
  | 'sendLeftTabs'
  | 'sendRightTabs'
  | 'sendGroupTabs';

// 页面模块名称
export type PageModuleNames =
  | 'home'
  | 'settings'
  | 'import-export'
  | 'sync'
  | 'recycle-bin';

// popup 弹窗中的模块名称
export type PopupModuleNames =
  | 'extensionInfo'
  | 'goto'
  | 'actions'
  | 'theme'
  | 'openedTabs';

export type PageWidthTypes = 'fixed' | 'responsive';

export type ActionBtnStyle = 'icon' | 'text';

export type ContextMenuConfigItem = {
  menuId: string;
  display?: boolean;
  name?: string;
};

export type InsertPositions = 'top' | 'bottom';

// 内容匹配模式
export type ContentMatchMode = 'equal' | 'startsWith' | 'endsWith' | 'contains' | 'regex';

// 页面标题配置Item
export type PageTitleConfigItem = {
  url: string;
  title: string;
  mode?: ContentMatchMode;
};

export type TimeRange = [string, string];

// 管理后台-设置信息
export type SettingsProps = {
  language?: LanguageTypes; // 语言
  themeType?: ThemeTypes; // 主题类型
  openAdminTabAfterBrowserLaunch?: boolean; // 启动浏览器时是否自动打开管理后台
  openAdminTabAfterWindowCreated?: boolean; // 新开window窗口时是否自动打开管理后台
  autoPinAdminTab?: boolean; // 是否固定管理后台
  /* 发送标签页配置 */
  showSendTargetModal?: boolean; // 发送标签页时是否显示目标分类选择弹窗
  allowSendPinnedTabs?: boolean; // 是否发送固定标签页
  excludeDomainsForSending?: string; // 发送标签页时排除的域名
  openAdminTabAfterSendTabs?: boolean; // 发送标签页后是否打开管理后台
  closeTabsAfterSendTabs?: boolean; // 发送标签页后是否关闭标签页
  actionAutoCloseFlags?: ActionNames[]; // 各种发送标签页操作是否自动关闭标签页的开关配置
  allowDuplicateTabs?: boolean; // 同一个标签组中是否允许重复的标签页
  allowDuplicateGroups?: boolean; // 同一个分类中是否允许重复的标签组
  /* 打开标签页配置 */
  restoreInNewWindow?: boolean; // 是否在新窗口打开标签组
  deleteAfterRestore?: boolean; // 恢复标签页/标签组时是否从列表中删除
  discardWhenOpenTabs?: boolean; // 是否以休眠方式打开标签页
  silentOpenTabModifierKey?: string; // 静默打开标签页的修饰键
  openTabModifierKey?: string; // 前台打开标签页的修饰键
  unnamedGroupRestoreAsGroup?: boolean; // 是否以标签组形式恢复未命名标签组
  namedGroupRestoreAsGroup?: boolean; // 是否以标签组形式恢复已命名标签组
  /* 页面标题配置 */
  pageTitleConfig?: PageTitleConfigItem[]; // 页面标题配置
  /* 全局搜索配置 */
  globalSearchDeleteAfterOpen?: boolean; // 全局搜索打开标签页后是否从列表中删除
  /* 其他操作配置 */
  deleteUnlockedEmptyGroup?: boolean; // 是否删除未锁定的空标签组
  confirmBeforeDeletingTabs?: boolean; // 删除标签页前是否确认
  linkTemplate?: string; // 链接模板
  tabCountThreshold?: number; // 分类中标签页超过该数量时，则右侧面板开启虚拟滚动
  groupInsertPosition?: InsertPositions; // 标签组插入位置：在分类的标签组列表顶部还是底部
  tabInsertPosition?: InsertPositions; // 标签页插入位置:在标签组的标签页列表顶部还是底部
  /* 展示配置 */
  groupActionBtnStyle?: ActionBtnStyle; // 操作按钮样式
  groupActionBtnsCommonlyUsed?: string[]; // 常用的标签组操作按钮
  showOpenedTabCount?: boolean; // 扩展图标上是否显示打开的标签页数量
  showPageContextMenus?: boolean; // 网页中是否显示NiceTab右键菜单
  contextMenuConfig?: ContextMenuConfigItem[]; // 右键菜单配置
  popupModuleDisplays?: PopupModuleNames[]; // popup面板中需要展示的模块
  autoExpandHomeTree?: boolean; // 进入列表页时，是否自动展开全部节点
  pageWidthType?: PageWidthTypes; // 主内容区宽度设置
  showTabTitleTooltip?: boolean; // 是否显示标签页标题的tooltip
  /* 同步配置 */
  remoteSyncWithSettings?: boolean; // 偏好设置是否与列表一起同步
  autoSync?: boolean; // 是否开启自动同步
  autoSyncTimeUnit?: AutoSyncTimeUnits; // 自动同步时间单位
  autoSyncInterval?: number; // 自动同步间隔时间
  autoSyncTimeRanges?: TimeRange[]; // 自动同步开启时段（支持设置多个时间段）
  autoSyncType?: AutoSyncType; // 自动同步方式
};

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
