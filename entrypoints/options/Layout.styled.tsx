import styled, { css } from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';

export const defaultSidebarWidth = 280;
export const defaultRightPanelWidth = 400;

const handleHoverStyles = (position: 'left' | 'right', theme: StyledThemeProps) => css`
  width: 3px;
  ${position}: -1px;
  background-color: ${theme.colorPrimary || '#1677ff'};
`;

export const StyledHandle = styled.div<{
  theme: StyledThemeProps;
  $position: 'left' | 'right';
  $canDrag?: boolean;
  $dragging?: boolean;
}>`
  position: absolute;
  ${props => props.$position}: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: ${props => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};
  z-index: 10;
  transition:
    width 0.2s,
    background-color 0.2s,
    ${props => props.$position} 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -2px;
    right: -2px;
  }

  ${props =>
    props.$canDrag &&
    css`
      cursor: col-resize;

      &:hover {
        ${handleHoverStyles(props.$position, props.theme)}
      }

      ${props.$dragging && handleHoverStyles(props.$position, props.theme)}
    `}
`;

export const StyledBaseSidebarWrapper = styled.div<{
  theme: StyledThemeProps;
}>`
  position: relative;

  .sidebar-inner-box {
    width: var(--sidebar-width, ${defaultSidebarWidth}px);
    height: calc(100vh - 180px);
    position: fixed;
    top: 100px;
    transition: transform 0.2s ease-in-out;
    transform: translateX(0);
    background: var(--bg-color);
    z-index: 10;

    &.collapsed {
      .sidebar-inner-content {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
      }
      transform: translateX(calc(-1 * var(--sidebar-width, ${defaultSidebarWidth}px)));
    }

    /* 拖拽期间禁用 transition，避免布局滞后于鼠标 */
    body.dragging-resize & {
      transition: none;
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

export const StyledBaseMainWrapper = styled.div`
  position: relative;
  width: 100%;
  min-height: 400px;
  display: grid;
  grid-template-columns:
    var(--sidebar-grid-col, ${defaultSidebarWidth}px)
    auto
    var(--right-panel-grid-col, ${defaultRightPanelWidth}px);
  transition: grid-template-columns 0.2s ease-in-out;
  // overflow-x: hidden;

  /* 拖拽期间禁用 transition，避免布局滞后于鼠标 */
  body.dragging-resize & {
    transition: none;
  }

  .main-content-wrapper {
    padding: 0 60px;
  }
`;

// 右侧面板基础样式
export const StyledBaseRightPanelWrapper = styled.div<{
  theme: StyledThemeProps;
}>`
  position: relative;

  .right-panel-inner-box {
    width: var(--panel-width, ${defaultRightPanelWidth}px);
    height: calc(100vh - 180px);
    position: fixed;
    top: 100px;
    right: 32px;
    transition: transform 0.2s ease-in-out;
    transform: translateX(0);
    background: var(--bg-color);
    z-index: 10;

    &.collapsed {
      .right-panel-inner-content {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
      }
      transform: translateX(var(--panel-width, ${defaultRightPanelWidth}px));
    }

    /* 拖拽期间禁用 transition，避免布局滞后于鼠标 */
    body.dragging-resize & {
      transition: none;
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
