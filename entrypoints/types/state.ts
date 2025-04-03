import type { SnapshotItem } from './tabList';

/* 全局状态 */
export interface GlobalStateProps {
  openedTabsManualSave?: SnapshotItem[];
  openedTabsAutoSave?: SnapshotItem[];
}

/* 首页状态 */
export interface SelectedKeysStoreItem {
  windowId?: number;
  selectedTagKey?: string;
  selectedTabGroupKey?: string;
}
export interface HomeStateProps {
  sidebarCollapsed?: boolean;
  selectedKeysStore?: SelectedKeysStoreItem[];
}

export interface StateProps {
  global: GlobalStateProps;
  home: HomeStateProps;
}

export type StateModuleProps<K extends keyof StateProps = 'global'> = StateProps[K];

export default { name: 'state-types' };
