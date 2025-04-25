import styled from 'styled-components';
import { StyledBaseSidebarWrapper, StyledBaseMainWrapper } from '../Layout.styled';

export const StyledMainWrapper = StyledBaseMainWrapper;

export const StyledSidebarWrapper = styled(StyledBaseSidebarWrapper)<{
  $collapsed?: boolean;
  $sidebarWidth?: number;
}>`
  .sidebar-inner-box {
    display: flex;
    flex-direction: column;
  }
  .sidebar-inner-content {
    padding-right: 10px;
    padding-bottom: 30px;
    overflow: auto;
  }
  .sidebar-inner-footer {
    display: flex;
    justify-content: center;
    margin-top: auto;
    padding: 20px 10px 0;
  }
  .nicetab-menu-vertical {
    border-inline-end: none !important;
  }
`;

export const StyledFooterWrapper = styled.div`
  display: flex;
  text-align: center;
  justify-content: center;
  padding: 20px;
  font-size: 14px;
  color: #999;
`;

export default {
  name: 'option-settings-styled',
};
