import type { ReactNode } from 'react';
import { StyledBaseSidebarWrapper } from '~/entrypoints/options/Layout.styled';
import { classNames } from '~/entrypoints/common/utils';
import ToggleSidebarBtn from './ToggleSidebarBtn';

interface SidebarLayoutProps {
  /** 是否折叠 */
  collapsed?: boolean;
  /** 侧边栏宽度 */
  sidebarWidth?: number;
  /** 是否显示折叠切换按钮 */
  showCollapseBtn?: boolean;
  /** 操作按钮区域内容（位于折叠按钮之后） */
  sideActionBox?: ReactNode;
  /** 主体内容 */
  innerContent?: ReactNode;
  /** className，供外部 styled 组件注入样式 */
  className?: string;
  /** 折叠状态变化回调 */
  onCollapseChange?: (status: boolean) => void;
}

export default function SidebarLayout({
  collapsed = false,
  sidebarWidth,
  showCollapseBtn = false,
  sideActionBox,
  innerContent,
  className,
  onCollapseChange,
}: SidebarLayoutProps) {
  return (
    <StyledBaseSidebarWrapper
      className={className}
      $collapsed={collapsed}
      $sidebarWidth={sidebarWidth}
    >
      <div className={classNames('sidebar-inner-box', collapsed && 'collapsed')}>
        <div className="sidebar-action-box">
          {showCollapseBtn && (
            <ToggleSidebarBtn collapsed={collapsed} onCollapseChange={onCollapseChange} />
          )}
          {sideActionBox}
        </div>
        <div className="sidebar-inner-content">{innerContent}</div>
      </div>
    </StyledBaseSidebarWrapper>
  );
}
