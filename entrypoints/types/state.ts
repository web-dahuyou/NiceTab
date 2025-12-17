import type { SnapshotItem } from './tabList';

export interface PermissionActionsProps {
  tabGroups: boolean;
}

/* 全局状态 */
export interface GlobalStateProps {
  // 授权弹窗是否已交互（不管确认还是取消，只要点击了就算交互，后续不再主动弹窗）
  permissionActions?: PermissionActionsProps;
  snapshotStatus?: 'on' | 'off';
  openedTabsManualSave?: SnapshotItem[];
  openedTabsAutoSave?: SnapshotItem[];
  lastSelectedTargetValue?: string[];
}

/* 首页选中状态 */
export interface SelectedKeysStoreItem {
  windowId?: number;
  selectedTagKey?: string;
  selectedTabGroupKey?: string;
}
/* 首页状态 */
export interface HomeStateProps {
  sidebarCollapsed?: boolean;
  selectedKeysStore?: SelectedKeysStoreItem[];
}
// Popup 面板状态
export interface PopupStateProps {
  isCompact?: boolean;
}

export interface StateProps {
  global: GlobalStateProps;
  home: HomeStateProps;
  popup: PopupStateProps;
}

export type StateModuleProps<K extends keyof StateProps = 'global'> = StateProps[K];

export default { name: 'state-types' };
