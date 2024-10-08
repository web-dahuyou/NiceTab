import { Alert } from 'antd';
import { useIntlUtls } from '@/entrypoints/common/hooks/global';
import { StyledFooterWrapper } from './Footer.styled';
import SearchList from './SearchList';

export default function Footer() {
  const { $fmt } = useIntlUtls();
  return (
    <StyledFooterWrapper
      className="footer-wrapper"
      // $paddingLeft={sidebarCollapsed ? 0 : 280}
    >
      <SearchList></SearchList>
      {/* <Alert
        className="next-version-tip"
        type="warning"
        showIcon
        message={$fmt('home.tip.addScope')}
      /> */}
    </StyledFooterWrapper>
  )
}