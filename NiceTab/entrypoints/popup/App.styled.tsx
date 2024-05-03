import React from 'react';
import styled, { css } from 'styled-components';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';

export const StyledList = styled.div<{$primaryColor?: string}>`
  min-width: 240px;
  max-height: 500px;
  overflow-y: auto;
  .tab-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 6px 10px;
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
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
