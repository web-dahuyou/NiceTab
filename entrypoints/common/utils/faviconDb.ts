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
}

export const FAVICON_DB_NAME = 'nicetab';
export const FAVICON_DB_VERSION = 1;
export const FAVICON_STORE_NAME = 'favicons';
export const MAX_DATA_URL_LENGTH = 2 * 1024;
const TIMESTAMP_INDEX = 'timestamp';

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
      if (!db.objectStoreNames.contains(FAVICON_STORE_NAME)) {
        const store = db.createObjectStore(FAVICON_STORE_NAME, { keyPath: 'origin' });
        store.createIndex(TIMESTAMP_INDEX, 'timestamp', { unique: false });
      }
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

// 保存单个 favicon（带时间戳），background 和页面都调用这里
export function putFavicon(record: FaviconRecord): Promise<void> {
  return withRetry(async () => {
    const db = await getDB();
    await runRequest(db, 'readwrite', store => store.put(record));
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
  pruneFavicons,
};
