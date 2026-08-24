import styled from 'styled-components';
import { StyledBaseMainWrapper } from '~/entrypoints/options/Layout.styled';

const StyledSnapshotsPage = styled(StyledBaseMainWrapper)`
  --sidebar-grid-col: var(--snapshot-sidebar-width, 240px);
  --right-panel-grid-col: 0px;

  .snapshot-sidebar {
    .sidebar-inner-box {
      top: 100px;
    }
    .sidebar-inner-content {
      overflow: auto;
      padding-right: 10px;
    }
    .nicetab-menu-vertical {
      border-inline-end: none !important;
    }
  }

  .sidebar-label {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .snapshot-main {
    box-sizing: border-box;
    min-width: 0;
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 0 60px;
  }

  .snapshot-toolbar,
  .snapshot-record {
    display: flex;
    align-items: center;
  }

  .snapshot-toolbar {
    position: sticky;
    top: 60px;
    z-index: 8;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 0;
    background: ${props => props.theme.colorBgContainer};
  }

  .snapshot-list {
    display: grid;
    gap: 10px;
  }

  .snapshot-record {
    justify-content: space-between;
    gap: 16px;
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid ${props => props.theme.colorBorderSecondary};
    border-radius: 6px;
    background: ${props => props.theme.colorBgContainer};
  }

  .snapshot-heading {
    min-width: 0;
    flex: 1;
  }

  .snapshot-name {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .snapshot-meta {
    margin-top: 3px;
    color: ${props => props.theme.colorTextSecondary};
    font-size: 12px;
  }

  .snapshot-actions {
    flex: 0 0 auto;
  }

  @media (max-width: 840px) {
    --sidebar-grid-col: 0px;

    .snapshot-main {
      padding: 0 32px;
    }
  }

  @media (max-width: 620px) {
    .snapshot-main {
      padding: 0 16px;
    }

    .snapshot-toolbar,
    .snapshot-record {
      align-items: stretch;
      flex-direction: column;
    }

    .snapshot-actions {
      align-self: flex-end;
    }
  }
`;

export const StyledSnapshotDrawerContent = styled.div`
  .detail-group-row,
  .detail-tab-row {
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
  }

  .detail-group-row {
    min-height: 44px;
    padding: 8px 10px;
    border-bottom: 1px solid ${props => props.theme.colorBorderSecondary};
    background: ${props => props.theme.colorFillQuaternary};
  }

  .detail-tab-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 6px 10px;
    border-bottom: 1px solid ${props => props.theme.colorBorderSecondary};
  }

  .detail-tab-row.grouped {
    padding-left: 28px;
  }

  .detail-tab-content {
    min-width: 0;
    flex: 1;
  }

  .detail-tab-title,
  .detail-tab-url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-tab-url {
    color: ${props => props.theme.colorTextSecondary};
    font-size: 12px;
  }
`;

export default StyledSnapshotsPage;
