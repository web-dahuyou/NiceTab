import { theme } from 'antd';
import { ThemeProvider } from 'styled-components';
import { GlobalContext } from '~/entrypoints/common/hooks/global';
import SendTargetActionHolder from '~/entrypoints/options/home/SendTargetActionHolder';
import { GlobalSearchPanel } from '~/entrypoints/common/components/BaseGlobalSearch';
import { GlobalStyle } from '~/entrypoints/common/style/Common.styled';

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { themeTypeConfig } = NiceGlobalContext;

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <GlobalStyle />
      <SendTargetActionHolder></SendTargetActionHolder>
      <GlobalSearchPanel pageContext="contentScriptPage"></GlobalSearchPanel>
    </ThemeProvider>
  );
}
