import styled from 'styled-components';
import type { StyledThemeProps } from '~/entrypoints/types';
import { StyledEllipsis } from '../common/style/Common.styled';

export const StyledGroupHeader = styled.div<{ theme: StyledThemeProps }>`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid
    ${props =>
      props.theme.type === 'light'
        ? props.theme.colorBorderSecondary
        : props.theme.colorBorder};
  user-select: none;

  .newtab-group-count {
    font-size: 14px;
    color: ${props => props.theme.colorTextSecondary || '#666'};
    margin-left: auto;
  }
`;

export const StyledAddTabBtn = styled.div<{ theme: StyledThemeProps }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100px;
  padding: 8px 4px;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  border: 2px dashed ${props => props.theme.colorBorder || 'rgba(5, 5, 5, 0.06)'};
  color: ${props => props.theme.colorTextSecondary || '#666'};
  text-decoration: none;
  font-family: inherit;
  font-size: 12px;
  &:hover {
    // background: ${props => props.theme.colorBgTextHover || 'rgba(0,0,0,0.06)'};
    border-color: ${props => props.theme.colorPrimary || '#1890ff'};
    color: ${props => props.theme.colorPrimary || '#1890ff'};
  }

  .add-icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 22%;
    background: ${props => props.theme.colorBgTextHover || 'rgba(0,0,0,0.06)'};
    transition: all 0.15s;
    font-size: 24px;
    color: ${props => props.theme.colorTextSecondary || '#666'};
  }
  &:hover .add-icon-wrapper {
    background: ${props => props.theme.colorPrimaryBg || 'rgba(0, 0, 0, 0.1)'};
    color: ${props => props.theme.colorPrimary || '#1890ff'};
  }
  .add-label {
    max-width: 100%;
    text-align: center;
    ${StyledEllipsis}
  }
`;

export const StyledNewTabContainer = styled.div<{ theme: StyledThemeProps }>`
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${props => props.theme.colorBgContainer || '#fff'};
  color: ${props => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
  transition:
    background 0.3s,
    color 0.3s;

  .newtab-loading {
    width: 100%;
    height: 300px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .newtab-empty {
    margin-top: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: ${props => props.theme.colorTextSecondary || '#666'};
  }
  .newtab-empty-title {
    font-size: 18px;
    font-weight: bold;
    color: ${props => props.theme.colorText || 'rgba(0, 0, 0, 0.88)'};
    margin-bottom: 12px;
  }
  .newtab-empty-desc {
    font-size: 14px;
    margin-bottom: 24px;
  }

  .newtab-groups {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .newtab-group-section {
    width: 100%;
  }

  .newtab-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    justify-items: center;
  }
`;

export default {
  name: 'app-styled',
};
