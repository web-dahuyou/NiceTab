import { StyledFooterWrapper } from './Footer.styled';
import SearchList from './SearchList';

export default function Footer() {
  return (
    <StyledFooterWrapper
      className="footer-wrapper"
      // $paddingLeft={sidebarCollapsed ? 0 : 280}
    >
      <SearchList></SearchList>
    </StyledFooterWrapper>
  )
}