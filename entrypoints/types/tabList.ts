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


/* 导入导出相关 */
export type ExtContentParserFuncName = 'niceTab' | 'oneTab';
export type ExtContentImporterProps = {
  [key in ExtContentParserFuncName]: (content: string) => TagItem[];
};
export type ExtContentExporterProps = {
  [key in ExtContentParserFuncName]: (content: Partial<TagItem>[]) => string;
};

export default { name: 'tabList-types' };
