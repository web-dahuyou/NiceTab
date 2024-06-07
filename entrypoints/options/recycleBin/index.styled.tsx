import styled from 'styled-components';
import {
  StyledEllipsis,
} from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';

export const StyledEmptyBox = styled.div`
  display: flex;
  justify-content: center;
  padding: 100px 0;
`;

export const StyledRecycleBinWrapper = styled.div<{ $primaryColor: string }>`
  .header-action-btns {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    button {
      font-size: 12px;
    }
  }
`;

export const StyledTagNode = styled.div<{ $primaryColor: string }>`
  display: flex;
  align-items: center;
  padding-left: 4px;
  gap: 12px;
  .tag-name {
    flex-shrink: 0;
    font-size: 14px;
    color: #333;
  }
  .tag-create-time {
    font-size: 12px;
    color: #999;
  }
  .action-btns {
    padding: 0 8px;
    border-radius: 4px;
    background: #fff;
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
`;

export default {
  name: 'option-recycle-bin-styled',
}