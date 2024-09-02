import styled from 'styled-components';
import { PRIMARY_COLOR } from '~/entrypoints/common/constants';
import { StyledThemeProps } from '~/entrypoints/types';

export const StyledEmptyBox = styled.div`
  display: flex;
  justify-content: center;
  padding: 100px 0;
`;

export const StyledRecycleBinWrapper = styled.div`
  .header-action-btns {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    button {
      font-size: 12px;
    }
  }
`;

export const StyledTagNode = styled.div<{ theme: StyledThemeProps }>`
  display: flex;
  align-items: center;
  padding-left: 4px;
  gap: 12px;
  .tag-name {
    flex-shrink: 0;
    font-size: 14px;
    color: ${(props) => props.theme.colorText || '#333'};
  }
  .count {
    margin-right: 8px;
    font-size: 14px;
  }
  .tag-create-time {
    font-size: 12px;
    color: ${(props) => props.theme.colorTextTertiary || '#999'};
  }
  .action-btns {
    padding: 0 8px;
    border-radius: 4px;
    background: ${(props) => props.theme.colorBgContainer || '#fff'};
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
`;

export default {
  name: 'option-recycle-bin-styled',
}