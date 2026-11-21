import Store from './instanceStore';
import { INCOGNITO_REMOVE_GROUPS_PREFIX } from './incognitoUtils';

export const REMOVE_GROUPS_PORT = 'removeTabGroups';
export type BatchRemovalReply = { removedIds: string[] } | { error: string };

function requestFromBackground(groupIds: string[]) {
  const port = browser.runtime.connect({ name: REMOVE_GROUPS_PORT });
  return new Promise<string[]>((resolve, reject) => {
    port.onDisconnect.addListener(() => {
      reject(
        new Error(
          browser.runtime.lastError?.message || 'Batch removal port disconnected',
        ),
      );
    });
    port.onMessage.addListener(message => {
      const reply = message as BatchRemovalReply;
      if ('error' in reply) reject(new Error(reply.error));
      else resolve(reply.removedIds);
      port.disconnect();
    });
    port.postMessage(groupIds);
  });
}

async function requestFromIncognito(groupIds: string[]) {
  const id = crypto.randomUUID();
  const key = `${INCOGNITO_REMOVE_GROUPS_PREFIX}${id}`;
  await browser.storage.local.set({ [key]: { groupIds, createdAt: Date.now() } });
  try {
    const result = await Store.incognitoUtils.waitResult(id);
    if (!result || result.failed) throw new Error('Incognito batch removal failed');
    return result.processedIds;
  } finally {
    await browser.storage.local.remove(key);
    await Store.incognitoUtils.removeResult(id);
  }
}

// 普通扩展页面和普通后台必须使用同一把锁，覆盖从读取主列表到写完回收站。
export const TAB_GROUP_REMOVAL_LOCK = 'nicetab:removeTabGroups';

function enqueueRemoval(groupIds: string[]) {
  if (browser.extension.inIncognitoContext) return requestFromIncognito(groupIds);
  // 内容脚本里的锁属于网页来源，不能用来保护扩展存储。
  if (!navigator.locks || !location.href.startsWith(browser.runtime.getURL('/'))) {
    return requestFromBackground(groupIds);
  }
  let acquired = false;
  return navigator.locks
    .request(TAB_GROUP_REMOVAL_LOCK, () => {
      acquired = true;
      return Store.tabListUtils.removeTabGroups(groupIds);
    })
    .catch(error => {
      if (acquired) throw error;
      return requestFromBackground(groupIds);
    });
}

export function requestTabListRepair() {
  return enqueueRemoval([]);
}

export async function requestTabGroupRemoval(groupIds: string[]) {
  let remaining = groupIds;
  const removedIds: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      removedIds.push(...(await enqueueRemoval(remaining)));
      break;
    } catch (error) {
      // 回执可能在提交之后丢失。只重试仍存在的组，写入时会再次检查锁定状态。
      const tags = await Store.tabListUtils.getTagList();
      const present = new Set(
        tags.flatMap(tag => tag.groupList.map(group => group.groupId)),
      );
      removedIds.push(...remaining.filter(id => !present.has(id)));
      remaining = remaining.filter(id => present.has(id));
      if (!remaining.length) break;
      if (attempt === 1) throw error;
      console.warn('Retrying batch tab group removal', error);
    }
  }
  // 删除已提交。其他上下文执行删除时，本页还需要重新读取缓存。
  try {
    await Store.tabListUtils.getTagList();
  } catch (error) {
    console.warn('Unable to refresh tab list after batch removal', error);
  }
  return removedIds;
}
