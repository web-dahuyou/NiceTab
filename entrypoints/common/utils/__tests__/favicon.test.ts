import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RuntimeMessageEventProps } from '~/entrypoints/types';
import {
  FAILED_ICON_TTL,
  getFavicon,
  getOriginsWithFailedIcons,
  invalidateFavicon,
  putFavicon,
} from '../faviconDb';
import {
  getFaviconUrl,
  getGstaticURL,
  getInitialFaviconUrl,
  onFaviconFailuresChanged,
} from '../favicon';

vi.mock('../faviconDb', async importOriginal => ({
  ...(await importOriginal<typeof import('../faviconDb')>()),
  getFavicon: vi.fn(),
  getOriginsWithFailedIcons: vi.fn(
    async () =>
      new Set([
        'https://mixed.test',
        'https://placeholder.test',
        'https://expired.test',
        'https://default.test',
        'https://legacy.test',
      ]),
  ),
  invalidateFavicon: vi.fn(),
  putFavicon: vi.fn(),
  pruneFavicons: vi.fn(),
}));

function record(origin: string, url = origin + '/icon.png') {
  return { origin, url, source: 'browser' as const, timestamp: Date.now() };
}

function gate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
}

function stubImages(load: (url: string) => Promise<boolean>) {
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 32;
      naturalHeight = 32;
      onload?: () => void;
      onerror?: () => void;
      set src(url: string) {
        void load(url).then(valid => (valid ? this.onload?.() : this.onerror?.()));
      }
      removeAttribute() {}
    },
  );
}

describe('并发获取 favicon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(async () => {
    await vi.runAllTimersAsync();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('读取缓存期间另一个组件报告不同的失败 URL，两个组件都能继续回退', async () => {
    const origin = 'https://overlap.test';
    const failed = origin + '/broken.png';
    const started = gate();
    const resume = gate();
    vi.mocked(getFavicon)
      .mockResolvedValue(record(origin, failed))
      .mockImplementationOnce(async () => {
        started.release();
        await resume.promise;
        return record(origin, failed);
      });
    // 扩展图标校准失败，下一来源 gstatic 可以加载。
    stubImages(async url => url.startsWith('https://t3.gstatic.com/'));
    const first = getFaviconUrl(origin, 32, [failed]);
    await started.promise;
    const second = getFaviconUrl(origin, 32, [origin + '/other.png']);
    resume.release();
    expect(await Promise.all([first, second])).toEqual(
      Array(2).fill(getGstaticURL(origin)),
    );
  });

  it('图片探测尚未结束时收到失败报告，跳过该候选并缓存下一来源', async () => {
    const origin = 'https://decoding.test';
    const probing = gate();
    const resume = gate();
    const rejected = getGstaticURL(origin);
    const fallback = 'https://icons.duckduckgo.com/ip3/decoding.test.ico';
    vi.mocked(getFavicon).mockResolvedValue(null);
    stubImages(async url => {
      if (url === rejected) {
        probing.release();
        await resume.promise;
        return true;
      }
      return url === fallback;
    });
    const first = getFaviconUrl(origin);
    await probing.promise;
    const second = getFaviconUrl(origin, 32, [rejected]);
    resume.release();
    expect(await Promise.all([first, second])).toEqual([fallback, fallback]);
    expect(await getFaviconUrl(origin)).toBe(fallback);
  });

  it('单个组件耗尽重试后，失效事务提交前的普通调用仍会跳过坏缓存', async () => {
    const origin = 'https://limit.test';
    const failures = Array.from({ length: 8 }, (_, i) => origin + '/bad-' + i);
    const commit = gate();
    vi.mocked(invalidateFavicon).mockImplementationOnce(() => commit.promise);
    vi.mocked(getFavicon).mockResolvedValue(record(origin, failures[0]));
    stubImages(async url => url === getGstaticURL(origin));
    try {
      expect(await getFaviconUrl(origin, 32, failures)).toBe(
        browser.runtime.getURL('/icon/favicon-default.png'),
      );
      await vi.advanceTimersByTimeAsync(50);
      expect(await getFaviconUrl(origin)).toBe(getGstaticURL(origin));
    } finally {
      commit.release();
    }
  });

  it('2001 个站点并发读取有效缓存时，每个调用都返回本站图标', async () => {
    const origins = Array.from({ length: 2001 }, (_, i) => `https://site-${i}.test`);
    vi.mocked(getFavicon).mockImplementation(async origin => record(origin));
    const urls = await Promise.all(origins.map(origin => getFaviconUrl(origin)));
    expect(urls.filter((url, i) => url !== record(origins[i]).url)).toEqual([]);
  });

  it('同站同尺寸的冷启动请求共享一次探测，随后直接命中内存', async () => {
    const origin = 'https://cold-site.test';
    const expected = getGstaticURL(origin);
    const probe = vi.fn(async (url: string) => url === expected);
    vi.mocked(getFavicon).mockResolvedValue(null);
    stubImages(probe);

    expect(
      await Promise.all([
        getFaviconUrl(origin + '/first'),
        getFaviconUrl(origin + '/second'),
        getFaviconUrl(origin + '/third'),
      ]),
    ).toEqual([expected, expected, expected]);
    expect(await getFaviconUrl(origin + '/later')).toBe(expected);
    expect(getFavicon).toHaveBeenCalledTimes(1);
    expect(probe.mock.calls.filter(([url]) => url === expected)).toHaveLength(1);
    expect(putFavicon).toHaveBeenCalledTimes(1);
  });

  it('默认图只在短期内复用，过期后重新探测并恢复站点图标', async () => {
    const origin = 'https://expired-default.test';
    const fallback = browser.runtime.getURL('/icon/favicon-default.png');
    vi.mocked(getFavicon).mockResolvedValue({
      ...record(origin, fallback),
      source: 'default',
    });
    const expected = getGstaticURL(origin);
    const probe = vi.fn(async (url: string) => url === expected);
    stubImages(probe);

    expect(await getFaviconUrl(origin)).toBe(fallback);
    expect(probe).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(FAILED_ICON_TTL + 1);
    expect(await getFaviconUrl(origin)).toBe(expected);
    expect(probe).toHaveBeenCalledWith(expected);
  });

  it('240 个健康站点共用一次索引查询，直接展示各自图标', async () => {
    // 模拟一个全新的页面，确保索引查询还没有被前面的用例预热。
    vi.resetModules();
    const freshPage = await import('../favicon');
    const sites = Array.from({ length: 240 }, (_, i) => 'https://healthy-' + i + '.test');
    const expected = sites.map(site => site + '/logo.png');
    expect(
      await Promise.all(
        sites.map((site, i) => freshPage.getInitialFaviconUrl(site, expected[i])),
      ),
    ).toEqual(expected);
    expect(getOriginsWithFailedIcons).toHaveBeenCalledTimes(1);
    expect(getFavicon).not.toHaveBeenCalled();
  });

  it('刷新读取同站点缓存一次，只替换冷却中的精确地址，并允许过期后恢复', async () => {
    const origin = 'https://mixed.test';
    const bad = origin + '/logo?v=1';
    const updated = origin + '/logo?v=2';
    const healthy = origin + '/healthy';
    const fallback = origin + '/fallback';
    vi.mocked(getFavicon).mockResolvedValue({
      ...record(origin, fallback),
      failedIcons: [[bad, Date.now() + 100]],
    });
    expect(
      await Promise.all(
        [bad, updated, healthy].map(url => getInitialFaviconUrl(origin, url)),
      ),
    ).toEqual([fallback, updated, healthy]);
    expect(getFavicon).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(101);
    expect(await getInitialFaviconUrl(origin, bad)).toBe(bad);
  });

  it('首屏遇到空占位记录时跳过冷却中的原图，直接探测替代图', async () => {
    const origin = 'https://placeholder.test';
    const supplied = getGstaticURL(origin);
    const alternate = 'https://icons.duckduckgo.com/ip3/placeholder.test.ico';
    const expiresAt = Date.now() + 100;
    vi.mocked(getFavicon).mockResolvedValue({
      ...record(origin, ''),
      source: 'default',
      failedUntil: expiresAt,
      failedIcons: [[supplied, expiresAt]],
    });
    const load = vi.fn(async (url: string) => url === supplied || url === alternate);
    stubImages(load);

    const updated = origin + '/new.png';
    expect(await getInitialFaviconUrl(origin, updated)).toBe(updated);
    expect(await getInitialFaviconUrl(origin, supplied)).toBe(alternate);
    expect(load).not.toHaveBeenCalledWith(supplied);
    expect(load).toHaveBeenCalledWith(alternate);

    await vi.advanceTimersByTimeAsync(100);
    expect(invalidateFavicon).not.toHaveBeenCalled();
    expect(await getInitialFaviconUrl(origin, supplied)).toBe(supplied);
  });

  it('过期回退、默认图和旧版记录均保留传入图标', async () => {
    for (const kind of ['expired', 'default', 'legacy']) {
      const origin = 'https://' + kind + '.test';
      const original = origin + '/original';
      vi.mocked(getFavicon).mockResolvedValue({
        ...record(origin),
        source: kind === 'default' ? 'default' : 'browser',
        failedIcons: kind === 'legacy' ? undefined : [[original, Date.now() + 1000]],
        timestamp: kind === 'expired' ? Date.now() - 8 * 86400000 : Date.now(),
      });
      expect(await getInitialFaviconUrl(origin, original)).toBe(original);
    }
  });

  it('其他管理页收到失败通知后，首屏和无传入图标的探测都跳过冷却地址', async () => {
    vi.resetModules();
    const otherPage = await import('../favicon');
    const origin = 'https://other-page.test';
    const bad = getGstaticURL(origin);
    const fallback = 'https://icons.duckduckgo.com/ip3/other-page.test.ico';
    const updated = origin + '/new.png';
    vi.mocked(getFavicon).mockResolvedValue(record(origin, bad));
    expect(await otherPage.getInitialFaviconUrl(origin, bad)).toBe(bad);
    expect(await otherPage.getFaviconUrl(origin)).toBe(bad);

    const commit = gate();
    vi.mocked(invalidateFavicon).mockImplementationOnce(async () => {
      await commit.promise;
      vi.mocked(getFavicon).mockResolvedValue({
        ...record(origin, ''),
        source: 'default',
        failedIcons: [[bad, Date.now() + 1000]],
      });
    });
    const send = vi
      .spyOn(browser.runtime, 'sendMessage')
      .mockImplementation(async msg => {
        const event = msg as RuntimeMessageEventProps;
        if (event.msgType === 'faviconFailuresChanged')
          otherPage.onFaviconFailuresChanged(event.data.origin);
      });
    const load = vi.fn(async (url: string) => url === bad || url === fallback);
    stubImages(load);
    try {
      await getFaviconUrl(origin, 32, [bad]);
      await vi.advanceTimersByTimeAsync(50);
      expect(send).not.toHaveBeenCalled();
      commit.release();
      await vi.advanceTimersByTimeAsync(0);
      expect(send).toHaveBeenCalledWith({
        msgType: 'faviconFailuresChanged',
        data: { origin },
      });
      load.mockClear();
      expect(await otherPage.getFaviconUrl(origin)).toBe(fallback);
      expect(load).not.toHaveBeenCalledWith(bad);
      expect(await otherPage.getInitialFaviconUrl(origin, bad)).toBe(fallback);
      expect(await otherPage.getInitialFaviconUrl(origin, updated)).toBe(updated);
      expect(invalidateFavicon).toHaveBeenCalledTimes(1);
      await otherPage.getFaviconUrl(origin, 32, [bad, fallback], bad);
      await vi.advanceTimersByTimeAsync(50);
      expect(invalidateFavicon).toHaveBeenCalledTimes(2);
      expect(invalidateFavicon).toHaveBeenLastCalledWith(origin, [fallback]);
      await vi.advanceTimersByTimeAsync(1000);
      expect(await otherPage.getInitialFaviconUrl(origin, bad)).toBe(bad);
    } finally {
      commit.release();
      send.mockRestore();
    }
  });

  it('通知后的同一次加载只读一次记录，按来源 TTL 决定复用或探测', async () => {
    const now = Date.now();
    for (const expired of [false, true]) {
      const origin = expired
        ? 'https://expired-remote.test'
        : 'https://fresh-remote.test';
      const bad = origin + '/broken.png';
      const cached = origin + '/cached.png';
      const probed = getGstaticURL(origin);
      vi.mocked(getFavicon)
        .mockClear()
        .mockResolvedValue({
          ...record(origin, cached),
          source: 'default',
          timestamp: expired ? now - 5 * 60_000 - 1 : now,
          failedIcons: [[bad, now + 60_000]],
        });
      stubImages(async url => url === probed);
      onFaviconFailuresChanged(origin);
      expect(await getInitialFaviconUrl(origin, bad)).toBe(expired ? probed : cached);
      expect(getFavicon).toHaveBeenCalledTimes(1);
    }
    // 两次独立加载之间后台可能更新替代图；冷却信息仍有效，图标要读取新值。
    const origin = 'https://updated-remote.test';
    const supplied = origin + '/page-icon.png';
    const updated = origin + '/updated.png';
    vi.mocked(getFavicon)
      .mockClear()
      .mockResolvedValueOnce(record(origin, origin + '/old.png'))
      .mockResolvedValueOnce(record(origin, updated));
    onFaviconFailuresChanged(origin);
    expect(await getInitialFaviconUrl(origin, supplied)).toBe(supplied);
    expect(await getFaviconUrl(origin)).toBe(updated);
    expect(getFavicon).toHaveBeenCalledTimes(2);
  });

  it('跨事件报告失败立即返回有效缓存，持续的报告按固定窗口提交', async () => {
    const origin = 'https://staggered.test';
    const cached = record(origin);
    vi.mocked(getFavicon).mockResolvedValue(cached);
    for (const id of [1, 2, 3]) {
      expect(await getFaviconUrl(origin, 32, [origin + '/' + id])).toBe(cached.url);
      await vi.advanceTimersByTimeAsync(20);
    }
    expect(vi.mocked(invalidateFavicon).mock.calls).toEqual([
      [origin, [origin + '/1', origin + '/2', origin + '/3']],
    ]);
    await getFaviconUrl(origin, 32, [origin + '/4']);
    await vi.advanceTimersByTimeAsync(50);
    expect(invalidateFavicon).toHaveBeenLastCalledWith(origin, [origin + '/4']);
  });

  it('同站点 1000 个不同图标同时失效，只需一轮失效处理和一次缓存读取', async () => {
    const origin = 'https://burst.test';
    const failures = Array.from({ length: 1000 }, (_, i) => origin + '/broken-' + i);
    const cached = record(origin);
    vi.mocked(getFavicon).mockResolvedValue(cached);
    const urls = await Promise.all(
      failures.map(failed => getFaviconUrl(origin, 32, [failed])),
    );
    expect(new Set(urls)).toEqual(new Set([cached.url]));
    expect(getFavicon).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    expect(invalidateFavicon).toHaveBeenCalledTimes(1);
    expect(new Set(vi.mocked(invalidateFavicon).mock.calls[0][1])).toEqual(
      new Set(failures),
    );
  });
});

export default {};
