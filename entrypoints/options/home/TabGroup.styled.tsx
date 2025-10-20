import styled from 'styled-components';
import { ENUM_COLORS, PRIMARY_COLOR } from '~/entrypoints/common/constants';
import type { StyledThemeProps } from '~/entrypoints/types';
import { StyleBtnDisabled } from '~/entrypoints/common/style/Common.styled';

export const StyledGroupWrapper = styled.div<{ $bgColor?: string }>`
  position: relative;
  width: 100%;
  padding: 16px 8px;
  border-radius: 8px;
  background: ${props => props.$bgColor || '#fff'};
`;
export const StyledGroupHeader = styled.div<{ theme: StyledThemeProps }>`
  padding: 0 8px;
  gap: 12px;
  .group-header-top {
    display: flex;
    align-items: center;
    gap: 12px;
    .group-status-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .group-name-wrapper {
      margin-right: 12px;
    }
    .group-info {
      display: flex;
      align-items: center;
      font-size: 14px;
      .tab-count {
        margin-right: 8px;
      }
      .group-create-time {
        color: ${props => props.theme.colorTextTertiary || '#999'};
      }
    }
  }
  .group-action-btns {
    margin-top: 4px;
    font-size: 14px;
  }
`;

export const StyledGroupHeaderRecycle = styled(StyledGroupHeader)`
  display: flex;
  align-items: center;
  .group-header-top {
    .group-name-wrapper {
      margin-right: 0;
    }
  }
  .group-action-btns {
    margin-top: 0;
    padding: 0 8px;
    .action-btn {
      display: flex;
      align-items: center;
      color: ${props => props.theme.colorTextSecondary || '#333'};
      cursor: pointer;
      &:hover {
        color: ${props => props.theme.colorPrimary || PRIMARY_COLOR};
      }
      &.disabled {
        ${StyleBtnDisabled}
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
  padding: 0 30px;
  font-size: 12px;
  user-select: none;
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
      color: ${props => props.theme.colorTextSecondary || '#333'};
      cursor: pointer;
      &:hover {
        color: ${props => props.theme.colorPrimary || PRIMARY_COLOR};
      }
    }
  }
`;

export const StyledTabListWrapper = styled.div`
  min-height: 24px;
  margin-top: 8px;
  // margin-left: 24px;
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
    color: ${props => props.theme.colorTextSecondary || '#666'};
  }
`;

export default {
  name: 'option-tab-group-styled',
};
