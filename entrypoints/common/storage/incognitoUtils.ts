// 无痕窗口打开标签组的临时任务存储
// Chrome 的 split 无痕模式下，普通环境的 windows.create 拿不到无痕窗口对象，
// 因此由无痕环境中的辅助页面读取任务、执行打开，并通过临时存储回传结果
import type { OpenTarget } from '../openUtils';

export interface IncognitoOpenTask {
  id: string;
  targets: OpenTarget[];
  createdAt: number;
}

export interface IncognitoOpenResult {
  id: string;
  processedIds: string[];
  failed: boolean;
  finishedAt: number;
}

// 任务和结果的保留时长，超过后由下一次创建任务时清理，避免管理页中途关闭导致数据残留
const TASK_EXPIRE_TIME = 5 * 60 * 1000;

// 跨 split 环境的删除请求由普通后台消费，结果按相同 ID 回传。
export const INCOGNITO_REMOVE_GROUPS_PREFIX = 'incognitoRemoveGroups:';

export default class IncognitoUtils {
  taskStorageKeyPrefix: `local:${string}` = 'local:incognitoOpenTask';
  resultStorageKeyPrefix: `local:${string}` = 'local:incognitoOpenResult';

  getTaskStorageKey(id: string) {
    return `${this.taskStorageKeyPrefix}:${id}` as `local:${string}`;
  }
  getResultStorageKey(id: string) {
    return `${this.resultStorageKeyPrefix}:${id}` as `local:${string}`;
  }

  async setTask(task: IncognitoOpenTask) {
    await this.cleanExpired();
    return storage.setItem<IncognitoOpenTask>(this.getTaskStorageKey(task.id), task);
  }
  async getTask(id: string) {
    return storage.getItem<IncognitoOpenTask>(this.getTaskStorageKey(id));
  }
  async removeTask(id: string) {
    return storage.removeItem(this.getTaskStorageKey(id));
  }

  async setResult(result: IncognitoOpenResult) {
    return storage.setItem<IncognitoOpenResult>(
      this.getResultStorageKey(result.id),
      result,
    );
  }
  async getResult(id: string) {
    return storage.getItem<IncognitoOpenResult>(this.getResultStorageKey(id));
  }
  async removeResult(id: string) {
    return storage.removeItem(this.getResultStorageKey(id));
  }

  // 清理过期的任务和结果（管理页被关闭、无痕窗口未打开等情况会留下残留数据）
  async cleanExpired(expireTime: number = TASK_EXPIRE_TIME) {
    try {
      const items = await browser.storage.local.get(null);
      const taskPrefix = this.taskStorageKeyPrefix.slice('local:'.length);
      const resultPrefix = this.resultStorageKeyPrefix.slice('local:'.length);
      const now = Date.now();
      const expiredKeys = Object.keys(items).filter(key => {
        if (
          key.startsWith(`${taskPrefix}:`) ||
          key.startsWith(INCOGNITO_REMOVE_GROUPS_PREFIX)
        ) {
          const createdAt = (items[key] as IncognitoOpenTask | undefined)?.createdAt;
          return !createdAt || now - createdAt > expireTime;
        }
        if (key.startsWith(`${resultPrefix}:`)) {
          const finishedAt = (items[key] as IncognitoOpenResult | undefined)?.finishedAt;
          return !finishedAt || now - finishedAt > expireTime;
        }
        return false;
      });
      if (expiredKeys.length) {
        await browser.storage.local.remove(expiredKeys);
      }
    } catch (error) {
      console.warn('Unable to clean expired incognito task data', error);
    }
  }

  // 等待无痕环境回传结果，超时返回 null（任务未完成时保留原始数据）
  async waitResult(id: string, timeout: number = 60000, interval: number = 300) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const result = await this.getResult(id);
      if (result?.id === id) return result;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    return null;
  }
}
