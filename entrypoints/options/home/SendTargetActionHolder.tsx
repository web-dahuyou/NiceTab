import { useEffect, forwardRef, useContext, useImperativeHandle } from 'react';
import { message } from 'antd';
import { ContentGlobalContext } from '~/entrypoints/content/context';
import { sendRuntimeMessage } from '~/entrypoints/common/utils';
import type {
  SendTabMsgEventProps,
  SendTargetProps,
  SendTabMsgOpenSendTargetModal,
  PageContextType,
} from '~/entrypoints/types';
import SendTargetModal from '~/entrypoints/options/home/SendTargetModal';

export interface SendTargetActionHolderProps {
  show?: (data: SendTabMsgOpenSendTargetModal['data']) => void;
}

export default forwardRef(
  ({ pageContext = 'optionsPage' }: { pageContext?: PageContextType }, ref) => {
    const contentContext = useContext(ContentGlobalContext);
    // content script 中的 antd 样式被限制在 shadow root 内，
    // message 默认 portal 到 document.body 会拿不到样式（提示不可见），因此挂载到 shadow root 内
    const [messageApi, contextHolder] = message.useMessage({
      getContainer: () => contentContext.rootWrapper || document.body,
    });
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
      [actionName, handleClose],
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

    useImperativeHandle(
      ref,
      (): SendTargetActionHolderProps => ({
        show: data => {
          handleOpen(data);
        },
      }),
    );

    return (
      <>
        {contextHolder}
        {/* 移动到弹窗 */}
        {sendTargetModalVisible && (
          <SendTargetModal
            visible={sendTargetModalVisible}
            pageContext={pageContext}
            onOk={handleSend}
            onCancel={handleClose}
          />
        )}
      </>
    );
  },
);
