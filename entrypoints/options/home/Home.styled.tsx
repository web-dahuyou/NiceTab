import styled from 'styled-components';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';

export const StyledListWrapper = styled.div<{$primaryColor?: string}>`
  position: relative;
  width: 100%;
  min-height: 400px;
  display: grid;
  grid-template-columns: 280px auto;
  grid-column-gap: 16px;
  .sidebar {
    height: calc(100vh - 180px);
    .sidebar-inner {
      width: 280px;
      height: calc(100vh - 180px);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 100px;
      padding-right: 4px;
      border-right: 1px solid rgba(5, 5, 5, 0.06);
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
        color: #666;
        font-size: 12px;
      }
      .sidebar-action-btns-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-bottom: 10px;
        gap: 8px;
        button {
          font-size: 12px;
        }
      }
      .sidebar-tree-wrapper {
        flex: 1;
        height: 0;
        overflow: auto;
        .no-data {
          padding: 16px 0;
          button {
            font-size: 12px;
          }
        }
      }
    }
  }
`;


export const StyledTreeNodeItem = styled.div`
  display: flex;
  align-items: center;
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

export default {
  name: 'option-home-styled',
}