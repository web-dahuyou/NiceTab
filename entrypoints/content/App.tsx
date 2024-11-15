import { useEffect } from 'react';
import { theme, message } from 'antd';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '~/entrypoints/common/style/Common.styled';
import { sendBrowserMessage } from '~/entrypoints/common/utils';
import { GlobalContext } from '~/entrypoints/common/hooks/global';
import type { BrowserMessageProps, SendTargetProps } from '~/entrypoints/types';
import SendTargetModal from '~/entrypoints/options/home/SendTargetModal';

export default function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { themeTypeConfig } = NiceGlobalContext;
  const [sendTargetModalVisible, setSendTargetModalVisible] = useState(false);
  const [actionName, setActionName] = useState<string>('');

  const handleClose = useCallback(() => {
    setSendTargetModalVisible(false);
    setActionName('');
  }, []);

  const handleSend = useCallback(
    async (targetData: SendTargetProps) => {
      sendBrowserMessage('sendTabsActionConfirm', { actionName, targetData });
      handleClose();
    },
    [actionName]
  );

  useEffect(() => {
    browser.runtime.onMessage.addListener(async (msg: BrowserMessageProps) => {
      // console.log('browser.runtime.onMessage--contentScript', msg);
      const { msgType, data } = msg || {};

      if (msgType === 'action:open-send-target-modal') {
        setActionName(data?.actionName || '');
        setSendTargetModalVisible(true);
      } else if (msgType === 'action:callback-message') {
        messageApi.open(data);
      }
    });
  }, []);

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <GlobalStyle />
      {contextHolder}
      {/* 移动到弹窗 */}
      {sendTargetModalVisible && (
        <SendTargetModal
          visible={sendTargetModalVisible}
          onOk={handleSend}
          onCancel={handleClose}
        />
      )}
    </ThemeProvider>
  );
}
