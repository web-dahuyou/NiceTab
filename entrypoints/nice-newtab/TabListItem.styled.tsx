import styled from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';
import { StyledEllipsisLines } from '../common/style/Common.styled';

export const StyledTabCard = styled.div<{ theme: StyledThemeProps }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100px;
  padding: 8px 4px;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  overflow: visible;
  text-decoration: none;
  &:hover {
    background: ${props => props.theme.colorBgTextHover || 'rgba(0,0,0,0.06)'};
  }
  &:hover .tab-card-menu-btn {
    opacity: 1;
  }

  .tab-card-menu-btn {
    position: absolute;
    top: 10px;
    right: 2px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .tab-card-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 22%;
    overflow: hidden;
    background: ${props => props.theme.colorBgContainer || '#fff'};
    box-shadow: ${props =>
      props.theme.type === 'light'
        ? props.theme.boxShadow || '0 1px 3px rgba(0,0,0,0.08)'
        : '0 6px 16px 0 rgba(255,255,255,0.2), 0 3px 6px -4px rgba(255,255,255,0.2)'};
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }
  &:hover .tab-card-icon {
    transform: scale(1.05);
  }
`;

export const StyledTabCardTitle = styled.div<{ $lines: number }>`
  width: 100%;
  text-align: center;
  overflow: hidden;
  span {
    ${StyledEllipsisLines}
    font-size: 11px;
    color: ${props => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
    word-break: break-word;
  }
`;

export default {
  name: 'tab-item-styled',
};
