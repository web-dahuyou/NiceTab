import { theme } from 'antd';
import { ThemeProvider } from 'styled-components';
import { GlobalContext } from '~/entrypoints/common/hooks/global';
import SendTargetActionHolder from '~/entrypoints/options/home/SendTargetActionHolder';

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { themeTypeConfig } = NiceGlobalContext;

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <SendTargetActionHolder></SendTargetActionHolder>
    </ThemeProvider>
  );
}
