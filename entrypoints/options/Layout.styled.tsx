import styled from 'styled-components';
import type { StyledThemeProps } from '@/entrypoints/types';

export const StyledBaseSidebarWrapper = styled.div<{
  theme: StyledThemeProps;
  $collapsed?: boolean;
  $sidebarWidth?: number;
}>`
  position: relative;

  .sidebar-inner-box {
    width: ${(props) => props.$sidebarWidth || 280}px;
    height: calc(100vh - 180px);
    position: fixed;
    top: 100px;
    transition: transform 0.2s ease-in-out;
    border-right: 1px solid ${(props) => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};

    &.collapsed {
      .sidebar-inner-content {
        pointer-events: none;
        visibility: hidden;
        opacity: 0;
      }
      transform: translateX(-${(props) => props.$sidebarWidth || 280}px);
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
}>`
  position: relative;
  width: 100%;
  min-height: 400px;
  display: grid;
  grid-template-columns: ${(props) =>
    props.$collapsed ? '0px auto' : `${props.$sidebarWidth || 280}px auto`};
  transition: grid-template-columns 0.2s ease-in-out;

  .main-content-wrapper {
    padding-left: 40px;
  }
`;

export default {
  name: 'option-layout-styled',
};
