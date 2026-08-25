import type { ReactNode } from 'react';
import {
  StyledBaseSidebarWrapper,
  defaultSidebarWidth,
  StyledHandle,
} from '~/entrypoints/options/Layout.styled';
import { classNames } from '~/entrypoints/common/utils';
import ToggleSidebarBtn from './ToggleSidebarBtn';
import useDragResize from '~/entrypoints/options/common/hooks/useDragResize';

interface SidebarLayoutProps {
  /** 是否折叠 */
  collapsed?: boolean;
  /** 侧边栏宽度 */
  sidebarWidth?: number;
  /** 初始侧边栏宽度 */
  initialWidth?: number;
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
  /** 宽度变化回调 */
  onWidthChange?: (width: number) => void;
}

export default function SidebarLayout({
  collapsed = false,
  sidebarWidth,
  initialWidth,
  showCollapseBtn = true,
  sideActionBox,
  innerContent,
  className,
  onCollapseChange,
  onWidthChange,
}: SidebarLayoutProps) {
  const { width, dragging, onMouseDown, dragHandleRef } = useDragResize({
    initialWidth: initialWidth || defaultSidebarWidth,
    currWidth: sidebarWidth || defaultSidebarWidth,
    minWidth: 240,
    position: 'left',
    canDrag: !collapsed,
    onWidthChange,
  });

  return (
    <StyledBaseSidebarWrapper
      className={className}
      style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}
    >
      <div className={classNames('sidebar-inner-box', collapsed && 'collapsed')}>
        <StyledHandle
          ref={dragHandleRef}
          $position="right"
          $canDrag={!collapsed}
          $dragging={dragging}
          onMouseDown={onMouseDown}
        />
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
