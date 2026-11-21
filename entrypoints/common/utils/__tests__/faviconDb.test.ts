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

export default {};
