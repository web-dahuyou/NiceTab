// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import type { TreeProps } from 'antd';
import type { ContextType } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import commonMessages from '~/entrypoints/common/locale/modules/common/enUS';
import type { TagItem } from '~/entrypoints/types';
import { HomeContext } from '../hooks/treeData';
import type { TreeDataNodeUnion } from '../types';
import { getTreeData } from '../utils';
import TreeBox from '../TreeBox';

const { captureTree } = vi.hoisted(() => ({ captureTree: vi.fn() }));
vi.mock('antd', async importOriginal => {
  const actual = await importOriginal<typeof import('antd')>();
  const { forwardRef } = await import('react');
  return {
    ...actual,
    Tree: forwardRef((_props, _ref) => {
      captureTree(_props);
      return null;
    }),
  };
});
vi.mock('../hooks/treeData', async () => {
  const { createContext } = await import('react');
  return { HomeContext: createContext(null) };
});
vi.mock('../components/TreeBatchActions', () => ({
  default: ({ groupIds }: { groupIds: string[] }) => (
    <output aria-label="Selected groups">{groupIds.join(',')}</output>
  ),
}));
vi.mock('../components/RenderTreeNode', () => ({ default: () => null }));
vi.mock('../TreeNodeActionModals', () => ({
  useTreeNodeAction: () => ({}),
  MoveToActionModal: () => null,
  RemoveActionModal: () => null,
  DedupActionModal: () => null,
}));

const group = (groupId: string) => ({
  groupId,
  groupName: groupId,
  createTime: '2024-01-01',
  tabList: [],
});
const tagList: TagItem[] = [
  {
    tagId: 'source',
    tagName: 'Source',
    createTime: '2024-01-01',
    groupList: [group('a'), group('b'), group('unselected')],
  },
  {
    tagId: 'locked',
    tagName: 'Locked',
    createTime: '2024-01-01',
    isLocked: true,
    groupList: [group('blocked')],
  },
  { tagId: 'target', tagName: 'Target', createTime: '2024-01-01', groupList: [] },
];
const data = getTreeData(tagList);
type Tree = TreeProps<TreeDataNodeUnion>;
type Drop = Parameters<NonNullable<Tree['onDrop']>>[0];
type DragStart = Parameters<NonNullable<Tree['onDragStart']>>[0];
const currentTree = (): Tree => captureTree.mock.lastCall?.[0];

function eventNode(node: TreeDataNodeUnion, pos: string): Drop['node'] {
  return {
    ...node,
    pos,
    expanded: false,
    selected: false,
    checked: false,
    loaded: false,
    loading: false,
    halfChecked: false,
    dragOver: false,
    dragOverGapTop: false,
    dragOverGapBottom: false,
    active: false,
  };
}

function renderTreeBox() {
  const handleTreeNodeDrop = vi.fn(async () => ['a', 'b']);
  type Home = ContextType<typeof HomeContext>;
  const treeDataHook: Partial<Home['treeDataHook']> = {
    treeData: data,
    tagList,
    selectedKeys: [],
    handleTreeNodeDrop,
  };
  render(
    <IntlProvider
      locale="en-US"
      messages={{
        ...commonMessages,
        'home.searchTagAndGroup': 'Search',
      }}
    >
      <HomeContext.Provider value={{ treeDataHook } as Home}>
        <TreeBox />
      </HomeContext.Provider>
    </IntlProvider>,
  );
  const onCheck = currentTree().onCheck!;
  const selected = ['a', 'b', 'blocked'];
  act(() => onCheck(selected, {} as Parameters<typeof onCheck>[1]));
  expect(screen.getByLabelText('Selected groups').textContent).toBe(selected.join(','));
  return handleTreeNodeDrop;
}

function startDrag(dragNode: DragStart['node']) {
  const dataTransfer = new DataTransfer();
  dataTransfer.effectAllowed = 'copyMove';
  dataTransfer.dropEffect = 'copy';
  const setDragImage = vi
    .spyOn(dataTransfer, 'setDragImage')
    .mockImplementation(() => {});
  const event = { dataTransfer } as DragStart['event'];
  act(() => currentTree().onDragStart?.({ node: dragNode, event }));
  return { event, dataTransfer, setDragImage };
}

function dropOnTarget(dragNode: Drop['dragNode'], event: Drop['event']) {
  return currentTree().onDrop?.({
    dragNode,
    node: eventNode(data[2], '0-2'),
    event,
    dragNodesKeys: [dragNode.key],
    dropPosition: 2,
    dropToGap: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('拖动已勾选组时显示可移动数量、偏移和移动效果，成功后保留未处理项', async () => {
  const handleDrop = renderTreeBox();
  const dragNode = eventNode(data[0].children![0], '0-0-0');
  const { event, dataTransfer, setDragImage } = startDrag(dragNode);

  expect(dataTransfer.effectAllowed).toBe('move');
  expect(setDragImage).toHaveBeenCalledTimes(1);
  const [preview, hotspotX, hotspotY] = setDragImage.mock.calls[0];
  expect(preview.textContent).toBe('2 Groups Selected');
  const style = getComputedStyle(preview);
  expect([style.borderLeftWidth, style.borderTopWidth]).toEqual(['16px', '8px']);
  expect([hotspotX, hotspotY]).toEqual([0, 0]);
  act(() => currentTree().onDragOver?.({ event, node: eventNode(data[2], '0-2') }));
  expect(dataTransfer.dropEffect).toBe('move');
  expect(
    currentTree().allowDrop?.({ dragNode, dropNode: data[1], dropPosition: 0 }),
  ).toBe(false);

  await act(async () => {
    await dropOnTarget(dragNode, event);
  });
  expect(handleDrop).toHaveBeenCalledWith(
    expect.objectContaining({
      dragNode,
      node: expect.objectContaining({ key: 'target' }),
    }),
    { selectedGroupIds: ['a', 'b'] },
  );
  expect(screen.getByLabelText('Selected groups').textContent).toBe('blocked');
});

it('勾选多组后拖动未勾选组，仍按单组处理', async () => {
  const handleDrop = renderTreeBox();
  handleDrop.mockResolvedValue([]);
  const dragNode = eventNode(data[0].children![2], '0-0-2');
  const { event, setDragImage } = startDrag(dragNode);

  expect(setDragImage).not.toHaveBeenCalled();
  await act(async () => {
    await dropOnTarget(dragNode, event);
  });
  expect(handleDrop).toHaveBeenCalledWith(expect.objectContaining({ dragNode }), {
    selectedGroupIds: [],
  });
  expect(screen.getByLabelText('Selected groups').textContent).toBe('a,b,blocked');
});
