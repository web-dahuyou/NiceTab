import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initBatchRemoval } from '../batchRemoval';
import { REMOVE_GROUPS_PORT } from '~/entrypoints/common/storage/batchRemoval';

const { onConnect, initIncognitoRemovalStorageListener, setResult } = vi.hoisted(() => ({
  onConnect: vi.fn(),
  initIncognitoRemovalStorageListener: vi.fn(),
  setResult: vi.fn(),
}));
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: { onConnect: { addListener: onConnect } },
  },
}));
vi.mock('~/entrypoints/common/storage', () => ({
  incognitoUtils: { setResult },
  initIncognitoRemovalStorageListener,
}));

function regularRequest(ids: string[]) {
  const addListener = vi.fn();
  const postMessage = vi.fn();
  onConnect.mock.calls[0][0]({
    name: REMOVE_GROUPS_PORT,
    onMessage: { addListener },
    postMessage,
  });
  return addListener.mock.calls[0][0](ids).then(() => postMessage.mock.calls[0][0]);
}

function privateRequest(id: string, ids: string[]) {
  return initIncognitoRemovalStorageListener.mock.calls[0][0](id, ids);
}

describe('后台批量删除队列', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['regular', 'incognito'])('第一批提交后才开始读取 %s 的请求', async mode => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const stored = new Set(['A', 'B']);
    const remove = vi.fn(async (ids: string[]) => {
      const removed = ids.filter(id => stored.has(id));
      if (ids.length === 1) await gate;
      removed.forEach(id => stored.delete(id));
      return removed;
    });
    initBatchRemoval(remove);
    const first = regularRequest(['A']);
    const second =
      mode === 'regular'
        ? regularRequest(['A', 'B'])
        : privateRequest('second', ['A', 'B']);
    await Promise.resolve();
    expect(remove.mock.calls).toEqual([[['A']]]);
    release();
    expect(await first).toEqual({ removedIds: ['A'] });
    const reply = await second;
    if (mode === 'regular') expect(reply).toEqual({ removedIds: ['B'] });
    else
      expect(setResult).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'second', processedIds: ['B'], failed: false }),
      );
    expect(stored.size).toBe(0);
  });

  it('后台修复等到无痕窗口的删除提交后再读取', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const remove = vi.fn(async (ids: string[]) => {
      if (ids.length) await gate;
      return ids;
    });
    const repair = initBatchRemoval(remove);
    const deletion = privateRequest('delete', ['A']);
    const repairing = repair();
    await Promise.resolve();
    expect(remove.mock.calls).toEqual([[['A']]]);
    release();
    await Promise.all([deletion, repairing]);
    expect(remove.mock.calls).toEqual([[['A']], [[]]]);
  });

  it('写入失败后，下一个请求和重试都能执行', async () => {
    const remove = vi
      .fn(async (ids: string[]) => ids)
      .mockRejectedValueOnce(new Error('write failed'));
    initBatchRemoval(remove);
    const first = privateRequest('failure', ['A']);
    const second = regularRequest(['B']);
    await first;
    expect(setResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'failure', processedIds: [], failed: true }),
    );
    expect(await second).toEqual({ removedIds: ['B'] });
    expect(await regularRequest(['A'])).toEqual({ removedIds: ['A'] });
  });
});
