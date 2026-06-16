import styled from 'styled-components';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';
import type { StyledThemeProps } from '~/entrypoints/types';
import { StyledBaseMainWrapper } from '../Layout.styled';
import SidebarLayout from '../components/SidebarLayout';
import RightPanelLayout from '../components/RightPanelLayout';

export const StyledMainWrapper = StyledBaseMainWrapper;

export const StyledSidebarWrapper = styled(SidebarLayout)<{
  theme: StyledThemeProps;
}>`
  .sidebar-inner-content {
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
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 12px;
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
      .nicetab-tree {
        background: transparent;
      }
    }
  }
`;

export const StyledTreeNodeItem = styled.div`
  display: flex;
  align-items: center;
  padding-right: 8px; // 防止滚动条出现时，内容被遮挡
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
    gap: 4px;
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
    padding-left: 16px;
    list-style-type: disc;
    li {
      margin-bottom: 8px;
    }
  }
`;

export const StyledRightPanelWrapper = styled(RightPanelLayout)<{
  theme: StyledThemeProps;
}>`
  .right-panel-inner-content {
    display: flex;
    flex-direction: column;
    .opened-tabs-title {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .opened-tabs-list {
      flex: 1;
      height: 0;
      overflow-y: auto;
      .no-data {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
    }
    .tab-list-checkbox-group {
      width: 100%;
      display: block;
    }
  }
`;

export const StyledGroupList = styled.div`
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
`;

export default {
  name: 'option-home-styled',
};
