import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { TagItem } from '~/entrypoints/types';
import Store from '../instanceStore';
import {
  REMOVE_GROUPS_PORT,
  requestTabGroupRemoval,
  type BatchRemovalReply,
} from '../batchRemoval';

const { connect } = vi.hoisted(() => ({ connect: vi.fn() }));
vi.mock('wxt/browser', () => ({
  browser: { extension: { inIncognitoContext: false }, runtime: { connect } },
}));
vi.mock('../instanceStore', () => ({
  default: { tabListUtils: { getTagList: vi.fn() } },
}));

function port(reply?: BatchRemovalReply) {
  let receive: (message: BatchRemovalReply) => void;
  let disconnect: () => void;
  return {
    onMessage: {
      addListener: (listener: typeof receive) => {
        receive = listener;
      },
    },
    onDisconnect: {
      addListener: (listener: typeof disconnect) => {
        disconnect = listener;
      },
    },
    postMessage: vi.fn(() =>
      queueMicrotask(() => (reply ? receive(reply) : disconnect())),
    ),
    disconnect: vi.fn(),
  };
}

function stored(...ids: string[]): TagItem[] {
  return [
    {
      tagId: 'tag',
      tagName: 'Tag',
      createTime: '',
      groupList: ids.map(groupId => ({
        groupId,
        groupName: groupId,
        createTime: '',
        tabList: [],
      })),
    },
  ];
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('navigator', {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('回执丢失时读取已提交的状态，只将仍存在的组发给后台重试', async () => {
  const first = port();
  const retry = port({ removedIds: ['b'] });
  connect.mockReturnValueOnce(first).mockReturnValueOnce(retry);
  vi.mocked(Store.tabListUtils.getTagList)
    .mockResolvedValueOnce(stored('b'))
    .mockResolvedValueOnce(stored());

  await expect(requestTabGroupRemoval(['a', 'b'])).resolves.toEqual(['a', 'b']);
  expect(connect.mock.calls).toEqual([
    [{ name: REMOVE_GROUPS_PORT }],
    [{ name: REMOVE_GROUPS_PORT }],
  ]);
  expect(first.postMessage).toHaveBeenCalledWith(['a', 'b']);
  expect(retry.postMessage).toHaveBeenCalledWith(['b']);
  expect(Store.tabListUtils.getTagList).toHaveBeenCalledTimes(2);
});

it('回执丢失但全部提交时直接返回，不发起重复删除', async () => {
  connect.mockReturnValue(port());
  vi.mocked(Store.tabListUtils.getTagList).mockResolvedValue(stored());

  await expect(requestTabGroupRemoval(['a', 'b'])).resolves.toEqual(['a', 'b']);
  expect(connect).toHaveBeenCalledTimes(1);
});
