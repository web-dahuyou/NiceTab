
import { MessageDescriptor } from 'react-intl';

// 扩展版本信息
export type VersionInfo = { updateAvailable: boolean; version?: string; };

// 全局 Context
export interface GlobalContextProps {
  colorPrimary: string;
  setThemeData: (themeData: Partial<ThemeProps>) => void;
  setLocale: (language?: LanguageTypes, callback?: () => void) => Promise<void>;
}

// 语言
export type LanguageTypes = 'zh-CN' | 'en-US';
// react-intl formatMessage 参数
export type IntlForamtMessageParams = MessageDescriptor & { values?: Record<string, any>, opts?: Record<string, any> };

// 主题相关
export interface ThemeProps {
  colorPrimary: string;
}
// toggle theme color block item
export interface ColorItem {
  key: string;
  color: string;
}

// 标签页事件
export type TabEvents = 'onActivated' | 'onAttached' | 'onCreated' | 'onDetached' | 'onMoved' | 'onRemoved' | 'onReplaced' | 'onUpdated' | 'onHighlighted';

// 管理后台-设置信息
export type SettingsProps = {
  language?: LanguageTypes; // 语言
  openAdminTabAfterBrowserLaunch?: boolean; // 启动浏览器时是否自动打开管理后台
  autoPinAdminTab?: boolean; // 是否固定管理后台
  allowSendPinnedTabs?: boolean; // 是否发送固定标签页
  deleteAfterRestore?: boolean; // 恢复标签页/标签组时是否从列表中删除
  openAdminTabAfterSendTabs?: boolean; // 发送标签页后是否打开管理后台
  closeTabsAfterSendTabs?: boolean; // 发送标签页后是否关闭标签页
  deleteUnlockedEmptyGroup?: boolean; // 是否删除未锁定的空标签组
  allowDuplicateTabs?: boolean; // 同一个标签组中是否允许重复的标签页
  allowDuplicateGroups?: boolean; // 同一个分类中是否允许重复的标签组
};

// 管理后台-tab列表页相关
// 标签信息
export interface TabItem {
  tabId: string;
  title?: string;
  url?: string;
  favIconUrl?: string;
}
// 标签组信息
export interface GroupItem {
  groupId: string;
  groupName: string;
  createTime: string;
  tabList: TabItem[];
  isLocked?: boolean;
  isStarred?: boolean;
}
// 分类信息
export interface TagItem {
  tagId: string;
  tagName: string;
  createTime: string;
  groupList: GroupItem[];
  static?: boolean; // static 为true 时，表示是中转站
  isLocked?: boolean;
  isStarred?: boolean;
}
// 分类、标签组、标签页统计信息
export interface CountInfo {
  tagCount: number;
  groupCount: number;
  tabCount: number;
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
}

export default { name: 'Nice-Tab-types' }
