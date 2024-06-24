import styled from 'styled-components';
import {
  StyledEllipsis,
} from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';

export const StyledGroupWrapper = styled.div<{ $bgColor?: string }>`
  position: relative;
  width: 100%;
  margin-bottom: 24px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.$bgColor || '#fff'};
`;
export const StyledGroupHeader = styled.div<{ $primaryColor?: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  .group-status-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .group-name {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 18px;
    color: #666;
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
      color: #999;
    }
    .group-action-btns {
      margin-top: 4px;
      font-size: 12px;
      .action-btn {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #333;
        cursor: pointer;
        &:hover {
          color: ${(props) => props.$primaryColor || ENUM_COLORS.primary};
        }
      }
    }
  }
`;

export const StyledTabActions = styled.div<{ $primaryColor?: string }>`
  display: flex;
  align-items: center;
  gap: 24px;
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
      color: #333;
      cursor: pointer;
      &:hover {
        color: ${(props) => props.$primaryColor || ENUM_COLORS.primary};
      }
    }
  }
`;

export const StyledTabListWrapper = styled.div<{ $primaryColor?: string }>`
  min-height: 24px;
  margin-top: 8px;
  padding-left: 20px;
  .tab-list-checkbox-group {
    width: 100%;
    display: block;
  }
`;

export default {
  name: 'option-tab-group-styled',
}