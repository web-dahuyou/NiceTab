import { RuntimeMsgType, SendRuntimeMessageParams } from '@/entrypoints/types';
import { pageContextTypes } from '@/entrypoints/common/constants';

// 向插件发送消息
export async function sendRuntimeMessage<T extends RuntimeMsgType>({
  msgType,
  data,
  targetPageContexts = pageContextTypes,
}: SendRuntimeMessageParams<T>) {
  let _targetPageContexts = targetPageContexts?.length
    ? targetPageContexts || []
    : pageContextTypes;

  _targetPageContexts = _targetPageContexts.filter(ctx => ctx !== 'background')

  browser.runtime.sendMessage({ msgType, data, targetPageContext: 'background' });
  _targetPageContexts.forEach((targetPageContext) => {
    browser.runtime.sendMessage({ msgType, data, targetPageContext });
  });
}

export default {
  sendRuntimeMessage,
};
