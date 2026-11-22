import { afterEach, expect, it, vi } from 'vitest';
import type { FaviconRecord } from '../faviconDb';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('浏览器再次上报空占位记录中的失败 URL 时，到冷却期结束才写入', async () => {
  const origin = 'https://site.test';
  const url = origin + '/broken.png';
  const expiresAt = 1_800_000_000_000;
  const placeholder: FaviconRecord = {
    origin,
    url: '',
    source: 'default',
    timestamp: expiresAt - 1000,
    failedIcons: [[url, expiresAt]],
    failedUntil: expiresAt,
  };
  const put = vi.fn();
  // 模拟 IndexedDB 的请求成功和事务完成事件，让 putFavicon 自行决定是否写入。
  const db = {
    transaction() {
      const request = { result: placeholder, onsuccess: () => {} };
      const tx = {
        objectStore: () => ({ get: () => request, put }),
        oncomplete: () => {},
      };
      queueMicrotask(() => {
        request.onsuccess();
        tx.oncomplete();
      });
      return tx;
    },
  };
  vi.stubGlobal('indexedDB', {
    open() {
      const request = { result: db, onsuccess: () => {} };
      queueMicrotask(() => request.onsuccess());
      return request;
    },
  });

  const { putFavicon } = await import('../faviconDb');
  const now = vi.spyOn(Date, 'now').mockReturnValue(expiresAt - 1);
  const report = { origin, url, source: 'browser' } as const;
  await putFavicon({ ...report, timestamp: Date.now() });
  expect(put).not.toHaveBeenCalled();

  now.mockReturnValue(expiresAt);
  await putFavicon({ ...report, timestamp: Date.now() });
  expect(put).toHaveBeenCalledTimes(1);
  expect(put).toHaveBeenCalledWith({
    ...report,
    timestamp: expiresAt,
    failedIcons: [],
  });
});

it('清理过期缓存和超量记录时，较新的失败占位记录仍可用于冷却', async () => {
  const now = 1_800_000_000_000;
  vi.spyOn(Date, 'now').mockReturnValue(now);
  const recentFailure: FaviconRecord = {
    origin: 'https://failed.test',
    url: '',
    source: 'default',
    timestamp: now - 1000,
    failedUntil: now + 1000,
    failedIcons: [['https://failed.test/icon.png', now + 1000]],
  };
  const expired: FaviconRecord = {
    origin: 'https://expired.test',
    url: 'https://expired.test/icon.png',
    source: 'browser',
    timestamp: now - 10000,
  };
  const older: FaviconRecord = {
    origin: 'https://older.test',
    url: 'https://older.test/icon.png',
    source: 'browser',
    timestamp: now - 3000,
  };
  const records = new Set([expired, older, recentFailure]);
  vi.stubGlobal('IDBKeyRange', { upperBound: (upper: number) => ({ upper }) });
  vi.stubGlobal('indexedDB', {
    open() {
      const request = {
        onsuccess: () => {},
        result: {
          transaction() {
            const tx = {
              oncomplete: () => {},
              objectStore: () => ({
                count() {
                  const count = { result: records.size, onsuccess: () => {} };
                  queueMicrotask(() => {
                    count.onsuccess();
                    queueMicrotask(() => tx.oncomplete());
                  });
                  return count;
                },
                index: () => ({
                  openCursor(range?: { upper: number }) {
                    const candidates = [...records].filter(
                      record => !range || record.timestamp <= range.upper,
                    );
                    const read = {
                      result: null as { delete: () => void; continue: () => void } | null,
                      onsuccess: () => {},
                    };
                    function emit() {
                      const record = candidates.shift();
                      read.result = record
                        ? {
                            delete: () => {
                              records.delete(record);
                            },
                            continue: () => queueMicrotask(emit),
                          }
                        : null;
                      read.onsuccess();
                      if (range && !record) tx.oncomplete();
                    }
                    queueMicrotask(emit);
                    return read;
                  },
                }),
              }),
            };
            return tx;
          },
        },
      };
      queueMicrotask(() => request.onsuccess());
      return request;
    },
  });

  const { pruneFavicons } = await import('../faviconDb');
  await pruneFavicons({ ttl: 5000, max: 1 });
  expect([...records]).toEqual([recentFailure]);
});

export default {};
