import styled from 'styled-components';

export const StyledListWrapper = styled.div<{$primaryColor?: string}>`
  position: relative;
  width: 100%;
  min-height: 400px;
  display: grid;
  grid-template-columns: 260px auto;
  grid-column-gap: 24px;
  .sidebar {
    height: calc(100vh - 180px);
    .sidebar-inner {
      width: 260px;
      position: fixed;
      top: 100px;
      padding-right: 16px;
      border-right: 1px solid rgba(5, 5, 5, 0.06);
      .sidebar-action-btns-wrapper {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        button {
          font-size: 12px;
        }
      }
      .tag-list-title {
        padding: 10px 0 4px;
        font-weight: bold;
      }
      .count-info {
        padding: 4px 0 16px;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        color: #666;
        font-size: 12px;
      }
    }
  }
`;


