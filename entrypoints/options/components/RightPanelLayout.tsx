import type { ReactNode } from 'react';
import { StyledBaseRightPanelWrapper } from '~/entrypoints/options/Layout.styled';
import { classNames } from '~/entrypoints/common/utils';
import ToggleSidebarBtn from './ToggleSidebarBtn';

interface RightPanelLayoutProps {
  /** 是否折叠 */
  collapsed?: boolean;
  /** 面板宽度 */
  panelWidth?: number;
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

export default function RightPanelLayout({
  collapsed = false,
  panelWidth,
  showCollapseBtn = false,
  sideActionBox,
  innerContent,
  className,
  onCollapseChange,
}: RightPanelLayoutProps) {
  return (
    <StyledBaseRightPanelWrapper
      className={className}
      $collapsed={collapsed}
      $panelWidth={panelWidth}
    >
      <div className={classNames('right-panel-inner-box', collapsed && 'collapsed')}>
        <div className="right-panel-action-box">
          {showCollapseBtn && (
            <ToggleSidebarBtn
              collapsed={collapsed}
              position="right"
              onCollapseChange={onCollapseChange}
            />
          )}
          {sideActionBox}
        </div>
        <div className="right-panel-inner-content">{innerContent}</div>
      </div>
    </StyledBaseRightPanelWrapper>
  );
}
