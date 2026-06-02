import styled from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';

const defaultSidebarWidth = 280;
const defaultRightPanelWidth = 400;

export const StyledBaseSidebarWrapper = styled.div<{
  theme: StyledThemeProps;
  $collapsed?: boolean;
  $sidebarWidth?: number;
}>`
  position: relative;

  .sidebar-inner-box {
    width: ${props => props.$sidebarWidth || defaultSidebarWidth}px;
    height: calc(100vh - 180px);
    position: fixed;
    top: 100px;
    transition: transform 0.2s ease-in-out;
    border-right: 1px solid ${props => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};

    &.collapsed {
      .sidebar-inner-content {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
      }
      transform: translateX(-${props => props.$sidebarWidth || defaultSidebarWidth}px);
    }

    .sidebar-action-box {
      position: absolute;
      box-sizing: border-box;
      top: 0;
      right: -36px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      justify-content: center;
      visibility: visible;
      .computing-icon {
        margin-top: 10px;
      }
    }
  }

  .sidebar-inner-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;

export const StyledBaseMainWrapper = styled.div<{
  $collapsed?: boolean;
  $sidebarWidth?: number;
  $rightPanelCollapsed?: boolean;
  $rightPanelWidth?: number;
}>`
  position: relative;
  width: 100%;
  min-height: 400px;
  display: grid;
  grid-template-columns: ${props => {
    const leftCol = props.$collapsed
      ? '0px'
      : `${props.$sidebarWidth || defaultSidebarWidth}px`;
    const rightCol = props.$rightPanelCollapsed
      ? '0px'
      : `${props.$rightPanelWidth || defaultRightPanelWidth}px`;
    return `${leftCol} auto ${rightCol}`;
  }};
  transition: grid-template-columns 0.2s ease-in-out;

  .main-content-wrapper {
    padding: 0 60px;
  }
`;

// 右侧面板基础样式
export const StyledBaseRightPanelWrapper = styled.div<{
  theme: StyledThemeProps;
  $collapsed?: boolean;
  $panelWidth?: number;
}>`
  position: relative;

  .right-panel-inner-box {
    width: ${props => props.$panelWidth || defaultRightPanelWidth}px;
    height: calc(100vh - 180px);
    position: fixed;
    top: 100px;
    right: 32px;
    transition: transform 0.2s ease-in-out;
    border-left: 1px solid ${props => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};
    background: var(--bg-color);

    &.collapsed {
      .right-panel-inner-content {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
      }
      transform: translateX(${props => props.$panelWidth || defaultRightPanelWidth}px);
    }

    .right-panel-action-box {
      position: absolute;
      box-sizing: border-box;
      top: 0;
      left: -36px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      justify-content: center;
      visibility: visible;
    }
  }

  .right-panel-inner-content {
    width: 100%;
    height: 100%;
    padding-left: 16px;
  }
`;

export default {
  name: 'option-layout-styled',
};
