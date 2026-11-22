// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ContextType } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { requestTabGroupRemoval } from '~/entrypoints/common/storage/batchRemoval';
import { settingsUtils } from '~/entrypoints/common/storage';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';
import commonMessages from '~/entrypoints/common/locale/modules/common/enUS';
import homeMessages from '~/entrypoints/common/locale/modules/home/enUS';
import type { TagItem } from '~/entrypoints/types';
import { HomeContext } from '../../hooks/treeData';
import TreeBatchActions from '../TreeBatchActions';

const { getTagList, openSaved } = vi.hoisted(() => ({
  getTagList: vi.fn(),
  openSaved: vi.fn(),
}));
vi.mock('~/entrypoints/common/storage', () => ({
  tabListUtils: { getTagList },
  settingsUtils: { getSettings: vi.fn() },
}));
vi.mock('~/entrypoints/common/storage/batchRemoval', () => ({
  requestTabGroupRemoval: vi.fn(),
}));
vi.mock('~/entrypoints/common/tabs', () => ({ reloadOtherAdminPage: vi.fn() }));
vi.mock('~/entrypoints/common/components/OpenModeMenu', async importOriginal => ({
  ...(await importOriginal<
    typeof import('~/entrypoints/common/components/OpenModeMenu')
  >()),
  useOpenSavedTabs: () => openSaved,
}));
vi.mock('../../hooks/treeData', async () => {
  const { createContext } = await import('react');
  return { HomeContext: createContext(null) };
});
vi.mock('../../MoveToModal', () => ({ default: () => null }));

const group = (groupId: string, isLocked = false) => ({
  groupId,
  groupName: groupId,
  createTime: '2024-01-01',
  isLocked,
  tabList: [{ tabId: groupId, url: `https://${groupId}.test` }],
});
const tags: TagItem[] = [
  {
    tagId: 'source',
    tagName: 'Source',
    createTime: '2024-01-01',
    groupList: [group('a'), group('b'), group('locked-group', true)],
  },
  {
    tagId: 'locked',
    tagName: 'Locked',
    createTime: '2024-01-01',
    isLocked: true,
    groupList: [group('locked-source')],
  },
];

function renderActions() {
  const onSelectAll = vi.fn();
  const onProcessed = vi.fn();
  const onBusyChange = vi.fn();
  const refreshTreeData = vi.fn();
  type Home = ContextType<typeof HomeContext>;
  const treeDataHook: Partial<Home['treeDataHook']> = { tagList: tags, refreshTreeData };
  render(
    <IntlProvider locale="en-US" messages={{ ...commonMessages, ...homeMessages }}>
      <HomeContext.Provider value={{ treeDataHook } as Home}>
        <TreeBatchActions
          groupIds={['a', 'b', 'locked-group', 'locked-source']}
          total={5}
          onSelectAll={onSelectAll}
          onProcessed={onProcessed}
          onBusyChange={onBusyChange}
        />
      </HomeContext.Provider>
    </IntlProvider>,
  );
  return { onSelectAll, onProcessed, onBusyChange, refreshTreeData };
}

beforeEach(() => {
  vi.resetAllMocks();
  getTagList.mockResolvedValue(tags);
  vi.mocked(reloadOtherAdminPage).mockResolvedValue(undefined);
});
afterEach(cleanup);

it('删除时排除锁定项，以实际成功删除的组更新勾选和其他管理窗口', async () => {
  vi.mocked(settingsUtils.getSettings).mockResolvedValue({
    confirmBeforeDeletingGroups: false,
  });
  vi.mocked(requestTabGroupRemoval).mockResolvedValue(['a']);
  const { onSelectAll, onProcessed, onBusyChange, refreshTreeData } = renderActions();

  fireEvent.click(screen.getByRole('checkbox'));
  expect(onSelectAll).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByTitle(commonMessages['common.remove']));

  await waitFor(() => expect(refreshTreeData).toHaveBeenCalledTimes(1));
  expect(requestTabGroupRemoval).toHaveBeenCalledWith(['a', 'b']);
  expect(onProcessed.mock.calls).toEqual([[['a']]]);
  expect(reloadOtherAdminPage).toHaveBeenCalledTimes(1);
  expect(onBusyChange.mock.calls).toEqual([[true], [false]]);
});

it('批量打开部分成功时只尝试移除已打开的组', async () => {
  vi.mocked(settingsUtils.getSettings).mockResolvedValue({ deleteAfterRestore: true });
  openSaved.mockResolvedValue({ processedIds: ['b'], failed: true });
  vi.mocked(requestTabGroupRemoval).mockResolvedValue(['b']);
  const { onProcessed, refreshTreeData } = renderActions();

  fireEvent.click(screen.getByTitle(commonMessages['common.open']));
  fireEvent.click(
    await screen.findByRole('menuitem', {
      name: homeMessages['home.treeNodeBatch.open.incognito'],
    }),
  );

  await waitFor(() => expect(refreshTreeData).toHaveBeenCalledTimes(1));
  expect(openSaved).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ id: 'a', urls: ['https://a.test'] }),
      expect.objectContaining({ id: 'b', urls: ['https://b.test'] }),
    ]),
    'incognito',
  );
  expect(requestTabGroupRemoval).toHaveBeenCalledWith(['b']);
  expect(onProcessed.mock.calls).toEqual([[['b']]]);
});
