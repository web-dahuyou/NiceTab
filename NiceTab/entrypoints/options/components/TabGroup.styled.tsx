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
    .group-create-time {
      font-size: 12px;
      color: #999;
    }
    .group-action-btns {
      display: flex;
      align-items: center;
      gap: 4px;
      .action-btn {
        display: inline-flex;
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

export const StyledTabListWrapper = styled.ul<{ $primaryColor?: string }>`
  margin-top: 8px;
  padding-left: 20px;
  .tab-list-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 2px 0;
    .tab-item-btn {
      margin-right: 8px;
    }
  }
`;

export const StyledTabItemFavicon = styled.i<{ $bgUrl?: string }>`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background: url(${(props) => props.$bgUrl}) no-repeat center / 100% 100%;
`;

export const StyledTabTitle = styled.a<{ $primaryColor?: string }>`
  flex: 1;
  width: 0;
  ${StyledEllipsis}
  .tab-title {
    color: ${ENUM_COLORS.blue.primary};
    text-decoration: underline;
    cursor: pointer;
    &:hover {
      color: ${(props) => props.$primaryColor || ENUM_COLORS.primary};
    }
  }
`;