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

/* keptab 格式相关  */
export interface KepTabItem {
  url: string;
  title: string;
  favIconUrl: string;
  pinned: boolean;
  muted: boolean;
}

export interface KepTabGroup {
  _id: number;
  title: string;
  tabs: KepTabItem[];
  urls: string[];
  tags: string[];
  time: number;
  lock: boolean;
  star: boolean;
}

export type KepTabData = KepTabGroup[];

/* toby 格式相关  */
export interface TobyItem {
  url: string;
  title: string;
  customTitle: string;
  customDescription: string;
}

export interface TobyGroup {
  title: string;
  cards: TobyItem[];
  labels: string[];
}

export interface TobyData {
  version: number;
  lists: TobyGroup[];
}

/* Session Buddy 格式相关  */
export interface SessionBuddyItem {
  id: string;
  url: string;
  title: string;
  favIconUrl: string;
  pinned: boolean;
}
export interface SessionBuddyGroup {
  links: SessionBuddyItem[];
  id: string;
  title?: string;
}
export interface SessionBuddyCollections {
  id: string;
  title?: string;
  created: number;
  pinned: number;
  updated: number;
  touched: number;
  folders: SessionBuddyGroup[];
}
export interface SessionBuddyData {
  format: string;
  exportId: string;
  scope: string;
  collections: SessionBuddyCollections[];
}

/* 导入导出相关 */
export type ExtContentParserFuncName =
  | 'niceTab'
  | 'oneTab'
  | 'kepTab'
  | 'toby'
  | 'sessionBuddy';

export type ExtContentImporterProps = {
  [key in ExtContentParserFuncName]: (content: string) => TagItem[];
};

export type ExtContentExporterProps = {
  [key in ExtContentParserFuncName]: (content: Partial<TagItem>[]) => string;
};

// 分类、标签组、标签页统计信息
export interface CountInfo {
  tagCount: number;
  groupCount: number;
  tabCount: number;
}

// 发送到指定目录参数
export interface SendTargetProps {
  targetTagId?: string;
  targetGroupId?: string;
}

// 已打开标签页快照列表元素
export type SnapshotGroupItem = GroupItem & { type: 'group'; bsGroupId: number };
export type SnapshotTabItem = TabItem & { type: 'tab' };
export type SnapshotItem = SnapshotGroupItem | SnapshotTabItem;

export default { name: 'tabList-types' };
