import styled from 'styled-components';
import { StyledBaseSidebarWrapper, StyledBaseMainWrapper } from '../Layout.styled';
import { StyledEllipsis } from '~/entrypoints/common/style/Common.styled';

export const StyledMainWrapper = StyledBaseMainWrapper;

export const StyledSidebarWrapper = styled(StyledBaseSidebarWrapper)<{
  $collapsed?: boolean;
  $sidebarWidth?: number;
}>`
  .sidebar-inner-content {
    padding-right: 10px;
    padding-bottom: 30px;
    overflow: auto;
  }
`;

export const StyledCard = styled.div`
  .card-item {
    border-color: ${(props) => props.theme.colorBorder};
    &.active {
      border-color: ${(props) => props.theme.colorPrimary};
    }
    .icon-btn-wrapper {
      padding: 4px;
    }
  }
`;

export const StyledCardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  .card-title {
    font-weight: bold;
    font-weight: 600;
    font-size: 14px;
  }
`;

export const StyledResult = styled.div`
  display: flex;
  align-items: center;
`;
export const StyledLabel = styled.span`
  flex-shrink: 0;
  margin-right: 8px;
`;
export const StyledText = styled.span`
  flex: 1;
  width: 0;
  ${StyledEllipsis}
`;

export default {
  name: 'option-sync-styled',
};
