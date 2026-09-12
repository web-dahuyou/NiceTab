import styled from 'styled-components';
import { StyledBaseMainWrapper } from '~/entrypoints/options/Layout.styled';
import SidebarLayout from '~/entrypoints/options/components/SidebarLayout';

export const StyledMainWrapper = StyledBaseMainWrapper;

export const StyledSidebarWrapper = styled(SidebarLayout)<{
  collapsed?: boolean;
  sidebarWidth?: number;
}>`
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
`;

export const StyledSnapshotContent = styled.div`
  box-sizing: border-box;
  min-width: 0;

  .snapshot-header,
  .snapshot-record {
    display: flex;
    align-items: center;
  }

  .snapshot-header {
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
    gap: 24px;
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid
      ${props =>
        props.theme.type === 'light'
          ? props.theme.colorBorderSecondary
          : props.theme.colorBorder};
    border-radius: 8px;
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
    color: ${props => props.theme.colorTextTertiary || '#999'};
    font-size: 12px;
  }

  .snapshot-actions {
    flex: 0 0 auto;
  }

  @media (max-width: 840px) {
    padding: 0 32px;
  }

  @media (max-width: 620px) {
    padding: 0 16px;

    .snapshot-header,
    .snapshot-record {
      align-items: stretch;
      flex-direction: column;
    }

    .snapshot-header {
      padding-top: 64px;
    }

    .snapshot-actions {
      align-self: flex-end;
    }
  }
`;

export const StyledGroupItem = styled.div`
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  margin-bottom: 4px;
  &.collapsed {
    .detail-tab-list {
      display: none;
    }
  }

  .detail-group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 8px 0;
    font-size: 14px;
    color: ${props => props.theme.colorTextSecondary || '#666'};
    user-select: none;

    &:hover {
      color: ${props => props.theme.colorText || '#000'};
    }
  }

  .detail-collapse-icon {
    display: flex;
    align-items: center;
    width: 16px;
    flex-shrink: 0;
  }

  .detail-group-color {
    display: inline-block;
    width: 24px;
    height: 16px;
    margin-right: 8px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .detail-group-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-tab-list {
    display: block;
    .detail-tab-item {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 36px;
      font-size: 14px;
      gap: 8px;
      user-select: none;
      .detail-tab-color {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }
`;

export const StyledTabRow = styled.div`
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  min-height: 36px;
  padding: 8px 0;
  gap: 8px;
  border-bottom: 1px solid
    ${props =>
      props.theme.type === 'light'
        ? props.theme.colorBorderSecondary
        : props.theme.colorBorder};

  .detail-tab-content {
    min-width: 0;
    flex: 1;
  }

  .detail-tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  .detail-tab-url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${props => props.theme.colorTextTertiary || '#999'};
    font-size: 12px;
  }

  .detail-tab-icon {
    flex-shrink: 0;
    font-size: 14px;
    color: ${props => props.theme.colorTextSecondary || '#666'};
  }
`;

export default StyledMainWrapper;
