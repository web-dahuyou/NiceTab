import type { PageModuleNames } from './global';

// 首页状态
export interface HomeStateProps {
  sidebarCollapsed?: boolean;
}

// 状态相关
export interface StateProps extends Partial<Record<PageModuleNames, any>> {
  home: HomeStateProps;
}

export default { name: 'state-types' };
