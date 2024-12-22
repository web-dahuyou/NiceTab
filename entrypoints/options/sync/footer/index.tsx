import { Alert } from 'antd';
import { useIntlUtls } from '@/entrypoints/common/hooks/global';
import { StyledFooterWrapper } from './Footer.styled';

export default function Footer() {
  const { $fmt } = useIntlUtls();
  return (
    <StyledFooterWrapper
      className="footer-wrapper"
      // $paddingLeft={sidebarCollapsed ? 0 : 280}
    >
      <Alert
        className="tip"
        type="info"
        showIcon
        message={$fmt('sync.tip.supportTip')}
      />
    </StyledFooterWrapper>
  )
}