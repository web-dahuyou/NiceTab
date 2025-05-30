import styled from 'styled-components';
import {
  StyledThemeProps,
  StyledEllipsis,
} from '~/entrypoints/common/style/Common.styled';

export const StyledTabItemWrapper = styled.div<{ $bgColor?: string }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 28px;
  padding-left: 4px;
  background: ${(props) => props.$bgColor || ''};
  .checkbox-item {
    margin-right: 12px;
  }
  .tab-item-btn {
    margin-right: 8px;
    &.btn-remove {
      visibility: hidden;
      pointer-eventes: none;
    }
  }
  &:not(.locked):hover {
    .btn-remove {
      visibility: visible;
      pointer-eventes: unset;
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

export const StyledTabTitle = styled.span`
  flex: 1;
  width: 0;
  ${StyledEllipsis}
  .tab-item-title-text {
    font-size: 14px;
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
