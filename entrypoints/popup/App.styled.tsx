import styled from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';

export const StyledContainer = styled.div<{ theme: StyledThemeProps }>`
  min-width: 460px;
  max-width: 600px;
  min-height: 420px;
  max-height: 590px; // 浏览器popup高度最大为600px, 超过这个高度会出现body滚动条
  display: flex;
  flex-direction: column;

  .fixed-top {
    flex-shrink: 0;
    flex-grow: 0;
    position: relative;
    transition: all 0.3s ease;

    &.compact {
      .block {
        padding: 4px 10px;
        min-height: 32px;
        gap: 4px;
        .block-title {
          font-size: 12px;
        }
        .action-btn {
          font-size: 12px;
        }
      }
    }

    .compact-toolbar {
      display: flex;
      align-items: center;
      padding: 4px 42px 4px 6px;
      min-height: 38px;
      gap: 2px;

      button {
        color: ${props => props.theme.colorTextSecondary || '#333'};
        border: none;
        box-shadow: none;
        &:hover {
          color: ${props => props.theme.colorPrimary};
          background: rgba(0, 0, 0, 0.05);
        }
      }
    }
    .toggle-compact-btn {
      position: absolute;
      top: 4px;
      right: 6px;
      z-index: 10;
      cursor: pointer;
      color: ${props => props.theme.colorTextSecondary || '#333'};
      border: none;
      box-shadow: none;
      &:hover {
        color: ${props => props.theme.colorPrimary};
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }
  .block {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #0505050f;
    gap: 8px;
    font-size: 13px;
    .block-title {
      flex-shrink: 0;
      font-weight: bold;
    }
    button {
      font-size: 12px;
    }
    .block-content {
      flex: 1;
      width: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    &.quick-actions {
      .action-btn {
        display: inline-flex;
        color: ${props => props.theme.colorTextSecondary || '#333'};
        cursor: pointer;
        &:not(.disabled):hover {
          color: ${props => props.theme.colorPrimary};
        }
        &.disabled {
          color: ${props => props.theme.colorTextQuaternary || 'rgba(0, 0, 0, 0.25)'};
          cursor: not-allowed;
        }
      }
    }
    &.theme-colors {
      display: flex;
      align-items: center;
    }
  }
  .tab-list-title {
    padding: 12px;
    font-size: 14px;
    font-weight: bold;
  }
  .block-opened-tabs {
    flex: 1;
    padding-bottom: 12px;
    overflow-y: auto;
  }
`;

export const StyledGroupWrapper = styled.div<{ $color?: string }>`
  margin: 4px 0;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    width: calc(100% - 6px);
    height: 100%;
    top: 0;
    left: 4px;
    border-radius: 6px;
    border: 1px solid #d9d9d9;
    pointer-events: none;
  }
  .group-title {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    gap: 8px;
    cursor: pointer;
    .collapse-icon-btn {
      font-size: 14px;
    }
    .group-name {
      flex: 1;
      overflow: hidden;
      font-size: 12px;
      color: ${props => props.theme.colorText || '#000'};
      ${StyledEllipsis}
    }
  }
  .tab-list {
    display: block;
    .tab-list-item {
      position: relative;
      padding-left: 24px;
      .group-color-flag {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        background-color: ${props => props.$color || 'transparent'};
      }
    }
  }
  &.collapsed {
    .tab-list {
      display: none;
    }
  }
`;

export const StyledTabItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  &:hover,
  &.active {
    background: ${props => props.theme.colorPrimaryBg || 'rgba(0, 0, 0, 0.1)'};
  }
  // &.active:before {
  //   content: '';
  //   position: absolute;
  //   left: 0;
  //   top: 0;
  //   width: 3px;
  //   height: 100%;
  //   background: ${props => props.theme.colorPrimary};
  // }
  .tab-item-title {
    flex: 1;
    overflow: hidden;
    font-size: 12px;
    color: ${props => props.theme.colorText || '#000'};
    ${StyledEllipsis}
  }
  .action-icon-btn {
    flex-shrink: 0;
    margin-left: 8px;
  }
  &.discarded {
    .tab-item-title,
    .btn-discarded {
      color: ${props => props.theme.colorTextQuaternary || 'rgba(0, 0, 0, 0.25)'};
    }
  }
`;

export const StyledFavIcon = styled.i<{ $icon?: string }>`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background: url(${props => props.$icon}) center / 100% 100% no-repeat;
`;

export default {
  name: 'popup-app-styled',
};
