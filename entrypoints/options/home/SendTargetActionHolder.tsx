import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { message } from 'antd';
import { sendRuntimeMessage } from '~/entrypoints/common/utils';
import type {
  SendTabMsgEventProps,
  SendTargetProps,
  SendTabMsgOpenSendTargetModal,
} from '~/entrypoints/types';
import SendTargetModal from '~/entrypoints/options/home/SendTargetModal';

export interface SendTargetActionHolderProps {
  show?: (data: SendTabMsgOpenSendTargetModal['data']) => void;
}

export default forwardRef((_, ref) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [sendTargetModalVisible, setSendTargetModalVisible] = useState(false);
  const [actionName, setActionName] = useState<string>('');

  const handleOpen = useCallback((data?: SendTabMsgOpenSendTargetModal['data']) => {
    if (!data?.actionName) return;
    setSendTargetModalVisible(true);
    setActionName(data?.actionName!);
  }, []);

  const handleClose = useCallback(() => {
    setSendTargetModalVisible(false);
    setActionName('');
  }, []);

  const handleSend = useCallback(
    async (targetData: SendTargetProps) => {
      sendRuntimeMessage({
        msgType: 'sendTabsActionConfirm',
        data: { actionName, targetData },
        targetPageContexts: ['background'],
      });
      handleClose();
    },
    [actionName]
  );

  const messageListener = async (msg: unknown) => {
    // console.log('browser.runtime.onMessage--sendTargetAction', msg);
    const { msgType, data } = (msg || {}) as SendTabMsgEventProps;

    if (msgType === 'action:open-send-target-modal') {
      setActionName(data?.actionName || '');
      setSendTargetModalVisible(true);
    } else if (msgType === 'action:callback-message') {
      const msgKey = 'sendTargetActionCallback';
      message.destroy(msgKey);
      messageApi.open({ key: msgKey, ...data });
    }
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(messageListener);
  }, []);

  useImperativeHandle(ref, (): SendTargetActionHolderProps => ({
    show: (data) => {
      handleOpen(data);
    }
  }));

  return (
    <>
      {contextHolder}
      {/* 移动到弹窗 */}
      {sendTargetModalVisible && (
        <SendTargetModal
          visible={sendTargetModalVisible}
          onOk={handleSend}
          onCancel={handleClose}
        />
      )}
    </>
  );
});
