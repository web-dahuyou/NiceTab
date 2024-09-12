import styled, { css, createGlobalStyle } from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';

export type { StyledThemeProps } from '~/entrypoints/types';

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
  color: ${(props) => props.$color || props.theme.colorTextSecondary || '#666'};
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    transform: scale(${(props) => props.$hoverScale || 1.2});
    color: ${(props) => props.$hoverColor || props.theme.colorTextSecondary || '#666'};
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
  }
  html, body {
    --bg-color: ${(props) => props.theme.colorBgContainer || '#fff'};
    --text-color: ${(props) => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
    color: ${(props) => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
	}

  ::-webkit-scrollbar, .ant-tree-list-scrollbar {
    width: 8px !important;
    height: 8px !important;
  }

  ::-webkit-scrollbar-track {
    border-radius: 4px;
    background: var(--bg-color, #fff) !important;
  }

  ::-webkit-scrollbar-thumb, .ant-tree-list-scrollbar-thumb {
    border-radius: 4px;
    background: ${(props) => `${props.theme.type === 'light' ? '#d9d9d9' : '#555'} !important`};
    box-shadow:inset 0 0 4px rgba(0, 0, 0, .3);
  }

  ::-webkit-scrollbar-thumb:hover, .ant-tree-list-scrollbar-thumb:hover {
    background: ${(props) => `${props.theme.type === 'light' ? '#bfbfbf' : '#888'} !important`};
  }
`;
