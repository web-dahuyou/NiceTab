import React from 'react';
import styled, { css } from 'styled-components';

export const StyledEllipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledActionIconBtn = styled.i<{
  $size?: number | string,
  $color?: string,
  $hoverColor?: string
}>`
  font-size: ${props => `${props.$size || 14}px`};
  color: ${props => props.$color || '#666'};
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    transform: scale(1.2);
    color: ${props => props.$hoverColor || '#666'};
  }
`;