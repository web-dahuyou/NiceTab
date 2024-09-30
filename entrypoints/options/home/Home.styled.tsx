import styled from 'styled-components';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';
import type { StyledThemeProps } from '@/entrypoints/types';

export const StyledSidebarWrapper = styled.div<{
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
    padding-right: 4px;

    .tag-list-title {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      font-weight: bold;
      gap: 8px;
    }
    .count-info {
      flex-shrink: 0;
      padding: 8px 0 16px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      color: ${props => props.theme.colorTextSecondary || '#666'};
      font-size: 12px;
    }
    .sidebar-action-btns-wrapper {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 10px;
      gap: 8px;
      button {
        font-size: 12px;
      }
    }
    .sidebar-tree-wrapper {
      flex: 1;
      height: 0;
      .no-data {
        padding: 16px 0;
        button {
          font-size: 12px;
        }
      }
      .ant-tree {
        background: transparent;
      }
    }
  }
`;

export const StyledListWrapper = styled.div<{
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

  .content {
    padding-left: 40px;
    .tip {
      padding: 0 16px;
      margin-bottom: 8px;
    }
    .count-info {
      display: flex;
      align-items: center;
      padding: 0 16px;
      margin-bottom: 24px;
      .count-item {
        margin-right: 8px;
      }
    }
  }
`;

export const StyledTreeNodeItem = styled.div`
  display: flex;
  align-items: center;
  padding-right: 8px;
  cursor: pointer;
  .tree-node-title {
    width: 0;
    flex: 1;
    ${StyledEllipsis}
  }

  .tree-node-icon-group {
    display: flex;
    align-items: center;
    margin-left: 8px;
    flex-shrink: 0;
    gap: 2px;
    visibility: hidden;
    pointer-eventes: none;
  }
  &:hover {
    .tree-node-icon-group {
      visibility: visible;
      pointer-eventes: unset;
    }
  }
`;

export const StyledHelpInfoBox = styled.div`
  ul {
    list-style-type: disc;
    li {
      margin-bottom: 8px;
    }
  }
`;

export default {
  name: 'option-home-styled',
};
