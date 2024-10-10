import { useEffect } from 'react';
import { message } from 'antd';

export default function App() {
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    browser.runtime.onMessage.addListener(async (msg) => {
      // console.log('browser.runtime.onMessage--contentScript', msg);
      const { msgType, data } = msg || {};
      if (msgType === 'action:callback-message') {
        messageApi.open(data);
      }
    });
  }, []);

  return contextHolder;
}
