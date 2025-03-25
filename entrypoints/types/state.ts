import { Tabs } from 'wxt/browser';
import type { PageModuleNames } from './global';

// 全局状态
export interface GlobalStateProps {
  openedTabs: Tabs.Tab[];
}

// 首页状态
export interface HomeStateProps {
  sidebarCollapsed?: boolean;
}

// 状态相关
export interface StateProps extends Partial<Record<PageModuleNames, any>> {
  global: GlobalStateProps;
  home: HomeStateProps;
}

export default { name: 'state-types' };
