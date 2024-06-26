import styled, { css } from 'styled-components';

export const StyledEllipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// action icon btn
export const StyledActionIconBtn = styled.i<{
  $size?: number | string,
  $color?: string,
  $hoverColor?: string
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => `${+(props.$size || 16) + 2}px`};
  height: ${props => `${+(props.$size || 16) + 2}px`};
  font-size: ${props => `${props.$size || 14}px`};
  color: ${props => props.$color || '#666'};
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    transform: scale(1.2);
    color: ${props => props.$hoverColor || '#666'};
  }
`;

// toogle theme color block item
export const StyledColorItem = styled.div`
position: relative;
width: 24px;
height: 24px;
border-radius: 4px;
cursor: pointer;
&.active {
  &:after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -6px;
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background: red;
  }
}
`;