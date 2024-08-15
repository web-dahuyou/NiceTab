import React from 'react';
import styled, { css } from 'styled-components';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';

export const StyledContainer = styled.div<{ $primaryColor?: string }>`
  min-width: 420px;
  max-width: 520px;
  min-height: 300px;
  max-height: 590px; // 浏览器popup高度最大为600px, 超过这个高度会出现body滚动条
  display: flex;
  flex-direction: column;

  .fixed-top {
    flex-shrink: 0;
    flex-grow: 0;
  }
  .block {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #0505050f;
    gap: 8px;
    .block-title {
      color: #000;
      font-size: 14px;
      font-weight: bold;
    }
    button { font-size: 12px; }
    &.quick-actions {
      .action-btn {
        display: inline-flex;
        font-size: 12px;
        color: #333;
        cursor: pointer;
        &:hover {
          color: ${(props) => props.$primaryColor || ENUM_COLORS.primary};
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
    color: #000;
    font-size: 14px;
    font-weight: bold;
  }
`;

export const StyledList = styled.div<{$primaryColor?: string; $bgColor?: string}>`
  flex: 1;
  overflow-y: auto;
  .tab-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 6px 10px;
    cursor: pointer;
    &:hover, &.active {
      background: ${props => props.$bgColor || 'rgba(0, 0, 0, 0.1)'};
    }
    &.active:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 3px;
      height: 100%;
      background: ${props => props.$primaryColor || ENUM_COLORS.primary};
    }
    .tab-item-title {
      flex: 1;
      overflow: hidden;
      ${StyledEllipsis}
      font-size: 12px;
    }
    .action-icon-btn {
      flex-shrink: 0;
      margin-left: 8px;
    }
  }
`;

export const StyledFavIcon = styled.i<{ $icon?: string }>`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background: url(${(props) => props.$icon}) center / 100% 100% no-repeat;
`;

export default {
  name: 'popup-app-styled',
}
