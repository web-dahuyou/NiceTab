import styled from 'styled-components';
import { blue } from '@ant-design/colors';
import { StyledThemeProps, StyledEllipsis } from '~/entrypoints/common/style/Common.styled';
import { PRIMARY_COLOR } from '~/entrypoints/common/constants';

export const StyledTabItemWrapper = styled.div<{ $bgColor?: string }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 24px;
  .checkbox-item {
    margin-right: 12px;
  }
  .tab-item-btn {
    margin-right: 8px;
  }
`;

export const StyledTabItemFavicon = styled.i<{ $bgUrl?: string }>`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background: url(${(props) => props.$bgUrl}) no-repeat center / 100% 100%;
`;

export const StyledTabTitle = styled.span<{ $color?: string; $colorHover?: string }>`
  flex: 1;
  width: 0;
  ${StyledEllipsis}
  .tab-item-title-text {
    font-size: 14px;
    color: ${(props) => props.$color || blue.primary};
    text-decoration: underline;
    cursor: pointer;
    &:hover {
      color: ${(props) => props.$colorHover || PRIMARY_COLOR};
    }
  }
`;

export const StyledTabItemTooltip = styled.div<{ theme: StyledThemeProps }>`
  .tooltip-item {
    display: flex;
    gap: 8px;
    font-size: 14px;
    color: ${(props) => props.theme.colorTextSecondary || '#666'};

    .label {
      flex-shrink: 0;
      flex-grow: 0;
      color: ${(props) => props.theme.colorTextSecondary || '#333'};
      font-weight: bold;
    }
    .name,
    .link {
      flex: 1;
      width: 0;
      ${StyledEllipsis}
    }
  }
`;

export default {
  name: 'option-tab-item-styled',
};
