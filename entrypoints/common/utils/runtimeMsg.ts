import type {
  RuntimeMsgType,
  SendRuntimeMessageParams,
  SnapshotPortAction,
  SnapshotPortRequest,
  SnapshotPortResult,
} from '~/entrypoints/types';
import { pageContextTypes } from '~/entrypoints/common/constants';

export const SNAPSHOT_ACTION_PORT = 'snapshotAction';

export function requestSnapshotAction<T extends SnapshotPortAction>(
  request: { action: T } & SnapshotPortRequest<T>,
) {
  const port = browser.runtime.connect({ name: SNAPSHOT_ACTION_PORT });
  return new Promise<SnapshotPortResult<T>>((resolve, reject) => {
    port.onDisconnect.addListener(() =>
      reject(new Error('Snapshot action disconnected')),
    );
    port.onMessage.addListener(result => {
      resolve(result as SnapshotPortResult<T>);
      port.disconnect();
    });
    port.postMessage(request);
  });
}

// 向插件发送消息
export async function sendRuntimeMessage<T extends RuntimeMsgType>({
  msgType,
  data,
  targetPageContexts = pageContextTypes,
}: SendRuntimeMessageParams<T>) {
  let _targetPageContexts = targetPageContexts?.length
    ? targetPageContexts || []
    : pageContextTypes;

  _targetPageContexts = _targetPageContexts.filter(ctx => ctx !== 'background');

  browser.runtime.sendMessage({ msgType, data, targetPageContext: 'background' });
  _targetPageContexts.forEach(targetPageContext => {
    browser.runtime.sendMessage({ msgType, data, targetPageContext });
  });
}

export default {
  sendRuntimeMessage,
};
