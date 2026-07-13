import styled from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';
import { StyledEllipsis } from '../common/style/Common.styled';

export const StyledSearchEngineBox = styled.div<{ theme: StyledThemeProps }>`
  width: 600px;
  margin-bottom: 48px;
  .newtab-search {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }
  .newtab-search-icon-btn {
    position: absolute;
    left: 10px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    z-index: 1;
    padding: 0;
    transition: background 0.15s;
    &:hover {
      background: ${props => props.theme.colorBgTextHover || 'rgba(0,0,0,0.06)'};
    }
  }
  .newtab-search-input {
    width: 100%;
    padding: 14px 20px 14px 48px;
    font-size: 16px;
    border: 1px solid ${props => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};
    border-radius: 24px;
    background: ${props => props.theme.colorBgElevated || '#fff'};
    color: ${props => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
    outline: none;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    font-family: inherit;
    &:focus {
      border-color: transparent;
      // box-shadow: 0 1px 6px rgba(32, 33, 36, 0.18);
      box-shadow: ${props =>
        props.theme.type === 'light'
          ? props.theme.boxShadowSecondary || '0 1px 3px rgba(0,0,0,0.08)'
          : '0 4px 12px 0 rgba(255,255,255,0.2), 0 3px 6px -4px rgba(255,255,255,0.2)'};
    }
    &::placeholder {
      color: ${props => props.theme.colorTextPlaceholder || '#666'};
    }
  }
`;
export const StyledEngineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

export const StyledEngineItem = styled.div<{
  theme: StyledThemeProps;
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};
  transition: all 0.15s;
  user-select: none;
  cursor: pointer;
  &:hover {
    background: ${props => props.theme.colorBgTextHover || 'rgba(0,0,0,0.06)'};
  }
  .engine-item-default {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: ${props => props.theme.colorPrimary || '#1890ff'};
    color: #fff;
    white-space: nowrap;
    flex-shrink: 0;
  }
`;

export const StyledEngineItemInfo = styled.div<{ theme: StyledThemeProps }>`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  .engine-item-name {
    font-size: 14px;
    font-weight: 500;
    color: ${props => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
    ${StyledEllipsis}
  }
`;

export default {
  name: 'search-engine-styled',
};
