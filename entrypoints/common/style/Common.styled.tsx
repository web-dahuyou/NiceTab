import styled, { css, createGlobalStyle } from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';

export type { StyledThemeProps } from '~/entrypoints/types';

export const StyleBtnDisabled = css`
  color: ${(props) => props.theme.colorTextDisabled || 'rgba(0,0,0,0.25)'};
  cursor: not-allowed;
`;

// 单行超长省略
export const StyledEllipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
// 多行超长省略
export const StyledEllipsisLines = css<{ $lines?: number }>`
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${(props) => props.$lines || 2};
`;

// action icon btn
export const StyledActionIconBtn = styled.i<{
  theme: StyledThemeProps;
  disabled?: boolean;
  $size?: number | string;
  $color?: string;
  $hoverColor?: string;
  $hoverScale?: number;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => `${+(props.$size || 16) + 2}px`};
  height: ${(props) => `${+(props.$size || 16) + 2}px`};
  font-size: ${(props) => `${props.$size || 14}px`};
  transition: transform 0.2s, color 0.2s;
  cursor: pointer;
  ${(props) =>
    props.disabled
      ? `
        transform: scale(1);
        color: ${props.theme.colorTextDisabled || 'rgba(0,0,0,0.25)'};
        cursor: not-allowed;
      `
      : `
        color: ${props.$color || props.theme.colorTextSecondary || '#666'};
        &:hover {
          transform: scale(${props.$hoverScale || 1.2});
          color: ${props.$hoverColor || props.theme.colorPrimary || '#666'};
        }
      `};

  &.disabled {
    transform: scale(1);
    ${StyleBtnDisabled}
  }
`;

export const StyledActionTextBtn = styled.span<{
  theme: StyledThemeProps;
  disabled?: boolean;
  $color?: string;
  $hoverColor?: string;
}>`
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.colorTextSecondary || '#333'};
  cursor: pointer;
  &:hover {
    color: ${(props) => props.$hoverColor || props.theme.colorPrimary || '#666'};
  }
  &.disabled {
    ${StyleBtnDisabled}
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
      content: '';
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

export const GlobalStyle = createGlobalStyle`
  :root {
    --bg-color: ${(props) => props.theme.colorBgContainer || '#fff'};
    --link-color: ${(props) =>
      props.theme.type === 'light' ? props.theme.colorLink : '#8AB4F8'};
    --link-color-hover: ${(props) =>
      props.theme.type === 'light' ? props.theme.colorLinkHover : '#8AB4F8b6'};
  }
  html, body {
    --bg-color: ${(props) => props.theme.colorBgContainer || '#fff'};
    --text-color: ${(props) => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
    color: ${(props) => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
  }

  .ellipsis {
    ${StyledEllipsis}
  }

  a.link {
    color: var(--link-color);
    cursor: pointer;
    &:hover {
      color: var(--link-color-hover);
    }
  }

  ::-webkit-scrollbar,
  .nicetab-tree-list-scrollbar-vertical,
  .rc-virtual-list-scrollbar-vertical {
    width: 8px !important;
  }

  ::-webkit-scrollbar-track {
    border-radius: 4px;
    background: var(--bg-color, #fff) !important;
  }

  ::-webkit-scrollbar-thumb,
  .nicetab-tree-list-scrollbar-thumb,
  .rc-virtual-list-scrollbar-thumb {
    border-radius: 4px;
    background: ${(props) =>
      `${props.theme.type === 'light' ? '#d9d9d9' : '#555'} !important`};
    box-shadow:inset 0 0 4px rgba(0, 0, 0, .3);
  }

  ::-webkit-scrollbar-thumb:hover,
  .nicetab-tree-list-scrollbar-thumb:hover,
  .rc-virtual-list-scrollbar-thumb:hover {
    background: ${(props) =>
      `${props.theme.type === 'light' ? '#bfbfbf' : '#888'} !important`};
  }
`;
