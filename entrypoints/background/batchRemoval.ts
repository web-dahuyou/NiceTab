import {
  incognitoUtils,
  initIncognitoRemovalStorageListener,
} from '~/entrypoints/common/storage';
import {
  REMOVE_GROUPS_PORT,
  TAB_GROUP_REMOVAL_LOCK,
  type BatchRemovalReply,
} from '~/entrypoints/common/storage/batchRemoval';

export function initBatchRemoval(remove: (ids: string[]) => Promise<string[]>) {
  let pending = Promise.resolve();
  function enqueue(ids: unknown): Promise<BatchRemovalReply> {
    if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) {
      return Promise.resolve({ error: 'Invalid batch removal request' });
    }
    const result = pending.then(async (): Promise<BatchRemovalReply> => {
      try {
        const removedIds = globalThis.navigator?.locks
          ? await navigator.locks.request(TAB_GROUP_REMOVAL_LOCK, () => remove(ids))
          : await remove(ids);
        return { removedIds };
      } catch (error) {
        return { error: String(error) };
      }
    });
    pending = result.then(() => {});
    return result;
  }

  browser.runtime.onConnect.addListener(port => {
    if (port.name !== REMOVE_GROUPS_PORT) return;
    port.onMessage.addListener(async ids => {
      const result = await enqueue(ids);
      try {
        port.postMessage(result);
      } catch (error) {
        console.warn('Batch removal caller disconnected', error);
      }
    });
  });

  initIncognitoRemovalStorageListener(async (id, groupIds) => {
    const result = await enqueue(groupIds);
    await incognitoUtils.setResult({
      id,
      processedIds: 'removedIds' in result ? result.removedIds : [],
      failed: 'error' in result,
      finishedAt: Date.now(),
    });
  });

  // 普通后台自身的读取直接入队，无需向自己打开端口。
  return async () => {
    const result = await enqueue([]);
    if ('error' in result) throw new Error(result.error);
    return result.removedIds;
  };
}
