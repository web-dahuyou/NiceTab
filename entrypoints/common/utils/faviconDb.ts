// favicon 的 IndexedDB 持久化层
// 扩展页面和 background(service worker) 共用同一个库
// 注意：这里不要依赖 window / document，否则无法在 background 中运行

export type FaviconSource =
  | 'browser'
  | 'ext'
  | 'gstatic'
  | 'ddg'
  | 'bonjourr'
  | 'ico'
  | 'default';

export interface FaviconRecord {
  origin: string;
  url: string;
  timestamp: number;
  source: FaviconSource;
  failedUntil?: number;
  failedIcons?: [url: string, expiresAt: number][];
}

export const FAVICON_DB_NAME = 'nicetab';
export const FAVICON_DB_VERSION = 2;
export const FAVICON_STORE_NAME = 'favicons';
export const MAX_DATA_URL_LENGTH = 2 * 1024;
const TIMESTAMP_INDEX = 'timestamp';
const FAILURE_INDEX = 'failedUntil';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(FAVICON_DB_NAME, FAVICON_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.objectStoreNames.contains(FAVICON_STORE_NAME)
        ? request.transaction!.objectStore(FAVICON_STORE_NAME)
        : db.createObjectStore(FAVICON_STORE_NAME, { keyPath: 'origin' });
      if (!store.indexNames.contains(TIMESTAMP_INDEX))
        store.createIndex(TIMESTAMP_INDEX, 'timestamp');
      if (!store.indexNames.contains(FAILURE_INDEX))
        store.createIndex(FAILURE_INDEX, 'failedUntil');
    };

    request.onsuccess = () => {
      const db = request.result;
      // 其他上下文升级版本时主动关闭连接，避免阻塞升级
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      // 连接被异常关闭（清理数据、浏览器回收等）时重置，下次自动重连
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open favicon database'));
    };

    // 旧连接没有关闭时升级会被阻塞，等其自行关闭即可
    request.onblocked = () => {};
  });
}

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB().catch(error => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

// 连接失效后重试一次：缓存场景失败就当作未命中
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    dbPromise = null;
    return operation();
  }
}

function runRequest<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(FAVICON_STORE_NAME, mode);
    const request = createRequest(transaction.objectStore(FAVICON_STORE_NAME));

    let result: T;
    let hasResult = false;

    request.onsuccess = () => {
      result = request.result;
      hasResult = true;
    };
    request.onerror = () => reject(request.error);
    // 以事务提交为准，避免请求成功但事务回滚时误判为写入成功
    transaction.oncomplete = () => {
      if (hasResult) resolve(result);
      else reject(new Error('Favicon transaction completed without result'));
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// 从 IndexedDB 中获取 favicon（带 TTL 校验）
export function getFavicon(origin: string): Promise<FaviconRecord | null> {
  return withRetry(async () => {
    const db = await getDB();
    const record = await runRequest<FaviconRecord | undefined>(db, 'readonly', store =>
      store.get(origin),
    );
    return record ?? null;
  });
}

// 只取近期出现过失败的站点主键，健康站点无需逐一读取图标记录。
export function getOriginsWithFailedIcons(): Promise<Set<IDBValidKey>> {
  return withRetry(async () => {
    const db = await getDB();
    const origins = await runRequest(db, 'readonly', store =>
      store.index(FAILURE_INDEX).getAllKeys(IDBKeyRange.lowerBound(Date.now(), true)),
    );
    return new Set(origins);
  });
}

// 页面与后台共用此表；合并失败记录和更新图标必须在同一个事务里完成。
function updateRecord(
  origin: string,
  update: (current?: FaviconRecord) => FaviconRecord | undefined,
): Promise<void> {
  return withRetry(async () => {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FAVICON_STORE_NAME, 'readwrite');
      const store = tx.objectStore(FAVICON_STORE_NAME);
      const request = store.get(origin);
      request.onsuccess = () => {
        const next = update(request.result);
        if (next) {
          if (next.failedIcons?.length) {
            next.failedUntil = Math.max(...next.failedIcons.map(([, until]) => until));
          } else {
            delete next.failedUntil;
          }
          store.put(next);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  });
}

export function putFavicon(
  record: FaviconRecord,
  shouldWrite: () => boolean = () => true,
): Promise<void> {
  return updateRecord(record.origin, current => {
    if (!shouldWrite()) return;
    const now = Date.now();
    const failedIcons = current?.failedIcons?.filter(([, until]) => until > now);
    if (record.source === 'default' && current?.url && current.source !== 'default')
      return;
    // 浏览器再次上报仍在冷却期的坏地址时，保留当前记录。
    if (record.source === 'browser' && failedIcons?.some(([url]) => url === record.url))
      return;
    return { ...record, failedIcons };
  });
}

export const FAILED_ICON_TTL = 5 * 60 * 1000;
const MAX_FAILED_ICONS_PER_SITE = 512;

export function invalidateFavicon(
  origin: string,
  failedUrls: readonly string[],
): Promise<void> {
  return updateRecord(origin, current => {
    const now = Date.now();
    const failures = new Map(current?.failedIcons?.filter(([, until]) => until > now));
    for (const url of failedUrls) {
      if (!/^https?:\/\//i.test(url) || url.length > 2048) continue;
      failures.delete(url);
      failures.set(url, now + FAILED_ICON_TTL);
    }
    const failedIcons = [...failures].slice(-MAX_FAILED_ICONS_PER_SITE);
    const valid = current?.url && !failedUrls.includes(current.url);
    if (valid) return { ...current, failedIcons };
    if (!current && !failedIcons.length) return;
    // 回退探测可能还没结束；先保存失败记录，后续 put 在事务中合并。
    return { origin, timestamp: now, url: '', source: 'default', failedIcons };
  });
}

// 删除过期记录
async function deleteExpired(ttl: number): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FAVICON_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(FAVICON_STORE_NAME);
    const request = store
      .index(TIMESTAMP_INDEX)
      .openCursor(IDBKeyRange.upperBound(Date.now() - ttl));

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// 超出上限时按时间从旧到新淘汰
async function trimToMax(max: number): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FAVICON_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(FAVICON_STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      let overflow = countRequest.result - max;
      if (overflow <= 0) return;

      const cursorRequest = store.index(TIMESTAMP_INDEX).openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor || overflow <= 0) return;
        cursor.delete();
        overflow -= 1;
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    };
    countRequest.onerror = () => reject(countRequest.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// 清理过期/超量记录，失败不影响主流程
export async function pruneFavicons({
  ttl,
  max,
}: {
  ttl: number;
  max: number;
}): Promise<void> {
  try {
    await withRetry(() => deleteExpired(ttl));
    await withRetry(() => trimToMax(max));
  } catch {
    // 缓存清理失败忽略
  }
}

export default {
  getFavicon,
  putFavicon,
  invalidateFavicon,
  pruneFavicons,
};
