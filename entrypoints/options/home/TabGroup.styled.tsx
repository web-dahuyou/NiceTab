import styled from 'styled-components';
import { PRIMARY_COLOR } from '~/entrypoints/common/constants';
import type { StyledThemeProps } from '@/entrypoints/types';

export const StyledGroupWrapper = styled.div<{ $bgColor?: string }>`
  position: relative;
  width: 100%;
  padding: 8px 8px 24px;
  border-radius: 8px;
  background: ${props => props.$bgColor || '#fff'};
`;
export const StyledGroupHeader = styled.div<{ theme: StyledThemeProps }>`
  display: flex;
  align-items: center;
  gap: 12px;
  .group-status-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .group-header-right-part {
    flex: 1;
    .group-info {
      display: flex;
      align-items: center;
    }
    .tab-count {
      margin-right: 8px;
      font-size: 14px;
    }
    .group-create-time {
      font-size: 12px;
      color: ${(props) => props.theme.colorTextTertiary || '#999'};
    }
    .group-action-btns {
      margin-top: 4px;
      font-size: 12px;
      .action-btn {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: ${(props) => props.theme.colorTextSecondary || '#333'};
        cursor: pointer;
        &:hover {
          color: ${(props) => props.theme.colorPrimary || PRIMARY_COLOR};
        }
      }
    }
  }
`;

export const StyledTabActions = styled.div<{ theme: StyledThemeProps }>`
  display: flex;
  align-items: center;
  gap: 24px;
  height: 26px;
  margin: 8px 0;
  padding: 0 20px;
  font-size: 12px;
  .checkall-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .tab-action-btns {
    margin: 4px 0;
    font-size: 12px;
    .action-btn {
      display: flex;
      align-items: center;
      color: ${(props) => props.theme.colorTextSecondary || '#333'};
      cursor: pointer;
      &:hover {
        color: ${(props) => props.theme.colorPrimary || PRIMARY_COLOR};
      }
    }
  }
`;

export const StyledTabListWrapper = styled.div`
  min-height: 24px;
  margin-top: 8px;
  padding-left: 20px;
  .tab-list-checkbox-group {
    width: 100%;
    display: block;
  }
  .show-rest-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 12px;
    cursor: pointer;
    color: ${(props) => props.theme.colorTextSecondary || '#666'};
  }
`;

export default {
  name: 'option-tab-group-styled',
}