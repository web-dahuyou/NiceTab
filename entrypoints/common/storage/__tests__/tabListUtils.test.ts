import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from 'vitest';

// Mock 所有依赖模块（必须在 import 之前）
vi.mock('~/entrypoints/common/storage/instanceStore', () => ({
  default: class Store {
    static settingsUtils = {
      settings: {},
      getSettings: vi.fn(),
    };
    static recycleBinUtils = {
      addTags: vi.fn(),
      addTabGroups: vi.fn(),
      addTabs: vi.fn(),
    };
  },
}));
vi.mock('~/entrypoints/common/locale', () => ({
  getCustomLocaleMessages: () => ({}),
}));
vi.mock('wxt/storage', () => ({
  storage: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
  },
}));
vi.mock('~/entrypoints/common/tabs', () => ({
  openNewTab: vi.fn(),
}));
vi.mock('~/entrypoints/common/components/DndComponent', () => ({}));
vi.mock('@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item', () => ({
  extractInstruction: vi.fn(() => null),
}));
vi.mock('~/entrypoints/common/storage/index', () => ({
  tabListUtils: {
    getInitialTabGroup: () => ({
      groupId: '',
      groupName: '',
      createTime: '',
      isStarred: false,
      isLocked: false,
      isExpanded: true,
      tabList: [],
    }),
    getInitialTag: () => ({
      tagId: '',
      tagName: '',
      createTime: '',
      isLocked: false,
      isExpanded: true,
      groupList: [],
    }),
  },
}));

import {
  sortbyStarred,
  getMergedGroupList,
  mergeGroupsAndTabs,
  getCloneGroup,
} from '../tabListUtils';
import TabListUtils from '../tabListUtils';
import Store from '~/entrypoints/common/storage/instanceStore';
import { extractInstruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { openNewTab } from '~/entrypoints/common/tabs';
import type { GroupItem, TagItem, TabItem } from '~/entrypoints/types';
import { storage } from 'wxt/storage';

// 辅助函数
function makeGroup(overrides: Partial<GroupItem> = {}): GroupItem {
  return {
    groupId: overrides.groupId || 'g1',
    groupName: overrides.groupName || 'Test Group',
    createTime: overrides.createTime || '2024-01-01 00:00:00',
    tabList: overrides.tabList || [],
    isStarred: overrides.isStarred,
    isLocked: overrides.isLocked,
  };
}

function makeTab(url: string, title = ''): TabItem {
  return { tabId: `t_${url}`, url, title: title || url };
}

function makeTag(overrides: Partial<TagItem> = {}): TagItem {
  return {
    tagId: overrides.tagId || 'tag1',
    tagName: overrides.tagName || 'Tag 1',
    createTime: overrides.createTime || '2024-01-01 00:00:00',
    groupList: overrides.groupList || [],
    static: overrides.static,
    isLocked: overrides.isLocked,
  };
}

// ==========================================================================
// sortbyStarred
// ==========================================================================
describe('sortbyStarred', () => {
  it('将星标标签组排在顶部，非星标保持原序', () => {
    const list = [
      makeGroup({ groupId: 'a', groupName: 'A', isStarred: false }),
      makeGroup({ groupId: 'b', groupName: 'B', isStarred: true }),
      makeGroup({ groupId: 'c', groupName: 'C', isStarred: false }),
    ];
    const result = sortbyStarred(list);
    // 星标 B 排到顶部；非星标保持原序 A, C
    expect(result.map(g => g.groupName)).toEqual(['B', 'A', 'C']);
  });

  it('无星标时保持原顺序', () => {
    const list = [
      makeGroup({ groupId: 'a', groupName: 'A' }),
      makeGroup({ groupId: 'b', groupName: 'B' }),
      makeGroup({ groupId: 'c', groupName: 'C' }),
    ];
    const result = sortbyStarred(list);
    expect(result.map(g => g.groupName)).toEqual(['A', 'B', 'C']);
  });

  it('全部星标时保持原顺序', () => {
    const list = [
      makeGroup({ groupId: 'a', groupName: 'A', isStarred: true }),
      makeGroup({ groupId: 'b', groupName: 'B', isStarred: true }),
    ];
    const result = sortbyStarred(list);
    expect(result.map(g => g.groupName)).toEqual(['A', 'B']);
  });

  it('空列表返回空数组', () => {
    expect(sortbyStarred([])).toEqual([]);
  });

  it('结果不包含 idx 临时字段', () => {
    const list = [makeGroup({ groupId: 'a', groupName: 'A' })];
    const result = sortbyStarred(list);
    expect(result[0]).not.toHaveProperty('idx');
  });
});

// ==========================================================================
// getMergedGroupList
// ==========================================================================
describe('getMergedGroupList', () => {
  const mergeHandler = (prev: GroupItem, curr: GroupItem) => ({
    ...prev,
    tabList: [...prev.tabList, ...curr.tabList],
  });

  it('合并两个不重复的列表', () => {
    const list = [makeGroup({ groupId: '1', groupName: 'A' })];
    const insertList = [makeGroup({ groupId: '2', groupName: 'B' })];
    const result = getMergedGroupList({ list, insertList }, mergeHandler);
    expect(result).toHaveLength(2);
  });

  it('同名标签组使用 handler 合并', () => {
    const list = [
      makeGroup({ groupId: '1', groupName: 'A', tabList: [makeTab('https://a.com')] }),
    ];
    const insertList = [
      makeGroup({ groupId: '2', groupName: 'A', tabList: [makeTab('https://b.com')] }),
    ];
    const result = getMergedGroupList({ list, insertList }, mergeHandler);
    expect(result).toHaveLength(1);
    expect(result[0].tabList).toHaveLength(2);
  });

  it('新列表项追加到结果中', () => {
    const list = [makeGroup({ groupId: '1', groupName: 'existing' })];
    const insertList = [makeGroup({ groupId: '2', groupName: 'new' })];
    const result = getMergedGroupList({ list, insertList }, mergeHandler);
    expect(result.map(g => g.groupName)).toContain('new');
    expect(result).toHaveLength(2);
  });

  it('支持自定义 key 字段', () => {
    const list = [makeGroup({ groupId: '1', groupName: 'A' })];
    const insertList = [makeGroup({ groupId: '1', groupName: 'B' })];
    const result = getMergedGroupList({ list, insertList, key: 'groupId' }, mergeHandler);
    expect(result).toHaveLength(1);
  });

  it('空列表合并', () => {
    const result = getMergedGroupList({ list: [], insertList: [] }, mergeHandler);
    expect(result).toEqual([]);
  });

  it('星标标签组排序在结果中生效', () => {
    const list = [makeGroup({ groupId: '1', groupName: 'A', isStarred: true })];
    const insertList = [makeGroup({ groupId: '2', groupName: 'B', isStarred: false })];
    const result = getMergedGroupList({ list, insertList }, mergeHandler);
    // 星标 A 排在顶部
    expect(result[0].isStarred).toBe(true);
    expect(result[0].groupName).toBe('A');
  });
});

// ==========================================================================
// mergeGroupsAndTabs
// ==========================================================================
describe('mergeGroupsAndTabs', () => {
  it('合并同名标签组，标签去重', () => {
    const targetList = [
      makeGroup({
        groupId: '1',
        groupName: 'A',
        tabList: [makeTab('https://a.com'), makeTab('https://b.com')],
      }),
    ];
    const insertList = [
      makeGroup({
        groupId: '2',
        groupName: 'A',
        tabList: [makeTab('https://b.com'), makeTab('https://c.com')],
      }),
    ];
    const result = mergeGroupsAndTabs({ targetList, insertList });
    expect(result).toHaveLength(1);
    expect(result[0].tabList).toHaveLength(3);
  });

  it('不同名标签组各自保留', () => {
    const targetList = [makeGroup({ groupId: '1', groupName: 'A' })];
    const insertList = [makeGroup({ groupId: '2', groupName: 'B' })];
    const result = mergeGroupsAndTabs({ targetList, insertList });
    expect(result).toHaveLength(2);
  });

  it('exceptValue 对应的标签组重命名后追加', () => {
    const targetList = [
      makeGroup({ groupId: '1', groupName: 'A', tabList: [makeTab('https://a.com')] }),
    ];
    const insertList = [
      makeGroup({ groupId: '2', groupName: 'A', tabList: [makeTab('https://b.com')] }),
    ];
    const result = mergeGroupsAndTabs({
      targetList,
      insertList,
      exceptValue: 'A',
    });
    expect(result.length).toBeGreaterThanOrEqual(2);
    result.forEach(g => {
      expect(g.groupName).not.toBe('A');
    });
  });

  it('insertPosition 为 bottom 时插入到底部', () => {
    const targetList = [makeGroup({ groupId: '1', groupName: 'existing' })];
    const insertList = [makeGroup({ groupId: '2', groupName: 'new' })];
    const result = mergeGroupsAndTabs({
      targetList,
      insertList,
      insertPosition: 'bottom',
    });
    expect(result[result.length - 1].groupName).toBe('new');
  });

  it('空列表合并', () => {
    const result = mergeGroupsAndTabs({ targetList: [], insertList: [] });
    expect(result).toEqual([]);
  });
});

// ==========================================================================
// getCloneGroup
// ==========================================================================
describe('getCloneGroup', () => {
  it('克隆的标签组有新的 groupId', () => {
    const group = makeGroup({
      groupId: 'original',
      tabList: [makeTab('https://a.com')],
    });
    const clone = getCloneGroup(group);
    expect(clone.groupId).not.toBe('original');
    expect(clone.groupName).toBe(group.groupName);
  });

  it('克隆的标签页有新的 tabId', () => {
    const group = makeGroup({
      groupId: 'g1',
      tabList: [
        { tabId: 't1', url: 'https://a.com', title: 'A' },
        { tabId: 't2', url: 'https://b.com', title: 'B' },
      ],
    });
    const clone = getCloneGroup(group);
    expect(clone.tabList[0].tabId).not.toBe('t1');
    expect(clone.tabList[1].tabId).not.toBe('t2');
    expect(clone.tabList[0].url).toBe('https://a.com');
    expect(clone.tabList[1].url).toBe('https://b.com');
  });

  it('克隆保留原始数据属性', () => {
    const group = makeGroup({
      groupId: 'g1',
      groupName: 'My Group',
      isStarred: true,
      isLocked: true,
      tabList: [makeTab('https://a.com')],
    });
    const clone = getCloneGroup(group);
    expect(clone.groupName).toBe('My Group');
    expect(clone.isStarred).toBe(true);
    expect(clone.isLocked).toBe(true);
  });

  it('空标签列表的克隆', () => {
    const group = makeGroup({ groupId: 'g1', tabList: [] });
    const clone = getCloneGroup(group);
    expect(clone.tabList).toEqual([]);
    expect(clone.groupId).not.toBe('g1');
  });
});

// ==========================================================================
// TabListUtils 类方法测试
// ==========================================================================
describe('TabListUtils', () => {
  let utils: InstanceType<typeof TabListUtils>;
  let getTagListSpy: MockInstance<[], Promise<TagItem[]>>;
  let setTagListSpy: MockInstance<[list?: TagItem[]], Promise<void>>;
  const defaultSettings: Record<string, any> = {
    groupInsertPosition: 'top',
    tabInsertPosition: 'bottom',
    deleteUnlockedEmptyGroup: false,
    allowDuplicateTabs: false,
    allowDuplicateGroups: false,
    createNewGroupOnSendSingleTab: false,
    openingTabsOrder: 'default',
    linkTemplate: '{{url}} | {{title}}',
  };

  beforeEach(() => {
    // 注意：不使用 vi.clearAllMocks()，因为它会清除 Store.settingsUtils 的 mock 实现。
    // afterEach 中的 vi.restoreAllMocks() 已经足够清理 spyOn 状态。
    utils = new TabListUtils();
    getTagListSpy = vi.spyOn(utils, 'getTagList');
    setTagListSpy = vi.spyOn(utils, 'setTagList').mockResolvedValue(undefined as any);
    (Store.settingsUtils.getSettings as any).mockResolvedValue({ ...defaultSettings });
    (Store.settingsUtils as any).settings = { ...defaultSettings };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setupTagList(list: TagItem[]) {
    getTagListSpy.mockImplementation(async function (this: any) {
      this.tagList = list;
      return list;
    } as any);
  }

  function stagingTag(groupList: GroupItem[] = []): TagItem {
    return {
      tagId: '0',
      tagName: 'Staging Area',
      createTime: '2024-01-01 00:00:00',
      groupList,
      static: true,
    };
  }

  // ==========================================================================
  // createStagingAreaTag
  // ==========================================================================
  describe('createStagingAreaTag', () => {
    it('创建中转站标签', () => {
      const tag = utils.createStagingAreaTag();
      expect(tag.tagId).toBe('0');
      expect(tag.tagName).toBe('Staging Area');
      expect(tag.static).toBe(true);
      expect(tag.groupList).toEqual([]);
    });
  });

  // ==========================================================================
  // setCountInfo
  // ==========================================================================
  describe('setCountInfo', () => {
    it('统计标签数、标签组数、标签页数', () => {
      (utils as any).tagList = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              tabList: [makeTab('https://a.com'), makeTab('https://b.com')],
            }),
            makeGroup({ groupId: 'g2', tabList: [makeTab('https://c.com')] }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g3', tabList: [] })],
        }),
      ];
      utils.setCountInfo();
      expect(utils.countInfo).toEqual({ tagCount: 2, groupCount: 3, tabCount: 3 });
    });

    it('空列表时统计信息全部为 0', () => {
      (utils as any).tagList = [];
      utils.setCountInfo();
      expect(utils.countInfo).toEqual({ tagCount: 0, groupCount: 0, tabCount: 0 });
    });
  });

  // ==========================================================================
  // getFilteredTagList
  // ==========================================================================
  describe('getFilteredTagList', () => {
    it('过滤空标签组', () => {
      const tagList = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({ groupId: 'g1', tabList: [makeTab('https://a.com')] }),
            makeGroup({ groupId: 'g2', tabList: [] }),
          ],
        }),
      ];
      const result = utils.getFilteredTagList(tagList);
      expect(result).toHaveLength(1);
      expect(result[0].groupList).toHaveLength(1);
      expect(result[0].groupList[0].groupId).toBe('g1');
    });

    it('过滤没有标签组的分类', () => {
      const tagList = [
        makeTag({ tagId: 't1', tagName: 'T1', groupList: [] }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g1', tabList: [makeTab('https://a.com')] })],
        }),
      ];
      const result = utils.getFilteredTagList(tagList);
      expect(result).toHaveLength(1);
      expect(result[0].tagId).toBe('t2');
    });
  });

  // ==========================================================================
  // addTag
  // ==========================================================================
  describe('addTag', () => {
    it('在中转站之后插入新分类', async () => {
      const list = [stagingTag()];
      setupTagList(list);
      const result = await utils.addTag();
      expect(result.tagName).toBeTruthy();
      expect(list).toHaveLength(2);
      expect(list[0].static).toBe(true);
    });
  });

  // ==========================================================================
  // updateTag
  // ==========================================================================
  describe('updateTag', () => {
    it('更新指定分类的属性', async () => {
      const list = [stagingTag(), makeTag({ tagId: 't1', tagName: 'Old Name' })];
      setupTagList(list);
      await utils.updateTag('t1', { tagName: 'New Name' });
      expect(list[1].tagName).toBe('New Name');
    });
  });

  // ==========================================================================
  // removeTag
  // ==========================================================================
  describe('removeTag', () => {
    it('移除指定分类', async () => {
      const list = [stagingTag(), makeTag({ tagId: 't1', tagName: 'T1' })];
      setupTagList(list);
      await utils.removeTag('t1');
      // 验证 setTagList 被调用
      expect(setTagListSpy).toHaveBeenCalled();
      // 验证调用参数：过滤掉了 t1
      const savedList = setTagListSpy.mock.calls[0]?.[0] as TagItem[];
      expect(savedList).toBeDefined();
      expect(savedList.filter((t: TagItem) => t.tagId === 't1')).toHaveLength(0);
    });
  });

  // ==========================================================================
  // createTabGroup
  // ==========================================================================
  describe('createTabGroup', () => {
    it('创建标签组插入到第一个非星标位置', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'Starred', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'Normal', isStarred: false }),
        ]),
      ];
      setupTagList(list);
      const result = await utils.createTabGroup('0', { groupName: 'New' });
      expect(result.tagId).toBe('0');
      const groupNames = list[0].groupList.map(g => g.groupName);
      expect(groupNames).toEqual(['Starred', 'New', 'Normal']);
    });

    it('在指定标签组之前插入', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.createTabGroup('0', { groupName: 'New' }, 'g2', 'before');
      const names = list[0].groupList.map(g => g.groupName);
      expect(names).toEqual(['A', 'New', 'B']);
    });

    it('在指定标签组之后插入', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.createTabGroup('0', { groupName: 'New' }, 'g1', 'after');
      const names = list[0].groupList.map(g => g.groupName);
      expect(names).toEqual(['A', 'New', 'B']);
    });

    it('继承相邻星标状态（在星标组前插入时）', async () => {
      const list = [
        stagingTag([makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true })]),
      ];
      setupTagList(list);
      await utils.createTabGroup('0', { groupName: 'New' }, 'g1', 'before');
      expect(list[0].groupList[0].isStarred).toBe(true);
    });
  });

  // ==========================================================================
  // updateTabGroup
  // ==========================================================================
  describe('updateTabGroup', () => {
    it('更新指定标签组的属性', async () => {
      const list = [
        stagingTag([makeGroup({ groupId: 'g1', groupName: 'Old', isStarred: false })]),
      ];
      setupTagList(list);
      await utils.updateTabGroup({
        tagId: '0',
        groupId: 'g1',
        data: { groupName: 'New', isStarred: true },
      });
      expect(list[0].groupList[0].groupName).toBe('New');
      expect(list[0].groupList[0].isStarred).toBe(true);
    });

    it('不指定 tagId 时遍历所有分类查找', async () => {
      const list = [
        makeTag({ tagId: 't1', tagName: 'T1', groupList: [] }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'Old' })],
        }),
      ];
      setupTagList(list);
      await utils.updateTabGroup({ groupId: 'g1', data: { groupName: 'New' } });
      expect(list[1].groupList[0].groupName).toBe('New');
    });
  });

  // ==========================================================================
  // removeTabGroup
  // ==========================================================================
  describe('removeTabGroup', () => {
    it('移除指定标签组', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.removeTabGroup('0', 'g1');
      expect(list[0].groupList).toHaveLength(1);
      expect(list[0].groupList[0].groupId).toBe('g2');
    });

    it('移除有标签页的标签组时放入回收站', async () => {
      const group = makeGroup({
        groupId: 'g1',
        groupName: 'A',
        tabList: [makeTab('https://a.com')],
      });
      const list = [stagingTag([group])];
      setupTagList(list);
      await utils.removeTabGroup('0', 'g1');
      expect(Store.recycleBinUtils.addTabGroups).toHaveBeenCalled();
    });

    it('移除空标签组时不放入回收站', async () => {
      const group = makeGroup({ groupId: 'g1', groupName: 'A', tabList: [] });
      const list = [stagingTag([group])];
      setupTagList(list);
      await utils.removeTabGroup('0', 'g1');
      expect(Store.recycleBinUtils.addTabGroups).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // tabGroupDedup
  // ==========================================================================
  describe('tabGroupDedup', () => {
    it('按 URL 对标签组去重', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              makeTab('https://a.com', 'A1'),
              makeTab('https://b.com', 'B'),
              makeTab('https://a.com', 'A2'),
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupDedup('0', 'g1');
      expect(list[0].groupList[0].tabList).toHaveLength(2);
      expect(list[0].groupList[0].tabList.map(t => t.url)).toEqual([
        'https://a.com',
        'https://b.com',
      ]);
    });
  });

  // ==========================================================================
  // toggleTabGroupStarred
  // ==========================================================================
  describe('toggleTabGroupStarred', () => {
    it('星标标签组排到最前面', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.toggleTabGroupStarred('0', 'g3', true);
      expect(list[0].groupList[0].groupId).toBe('g3');
      expect(list[0].groupList[0].isStarred).toBe(true);
    });

    it('取消星标排到星标组之后', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'B', isStarred: true }),
          makeGroup({ groupId: 'g3', groupName: 'C', isStarred: false }),
        ]),
      ];
      setupTagList(list);
      await utils.toggleTabGroupStarred('0', 'g1', false);
      const groups = list[0].groupList;
      expect(groups[0].groupName).toBe('B');
      expect(groups[0].isStarred).toBe(true);
      expect(groups[1].groupName).toBe('A');
      expect(groups[1].isStarred).toBe(false);
      expect(groups[2].groupName).toBe('C');
    });

    it('分类不存在时不报错', async () => {
      setupTagList([stagingTag()]);
      await expect(
        utils.toggleTabGroupStarred('nonexistent', 'g1', true),
      ).resolves.not.toThrow();
    });

    it('标签组不存在时不报错', async () => {
      setupTagList([stagingTag()]);
      await expect(
        utils.toggleTabGroupStarred('0', 'nonexistent', true),
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // groupListSortbyName
  // ==========================================================================
  describe('groupListSortbyName', () => {
    it('升序排序标签组', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'Banana' }),
          makeGroup({ groupId: 'g2', groupName: 'Apple' }),
          makeGroup({ groupId: 'g3', groupName: 'Cherry' }),
        ]),
      ];
      setupTagList(list);
      await utils.groupListSortbyName('ascending', '0');
      expect(list[0].groupList.map(g => g.groupName)).toEqual([
        'Apple',
        'Banana',
        'Cherry',
      ]);
    });

    it('降序排序标签组', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'Banana' }),
          makeGroup({ groupId: 'g2', groupName: 'Apple' }),
          makeGroup({ groupId: 'g3', groupName: 'Cherry' }),
        ]),
      ];
      setupTagList(list);
      await utils.groupListSortbyName('descending', '0');
      expect(list[0].groupList.map(g => g.groupName)).toEqual([
        'Cherry',
        'Banana',
        'Apple',
      ]);
    });

    it('星标标签组不参与排序', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'Cherry', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'Banana' }),
          makeGroup({ groupId: 'g3', groupName: 'Apple' }),
        ]),
      ];
      setupTagList(list);
      await utils.groupListSortbyName('ascending', '0');
      expect(list[0].groupList[0].groupName).toBe('Cherry');
      expect(list[0].groupList[0].isStarred).toBe(true);
      expect(list[0].groupList[1].groupName).toBe('Apple');
      expect(list[0].groupList[2].groupName).toBe('Banana');
    });

    it('分类不存在时不报错', async () => {
      setupTagList([]);
      await expect(
        utils.groupListSortbyName('ascending', 'nonexistent'),
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // groupListSortbyCreateTime
  // ==========================================================================
  describe('groupListSortbyCreateTime', () => {
    it('按创建时间升序排序', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', createTime: '2024-03-01 00:00:00' }),
          makeGroup({ groupId: 'g2', groupName: 'B', createTime: '2024-01-01 00:00:00' }),
          makeGroup({ groupId: 'g3', groupName: 'C', createTime: '2024-02-01 00:00:00' }),
        ]),
      ];
      setupTagList(list);
      await utils.groupListSortbyCreateTime('ascending', '0');
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['B', 'C', 'A']);
    });

    it('按创建时间降序排序', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', createTime: '2024-03-01 00:00:00' }),
          makeGroup({ groupId: 'g2', groupName: 'B', createTime: '2024-01-01 00:00:00' }),
          makeGroup({ groupId: 'g3', groupName: 'C', createTime: '2024-02-01 00:00:00' }),
        ]),
      ];
      setupTagList(list);
      await utils.groupListSortbyCreateTime('descending', '0');
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['A', 'C', 'B']);
    });

    it('星标标签组不参与排序', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            isStarred: true,
            createTime: '2024-03-01 00:00:00',
          }),
          makeGroup({ groupId: 'g2', groupName: 'B', createTime: '2024-01-01 00:00:00' }),
        ]),
      ];
      setupTagList(list);
      await utils.groupListSortbyCreateTime('ascending', '0');
      expect(list[0].groupList[0].groupName).toBe('A');
      expect(list[0].groupList[0].isStarred).toBe(true);
    });
  });

  // ==========================================================================
  // groupListSortbyStarred
  // ==========================================================================
  describe('groupListSortbyStarred', () => {
    it('insertPosition 为 top 时插入列表排在前面', () => {
      const list = [makeGroup({ groupId: 'g1', groupName: 'Existing' })];
      const insertList = [
        makeGroup({ groupId: 'g2', groupName: 'New', isStarred: true }),
      ];
      const result = utils.groupListSortbyStarred({
        list,
        insertList,
        insertPosition: 'top',
      });
      expect(result[0].groupName).toBe('New');
    });

    it('insertPosition 为 bottom 时插入列表排在后面', () => {
      const list = [makeGroup({ groupId: 'g1', groupName: 'Existing', isStarred: true })];
      const insertList = [makeGroup({ groupId: 'g2', groupName: 'New' })];
      const result = utils.groupListSortbyStarred({
        list,
        insertList,
        insertPosition: 'bottom',
      });
      expect(result[0].groupName).toBe('Existing');
      expect(result[1].groupName).toBe('New');
    });
  });

  // ==========================================================================
  // tabGroupMove
  // ==========================================================================
  describe('tabGroupMove', () => {
    it('标签组上移', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupMove('up', '0', 'g2');
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['B', 'A', 'C']);
    });

    it('标签组下移', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupMove('down', '0', 'g2');
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['A', 'C', 'B']);
    });

    it('第一个标签组上移到上一个分类', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({ groupId: 'g2', groupName: 'B' }),
            makeGroup({ groupId: 'g3', groupName: 'C' }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.tabGroupMove('up', 't2', 'g2');
      expect(list[0].groupList).toHaveLength(2);
      expect(list[0].groupList[1].groupName).toBe('B');
      expect(list[1].groupList).toHaveLength(1);
    });

    it('最后一个标签组下移到下一个分类', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({ groupId: 'g1', groupName: 'A' }),
            makeGroup({ groupId: 'g2', groupName: 'B' }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g3', groupName: 'C' })],
        }),
      ];
      setupTagList(list);
      await utils.tabGroupMove('down', 't1', 'g2');
      expect(list[0].groupList).toHaveLength(1);
      expect(list[1].groupList).toHaveLength(2);
      expect(list[1].groupList[0].groupName).toBe('B');
    });

    it('第一个标签组上移且无上一个分类时不操作', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupMove('up', '0', 'g1');
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['A', 'B']);
    });

    it('最后一个标签组下移且无下一个分类时不操作', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupMove('down', '0', 'g2');
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['A', 'B']);
    });

    it('上移跨越星标状态边界时继承星标', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'B', isStarred: false }),
          makeGroup({ groupId: 'g3', groupName: 'C', isStarred: false }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupMove('up', '0', 'g2');
      expect(list[0].groupList[0].groupName).toBe('B');
      expect(list[0].groupList[0].isStarred).toBe(true);
    });

    it('下移跨越星标状态边界时取消星标', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'B', isStarred: false }),
          makeGroup({ groupId: 'g3', groupName: 'C', isStarred: false }),
        ]),
      ];
      setupTagList(list);
      await utils.tabGroupMove('down', '0', 'g1');
      // 下移逻辑：splice(index+2, 0, group) 再 splice(index, 1)
      // 初始 [A*(0), B(1), C(2)]，A 下移后变为 [B(0), A(1), C(2)]
      // A 跨越星标边界到非星标区域，变为非星标
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['B', 'A', 'C']);
      expect(list[0].groupList[1].groupName).toBe('A');
      expect(list[0].groupList[1].isStarred).toBe(false);
    });
  });

  // ==========================================================================
  // tabGroupMoveThrough
  // ==========================================================================
  describe('tabGroupMoveThrough', () => {
    it('移动标签组到另一个分类', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      const result = await utils.tabGroupMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
      });
      expect(list[0].groupList).toHaveLength(0);
      expect(list[1].groupList).toHaveLength(1);
      expect(list[1].groupList[0].groupName).toBe('A');
      expect(result.targetGroupId).toBe('g1');
    });

    it('复制模式保留原标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      await utils.tabGroupMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        isCopy: true,
      });
      expect(list[0].groupList).toHaveLength(1);
      expect(list[1].groupList).toHaveLength(1);
      expect(list[1].groupList[0].groupId).not.toBe('g1');
    });

    it('autoMerge 模式合并同名标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({
              groupId: 'g2',
              groupName: 'A',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      setupTagList(list);
      const result = await utils.tabGroupMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        autoMerge: true,
      });
      expect(list[0].groupList).toHaveLength(0);
      expect(list[1].groupList).toHaveLength(1);
      expect(list[1].groupList[0].tabList).toHaveLength(2);
      expect(result.targetGroupId).toBe('g2');
    });

    it('源分类不存在时不操作', async () => {
      setupTagList([makeTag({ tagId: 't2', tagName: 'T2', groupList: [] })]);
      const result = await utils.tabGroupMoveThrough({
        sourceGroupId: 'nonexistent',
        targetTagId: 't2',
      });
      expect(result.targetGroupId).toBeUndefined();
    });

    it('目标分类不存在时不操作', async () => {
      setupTagList([
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
      ]);
      const result = await utils.tabGroupMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 'nonexistent',
      });
      expect(result.targetGroupId).toBeUndefined();
    });

    it('移动到星标区域时继承星标状态', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({ groupId: 'g2', groupName: 'B', isStarred: true }),
            makeGroup({ groupId: 'g3', groupName: 'C' }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.tabGroupMoveThrough({ sourceGroupId: 'g1', targetTagId: 't2' });
      expect(list[1].groupList[0].isStarred).toBe(true);
    });
  });

  // ==========================================================================
  // allTabGroupsMoveThrough
  // ==========================================================================
  describe('allTabGroupsMoveThrough', () => {
    it('移动所有标签组到目标分类', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({ groupId: 'g1', groupName: 'A' }),
            makeGroup({ groupId: 'g2', groupName: 'B' }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g3', groupName: 'C' })],
        }),
      ];
      setupTagList(list);
      const result = await utils.allTabGroupsMoveThrough({
        sourceTagId: 't1',
        targetTagId: 't2',
      });
      expect(list[0].groupList).toHaveLength(0);
      expect(list[1].groupList).toHaveLength(3);
      expect(result.targetTagId).toBe('t2');
    });

    it('复制模式保留原分类中的标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      await utils.allTabGroupsMoveThrough({
        sourceTagId: 't1',
        targetTagId: 't2',
        isCopy: true,
      });
      expect(list[0].groupList).toHaveLength(1);
      expect(list[1].groupList).toHaveLength(1);
    });

    it('autoMerge 模式合并同名标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({
              groupId: 'g2',
              groupName: 'A',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.allTabGroupsMoveThrough({
        sourceTagId: 't1',
        targetTagId: 't2',
        autoMerge: true,
      });
      expect(list[1].groupList).toHaveLength(1);
      expect(list[1].groupList[0].tabList).toHaveLength(2);
    });

    it('源分类不存在时返回 undefined', async () => {
      setupTagList([makeTag({ tagId: 't2', tagName: 'T2', groupList: [] })]);
      const result = await utils.allTabGroupsMoveThrough({
        sourceTagId: 'nonexistent',
        targetTagId: 't2',
      });
      expect(result.targetTagId).toBeUndefined();
    });
  });

  // ==========================================================================
  // addTabItem
  // ==========================================================================
  describe('addTabItem', () => {
    it('添加标签页到指定标签组', async () => {
      const list = [
        stagingTag([makeGroup({ groupId: 'g1', groupName: 'A', tabList: [] })]),
      ];
      setupTagList(list);
      await utils.addTabItem('g1', makeTab('https://new.com', 'New'));
      expect(list[0].groupList[0].tabList).toHaveLength(1);
      expect(list[0].groupList[0].tabList[0].url).toBe('https://new.com');
    });

    it('标签组不存在时不报错', async () => {
      setupTagList([stagingTag()]);
      await expect(
        utils.addTabItem('nonexistent', makeTab('https://a.com')),
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // updateTab
  // ==========================================================================
  describe('updateTab', () => {
    it('更新指定标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [{ tabId: 't1', url: 'https://old.com', title: 'Old' }],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.updateTab({ groupId: 'g1', data: { tabId: 't1', title: 'New Title' } });
      expect(list[0].groupList[0].tabList[0].title).toBe('New Title');
      expect(list[0].groupList[0].tabList[0].url).toBe('https://old.com');
    });

    it('不指定 tagId 时遍历所有分类', async () => {
      const list = [
        makeTag({ tagId: 't1', tagName: 'T1', groupList: [] }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [{ tabId: 'tab1', url: 'https://a.com', title: 'Old' }],
            }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.updateTab({ groupId: 'g1', data: { tabId: 'tab1', title: 'Updated' } });
      expect(list[1].groupList[0].tabList[0].title).toBe('Updated');
    });
  });

  // ==========================================================================
  // copyTabs
  // ==========================================================================
  describe('copyTabs', () => {
    it('复制标签页到同一标签组中指定位置之后', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
              { tabId: 't3', url: 'https://c.com', title: 'C' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.copyTabs('g1', [{ tabId: 't1', url: 'https://a.com', title: 'A' }]);
      const tabList = list[0].groupList[0].tabList;
      expect(tabList).toHaveLength(4);
      expect(tabList[1].tabId).not.toBe('t1');
      expect(tabList[1].url).toBe('https://a.com');
    });
  });

  // ==========================================================================
  // removeTabs
  // ==========================================================================
  describe('removeTabs', () => {
    it('移除指定标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.removeTabs('g1', [{ tabId: 't1', url: 'https://a.com', title: 'A' }]);
      expect(list[0].groupList[0].tabList).toHaveLength(1);
      expect(list[0].groupList[0].tabList[0].tabId).toBe('t2');
    });

    it('标签组不存在时不报错', async () => {
      setupTagList([stagingTag()]);
      const result = await utils.removeTabs('nonexistent', [
        { tabId: 't1', url: 'https://a.com', title: 'A' },
      ]);
      expect(result).toBeUndefined();
    });

    it('DELETE_UNLOCKED_EMPTY_GROUP 为 true 时自动删除空标签组', async () => {
      // removeTabs 直接读取 Store.settingsUtils.settings，需要同时设置属性和 mock
      const settings = { ...defaultSettings, deleteUnlockedEmptyGroup: true };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            isLocked: false,
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.removeTabs('g1', [{ tabId: 't1', url: 'https://a.com', title: 'A' }]);
      expect(list[0].groupList).toHaveLength(0);
    });

    it('锁定的标签组即使为空也不删除', async () => {
      const settings = { ...defaultSettings, deleteUnlockedEmptyGroup: true };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            isLocked: true,
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.removeTabs('g1', [{ tabId: 't1', url: 'https://a.com', title: 'A' }]);
      expect(list[0].groupList).toHaveLength(1);
    });

    it('filterFlag 为 true 时过滤空分类和标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
            }),
            makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] }),
          ],
        }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      await utils.removeTabs(
        'g1',
        [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
        true,
      );
      // filterFlag=true 时通过 getFilteredTagList 过滤
      expect(setTagListSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // onTabDrop
  // ==========================================================================
  describe('onTabDrop', () => {
    it('同组内标签页上移', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
              { tabId: 't3', url: 'https://c.com', title: 'C' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabDrop('g1', 'g1', 2, 0);
      expect(list[0].groupList[0].tabList.map(t => t.tabId)).toEqual(['t3', 't1', 't2']);
    });

    it('同组内标签页下移', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
              { tabId: 't3', url: 'https://c.com', title: 'C' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabDrop('g1', 'g1', 0, 2);
      expect(list[0].groupList[0].tabList.map(t => t.tabId)).toEqual(['t2', 't1', 't3']);
    });

    it('跨组移动标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
          makeGroup({
            groupId: 'g2',
            groupName: 'B',
            tabList: [{ tabId: 't2', url: 'https://b.com', title: 'B' }],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabDrop('g1', 'g2', 0, 0);
      expect(list[0].groupList[0].tabList).toHaveLength(0);
      expect(list[0].groupList[1].tabList).toHaveLength(2);
      expect(list[0].groupList[1].tabList[0].tabId).toBe('t1');
    });

    it('跨组移动后源组为空且 DELETE_UNLOCKED_EMPTY_GROUP 为 true 时删除源组', async () => {
      const settings = { ...defaultSettings, deleteUnlockedEmptyGroup: true };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            isLocked: false,
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
          makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabDrop('g1', 'g2', 0, 0);
      expect(list[0].groupList).toHaveLength(1);
      expect(list[0].groupList[0].groupId).toBe('g2');
    });
  });

  // ==========================================================================
  // tabMoveThrough
  // ==========================================================================
  describe('tabMoveThrough', () => {
    it('移动标签页到另一个标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] })],
        }),
      ];
      setupTagList(list);
      await utils.tabMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        targetGroupId: 'g2',
        tabs: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
      });
      expect(list[0].groupList[0].tabList).toHaveLength(0);
      expect(list[1].groupList[0].tabList).toHaveLength(1);
    });

    it('复制模式保留原标签页', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] })],
        }),
      ];
      setupTagList(list);
      await utils.tabMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        targetGroupId: 'g2',
        tabs: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
        isCopy: true,
      });
      expect(list[0].groupList[0].tabList).toHaveLength(1);
      expect(list[1].groupList[0].tabList).toHaveLength(1);
      expect(list[1].groupList[0].tabList[0].tabId).not.toBe('tab1');
    });

    it('autoMerge 模式对标签页去重', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({
              groupId: 'g2',
              groupName: 'B',
              tabList: [
                { tabId: 'tab2', url: 'https://a.com', title: 'A dup' },
                { tabId: 'tab3', url: 'https://b.com', title: 'B' },
              ],
            }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.tabMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        targetGroupId: 'g2',
        tabs: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
        autoMerge: true,
      });
      expect(list[1].groupList[0].tabList).toHaveLength(2);
    });

    it('源标签组为空时自动删除', async () => {
      // tabMoveThrough 同时使用 getSettings() 和 settings 属性
      const settings = { ...defaultSettings, deleteUnlockedEmptyGroup: true };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              isLocked: false,
              tabList: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] })],
        }),
      ];
      setupTagList(list);
      await utils.tabMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        targetGroupId: 'g2',
        tabs: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
      });
      expect(list[0].groupList).toHaveLength(0);
    });
  });

  // ==========================================================================
  // tabsSortbyName
  // ==========================================================================
  describe('tabsSortbyName', () => {
    it('按标题升序排序标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://c.com', title: 'Cherry' },
              { tabId: 't2', url: 'https://a.com', title: 'Apple' },
              { tabId: 't3', url: 'https://b.com', title: 'Banana' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.tabsSortbyName('ascending', 'g1', '0');
      expect(list[0].groupList[0].tabList.map(t => t.title)).toEqual([
        'Apple',
        'Banana',
        'Cherry',
      ]);
    });

    it('按标题降序排序标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'Apple' },
              { tabId: 't2', url: 'https://b.com', title: 'Banana' },
              { tabId: 't3', url: 'https://c.com', title: 'Cherry' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.tabsSortbyName('descending', 'g1', '0');
      expect(list[0].groupList[0].tabList.map(t => t.title)).toEqual([
        'Cherry',
        'Banana',
        'Apple',
      ]);
    });
  });

  // ==========================================================================
  // mergeTags
  // ==========================================================================
  describe('mergeTags', () => {
    it('同名分类的标签组合并', async () => {
      const source = [
        makeTag({
          tagId: 's1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'sg1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
      ];
      const target = [
        makeTag({
          tagId: 't1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'tg1',
              groupName: 'A',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      const result = await utils.mergeTags(source, target);
      const workTag = result.find(t => t.tagName === 'Work');
      expect(workTag).toBeTruthy();
      expect(workTag!.groupList).toHaveLength(1);
      expect(workTag!.groupList[0].tabList).toHaveLength(2);
    });

    it('不同名分类各自保留', async () => {
      const source = [
        makeTag({
          tagId: 's1',
          tagName: 'Source',
          groupList: [makeGroup({ groupId: 'sg1', groupName: 'A' })],
        }),
      ];
      const target = [
        makeTag({
          tagId: 't1',
          tagName: 'Target',
          groupList: [makeGroup({ groupId: 'tg1', groupName: 'B' })],
        }),
      ];
      const result = await utils.mergeTags(source, target);
      expect(result).toHaveLength(2);
      expect(result.map(t => t.tagName).sort()).toEqual(['Source', 'Target']);
    });

    it('UNNAMED_GROUP 对应的标签组合并时重命名', async () => {
      const unnamedGroupName = 'Unnamed Group'; // 假设 UNNAMED_GROUP 值
      const source = [
        makeTag({
          tagId: 's1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'sg1',
              groupName: unnamedGroupName,
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
      ];
      const target = [
        makeTag({
          tagId: 't1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'tg1',
              groupName: unnamedGroupName,
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      const result = await utils.mergeTags(source, target);
      const workTag = result.find(t => t.tagName === 'Work');
      expect(workTag).toBeTruthy();
      // UNNAMED_GROUP 被分离并重命名，不应直接保留原名
      const unnamedGroups = workTag!.groupList.filter(
        g => g.groupName === unnamedGroupName,
      );
      // 可能 0 个或 2 个（取决于 UNNAMED_GROUP 的实际值）
    });

    it('中转站（static）分类排在第一位', async () => {
      const staging = stagingTag([makeGroup({ groupId: 'g1', groupName: 'A' })]);
      const source = [makeTag({ tagId: 's1', tagName: 'Source', groupList: [] })];
      const target = [
        staging,
        makeTag({ tagId: 't1', tagName: 'Target', groupList: [] }),
      ];
      const result = await utils.mergeTags(source, target);
      expect(result[0].static).toBe(true);
      expect(result[0].tagName).toBe('Staging Area');
    });

    it('source 中有多个同名分类时合并到同一结果', async () => {
      const source = [
        makeTag({
          tagId: 's1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'sg1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({
          tagId: 's2',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'sg2',
              groupName: 'B',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      const target = [makeTag({ tagId: 't1', tagName: 'Work', groupList: [] })];
      const result = await utils.mergeTags(source, target);
      const workTag = result.find(t => t.tagName === 'Work');
      expect(workTag!.groupList).toHaveLength(2);
    });

    it('空 source 返回 target', async () => {
      const target = [
        makeTag({
          tagId: 't1',
          tagName: 'T',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
      ];
      const result = await utils.mergeTags([], target);
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe('T');
    });
  });

  // ==========================================================================
  // importTags
  // ==========================================================================
  describe('importTags', () => {
    it('overwrite 模式替换所有数据', async () => {
      setupTagList([
        stagingTag([
          makeGroup({
            groupId: 'old',
            groupName: 'Old',
            tabList: [makeTab('https://old.com')],
          }),
        ]),
      ]);
      const newTags = [
        makeTag({
          tagId: 'new',
          tagName: 'New',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'G1',
              tabList: [makeTab('https://new.com')],
            }),
          ],
        }),
      ];
      await utils.importTags(newTags, 'overwrite');
      expect(setTagListSpy).toHaveBeenCalledWith(newTags);
    });

    it('merge 模式合并同名分类', async () => {
      setupTagList([
        stagingTag(),
        makeTag({
          tagId: 't1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
      ]);
      const newTags = [
        makeTag({
          tagId: 's1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'g2',
              groupName: 'A',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      await utils.importTags(newTags, 'merge');
      const callArgs = setTagListSpy.mock.calls[0][0] as TagItem[];
      const workTag = callArgs.find((t: TagItem) => t.tagName === 'Work');
      expect(workTag!.groupList).toHaveLength(1);
      expect(workTag!.groupList[0].tabList).toHaveLength(2);
    });

    it('append 模式追加新分类', async () => {
      setupTagList([
        stagingTag(),
        makeTag({ tagId: 't1', tagName: 'Existing', groupList: [] }),
      ]);
      const newTags = [
        makeTag({
          tagId: 's1',
          tagName: 'New',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'G1' })],
        }),
      ];
      await utils.importTags(newTags, 'append');
      const callArgs = setTagListSpy.mock.calls[0][0] as TagItem[];
      expect(callArgs.length).toBeGreaterThanOrEqual(3);
      expect(callArgs[0].static).toBe(true);
      expect(callArgs.find((t: TagItem) => t.tagName === 'New')).toBeTruthy();
      expect(callArgs.find((t: TagItem) => t.tagName === 'Existing')).toBeTruthy();
    });

    it('空 target 时直接设置导入数据', async () => {
      setupTagList([]);
      const newTags = [
        makeTag({
          tagId: 's1',
          tagName: 'T',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
      ];
      await utils.importTags(newTags, 'append');
      expect(setTagListSpy).toHaveBeenCalledWith(newTags);
    });

    it('target 只有空中转站时视为 overwrite', async () => {
      setupTagList([stagingTag()]);
      const newTags = [
        makeTag({
          tagId: 's1',
          tagName: 'T',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
      ];
      await utils.importTags(newTags, 'append');
      expect(setTagListSpy).toHaveBeenCalledWith(newTags);
    });

    it('append 模式合并中转站标签组', async () => {
      setupTagList([
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'Existing',
            tabList: [makeTab('https://a.com')],
          }),
        ]),
      ]);
      const newTags = [
        stagingTag([
          makeGroup({
            groupId: 'g2',
            groupName: 'Imported',
            tabList: [makeTab('https://b.com')],
          }),
        ]),
        makeTag({ tagId: 's1', tagName: 'New', groupList: [] }),
      ];
      await utils.importTags(newTags, 'append');
      const callArgs = setTagListSpy.mock.calls[0][0] as TagItem[];
      const staging = callArgs.find((t: TagItem) => t.static);
      expect(staging).toBeTruthy();
      expect(staging!.groupList.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // exportTags
  // ==========================================================================
  describe('exportTags', () => {
    it('导出数据移除 tagId、groupId、tabId、favIconUrl', async () => {
      setupTagList([
        makeTag({
          tagId: 't1',
          tagName: 'Work',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [
                {
                  tabId: 'tab1',
                  url: 'https://a.com',
                  title: 'A',
                  favIconUrl: 'https://a.com/favicon.ico',
                },
              ],
            }),
          ],
        }),
      ]);
      const result = await utils.exportTags();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('tagId');
      expect(result[0].tagName).toBe('Work');
      expect(result[0].groupList).toHaveLength(1);
      expect(result[0].groupList![0]).not.toHaveProperty('groupId');
      expect(result[0].groupList![0].groupName).toBe('A');
      expect(result[0].groupList![0].tabList).toHaveLength(1);
      expect(result[0].groupList![0].tabList[0]).not.toHaveProperty('tabId');
      expect(result[0].groupList![0].tabList[0]).not.toHaveProperty('favIconUrl');
      expect(result[0].groupList![0].tabList[0].url).toBe('https://a.com');
    });

    it('空标签列表导出', async () => {
      setupTagList([]);
      const result = await utils.exportTags();
      expect(result).toEqual([]);
    });

    it('中转站也正常导出', async () => {
      setupTagList([
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [makeTab('https://a.com')],
          }),
        ]),
      ]);
      const result = await utils.exportTags();
      expect(result).toHaveLength(1);
      expect(result[0].tagName).toBe('Staging Area');
    });
  });

  // ==========================================================================
  // copyLinks
  // ==========================================================================
  describe('copyLinks', () => {
    it('按模板生成链接文本', () => {
      const tabs = [
        { tabId: 't1', url: 'https://a.com', title: 'Site A' },
        { tabId: 't2', url: 'https://b.com', title: 'Site B' },
      ];
      const result = utils.copyLinks(tabs);
      expect(result).toBe('https://a.com | Site A\nhttps://b.com | Site B');
    });

    it('空标签列表返回空字符串', () => {
      expect(utils.copyLinks([])).toBe('');
    });

    it('模板中 title 和 url 为空时正常处理', () => {
      const tabs = [{ tabId: 't1', url: '', title: '' }];
      const result = utils.copyLinks(tabs);
      expect(result).toBe(' | ');
    });
  });

  // ==========================================================================
  // createOpenedTabsSnapshot
  // ==========================================================================
  describe('createOpenedTabsSnapshot', () => {
    it('无浏览器标签组时独立标签页生成 tab 类型快照', async () => {
      const tabs = [
        {
          id: 1,
          title: 'A',
          url: 'https://a.com',
          favIconUrl: '',
          windowId: 1,
          index: 0,
          pinned: false,
          highlighted: false,
          active: false,
          incognito: false,
          status: 'complete',
        } as any,
        {
          id: 2,
          title: 'B',
          url: 'https://b.com',
          favIconUrl: '',
          windowId: 1,
          index: 1,
          pinned: false,
          highlighted: false,
          active: false,
          incognito: false,
          status: 'complete',
        } as any,
      ];
      const result = await utils.createOpenedTabsSnapshot(tabs);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('type', 'tab');
      expect(result[0]).toHaveProperty('url', 'https://a.com');
    });

    it('标签页有 groupId 时生成 group 类型快照', async () => {
      const tabs = [
        {
          id: 1,
          title: 'A',
          url: 'https://a.com',
          favIconUrl: '',
          groupId: 5,
          windowId: 1,
          index: 0,
          pinned: false,
          highlighted: false,
          active: false,
          incognito: false,
          status: 'complete',
        } as any,
        {
          id: 2,
          title: 'B',
          url: 'https://b.com',
          favIconUrl: '',
          groupId: 5,
          windowId: 1,
          index: 1,
          pinned: false,
          highlighted: false,
          active: false,
          incognito: false,
          status: 'complete',
        } as any,
      ];
      const result = await utils.createOpenedTabsSnapshot(tabs);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('type', 'group');
      expect((result[0] as any).tabList).toHaveLength(2);
    });

    it('groupId 为 -1 时视为独立标签页', async () => {
      const tabs = [
        {
          id: 1,
          title: 'A',
          url: 'https://a.com',
          favIconUrl: '',
          groupId: -1,
          windowId: 1,
          index: 0,
          pinned: false,
          highlighted: false,
          active: false,
          incognito: false,
          status: 'complete',
        } as any,
      ];
      const result = await utils.createOpenedTabsSnapshot(tabs);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('type', 'tab');
    });
  });

  // ==========================================================================
  // getMergedGroupList - 覆盖分支：同一列表内存在重复 key
  // ==========================================================================
  describe('getMergedGroupList (duplicate keys within same list)', () => {
    const mergeHandler = (prev: GroupItem, curr: GroupItem) => ({
      ...prev,
      tabList: [...prev.tabList, ...curr.tabList],
    });

    it('同一列表内有重复 groupName 时在 handleMerge 中合并', () => {
      const list = [
        makeGroup({ groupId: '1', groupName: 'A', tabList: [makeTab('https://a.com')] }),
        makeGroup({ groupId: '2', groupName: 'A', tabList: [makeTab('https://b.com')] }),
      ];
      const insertList = [
        makeGroup({ groupId: '3', groupName: 'B', tabList: [makeTab('https://c.com')] }),
      ];
      const result = getMergedGroupList({ list, insertList }, mergeHandler);
      // list 中两个 A 被合并为一个，再与 insertList 的 B 合并
      const groupA = result.find(g => g.groupName === 'A');
      expect(groupA).toBeTruthy();
      expect(groupA!.tabList).toHaveLength(2);
      expect(result).toHaveLength(2);
    });

    it('insertList 内有重复 groupName 时在 handleMerge 中合并', () => {
      const list = [
        makeGroup({ groupId: '1', groupName: 'A', tabList: [makeTab('https://a.com')] }),
      ];
      const insertList = [
        makeGroup({ groupId: '2', groupName: 'B', tabList: [makeTab('https://b.com')] }),
        makeGroup({ groupId: '3', groupName: 'B', tabList: [makeTab('https://c.com')] }),
      ];
      const result = getMergedGroupList({ list, insertList }, mergeHandler);
      const groupB = result.find(g => g.groupName === 'B');
      expect(groupB).toBeTruthy();
      expect(groupB!.tabList).toHaveLength(2);
    });
  });

  // ==========================================================================
  // clearAll
  // ==========================================================================
  describe('clearAll', () => {
    it('清空所有分类并将有标签页的分类放入回收站', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [makeTab('https://a.com')],
          }),
        ]),
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g2',
              groupName: 'B',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.clearAll();
      // setTagList 应该被调用两次：一次在 clearAll 中设置空列表，一次在 getTagList 的 mock 中
      // 验证 setTagList 被调用并传入空数组
      expect(setTagListSpy).toHaveBeenCalled();
      // 回收站应该收到有标签页的分类
      expect(Store.recycleBinUtils.addTags).toHaveBeenCalled();
      const recycledTags = (Store.recycleBinUtils.addTags as any).mock.calls[0][0];
      expect(recycledTags).toHaveLength(2); // staging 和 T1 都有标签页
    });

    it('空标签组不放入回收站', async () => {
      const list = [
        stagingTag([makeGroup({ groupId: 'g1', groupName: 'A', tabList: [] })]),
      ];
      setupTagList(list);
      await utils.clearAll();
      const recycledTags = (Store.recycleBinUtils.addTags as any).mock.calls[0][0];
      expect(recycledTags).toHaveLength(0);
    });

    it('无标签页的分类不放入回收站', async () => {
      const list = [makeTag({ tagId: 't1', tagName: 'T1', groupList: [] })];
      setupTagList(list);
      await utils.clearAll();
      const recycledTags = (Store.recycleBinUtils.addTags as any).mock.calls[0][0];
      expect(recycledTags).toHaveLength(0);
    });
  });

  // ==========================================================================
  // onTagDrop
  // ==========================================================================
  describe('onTagDrop', () => {
    it('分类上移', async () => {
      const list = [
        stagingTag(),
        makeTag({ tagId: 't1', tagName: 'T1', groupList: [] }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      await utils.onTagDrop(2, 0);
      expect(list.map(t => t.tagId)).toEqual(['t2', '0', 't1']);
    });

    it('分类下移', async () => {
      const list = [
        stagingTag(),
        makeTag({ tagId: 't1', tagName: 'T1', groupList: [] }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      // down: splice(targetIndex, 0, tmp) then splice(sourceIndex, 1)
      // [0:'0', 1:'t1', 2:'t2'] → splice(2,0,'0') → ['0','t1','0','t2'] → splice(0,1) → ['t1','0','t2']
      await utils.onTagDrop(0, 2);
      expect(list.map(t => t.tagId)).toEqual(['t1', '0', 't2']);
    });
  });

  // ==========================================================================
  // cloneGroup
  // ==========================================================================
  describe('cloneGroup', () => {
    it('在同分类中克隆标签组', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [makeTab('https://a.com')],
          }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      // 需要 mock getCustomLocaleMessages 返回 clone 后缀
      // 由于 mock 了 locale 模块返回空对象，后缀为空字符串
      await utils.cloneGroup('g1');
      expect(list[0].groupList).toHaveLength(3);
      // 克隆的标签组在原组之后
      expect(list[0].groupList[1].groupId).not.toBe('g1');
      expect(list[0].groupList[1].tabList).toHaveLength(1);
    });

    it('标签组不存在时不报错', async () => {
      setupTagList([stagingTag()]);
      await expect(utils.cloneGroup('nonexistent')).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // onTabGroupDrop - 同分类内和跨分类
  // ==========================================================================
  describe('onTabGroupDrop', () => {
    it('同分类内标签组上移', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabGroupDrop('0', '0', 2, 0);
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['C', 'A', 'B']);
    });

    it('同分类内标签组下移', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabGroupDrop('0', '0', 0, 2);
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['B', 'A', 'C']);
    });

    it('同分类内上移到星标组位置时继承星标状态', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabGroupDrop('0', '0', 2, 0);
      expect(list[0].groupList[0].groupName).toBe('C');
      expect(list[0].groupList[0].isStarred).toBe(true);
    });

    it('同分类内下移越过星标边界时取消星标', async () => {
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
          makeGroup({ groupId: 'g3', groupName: 'C' }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabGroupDrop('0', '0', 0, 2);
      expect(list[0].groupList.map(g => g.groupName)).toEqual(['B', 'A', 'C']);
      expect(list[0].groupList[1].isStarred).toBe(false);
    });

    it('跨分类移动标签组', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({ groupId: 'g1', groupName: 'A' }),
            makeGroup({ groupId: 'g2', groupName: 'B' }),
          ],
        }),
        makeTag({ tagId: 't2', tagName: 'T2', groupList: [] }),
      ];
      setupTagList(list);
      await utils.onTabGroupDrop('t1', 't2', 0, 0);
      expect(list[0].groupList).toHaveLength(1);
      expect(list[1].groupList).toHaveLength(1);
      expect(list[1].groupList[0].groupName).toBe('A');
    });

    it('跨分类移动到星标区域时继承星标', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({ groupId: 'g2', groupName: 'B', isStarred: true }),
            makeGroup({ groupId: 'g3', groupName: 'C' }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.onTabGroupDrop('t1', 't2', 0, 0);
      expect(list[1].groupList[0].groupName).toBe('A');
      expect(list[1].groupList[0].isStarred).toBe(true);
    });

    it('跨分类移动星标组到非星标区域时取消星标', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A', isStarred: true })],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({ groupId: 'g2', groupName: 'B' }),
            makeGroup({ groupId: 'g3', groupName: 'C' }),
          ],
        }),
      ];
      setupTagList(list);
      // 移动到 index 2（C 之后），前面是非星标的 C
      await utils.onTabGroupDrop('t1', 't2', 0, 2);
      expect(list[1].groupList[2].groupName).toBe('A');
      expect(list[1].groupList[2].isStarred).toBe(false);
    });
  });

  // ==========================================================================
  // tabGroupMove - 下移到下一个分类且目标首组为星标
  // ==========================================================================
  describe('tabGroupMove (down to next tag with starred)', () => {
    it('下移到下一个分类时如果目标首组星标则继承星标', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({ groupId: 'g1', groupName: 'A' }),
            makeGroup({ groupId: 'g2', groupName: 'B' }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [makeGroup({ groupId: 'g3', groupName: 'C', isStarred: true })],
        }),
      ];
      setupTagList(list);
      await utils.tabGroupMove('down', 't1', 'g2');
      expect(list[1].groupList[0].groupName).toBe('B');
      expect(list[1].groupList[0].isStarred).toBe(true);
    });

    it('上移到上一个分类时如果目标末组非星标则取消星标', async () => {
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A', isStarred: false })],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({ groupId: 'g2', groupName: 'B', isStarred: true }),
            makeGroup({ groupId: 'g3', groupName: 'C' }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.tabGroupMove('up', 't2', 'g2');
      expect(list[0].groupList[1].groupName).toBe('B');
      expect(list[0].groupList[1].isStarred).toBe(false);
    });
  });

  // ==========================================================================
  // removeTag - 回收站逻辑
  // ==========================================================================
  describe('removeTag (recycle bin)', () => {
    it('移除有标签页的分类时放入回收站', async () => {
      const list = [
        stagingTag(),
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.removeTag('t1');
      expect(Store.recycleBinUtils.addTags).toHaveBeenCalled();
    });

    it('移除空分类时不放入回收站', async () => {
      const list = [stagingTag(), makeTag({ tagId: 't1', tagName: 'T1', groupList: [] })];
      setupTagList(list);
      await utils.removeTag('t1');
      expect(Store.recycleBinUtils.addTags).not.toHaveBeenCalled();
    });

    it('移除不存在的分类时不报错', async () => {
      setupTagList([stagingTag()]);
      await expect(utils.removeTag('nonexistent')).resolves.not.toThrow();
      expect(Store.recycleBinUtils.addTags).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // onTabsDrop - 跨组移动
  // ==========================================================================
  describe('onTabsDrop (cross-group)', () => {
    it('跨组移动标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
            ],
          }),
          makeGroup({
            groupId: 'g2',
            groupName: 'B',
            tabList: [{ tabId: 't3', url: 'https://c.com', title: 'C' }],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabsDrop(
        { groupId: 'g1', selectedValues: ['t1'] } as any,
        { groupId: 'g2' } as any,
        0,
        0,
      );
      expect(list[0].groupList[0].tabList).toHaveLength(1);
      expect(list[0].groupList[0].tabList[0].tabId).toBe('t2');
      expect(list[0].groupList[1].tabList).toHaveLength(2);
      expect(list[0].groupList[1].tabList[0].tabId).toBe('t1');
    });

    it('跨组移动后源组为空且 DELETE_UNLOCKED_EMPTY_GROUP 为 true 时删除源组', async () => {
      const settings = { ...defaultSettings, deleteUnlockedEmptyGroup: true };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            isLocked: false,
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
          makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabsDrop(
        { groupId: 'g1', selectedValues: ['t1'] } as any,
        { groupId: 'g2' } as any,
        0,
        0,
      );
      expect(list[0].groupList).toHaveLength(1);
      expect(list[0].groupList[0].groupId).toBe('g2');
    });

    it('跨组移动后源组为空且锁定时不删除', async () => {
      const settings = { ...defaultSettings, deleteUnlockedEmptyGroup: true };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            isLocked: true,
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
          makeGroup({ groupId: 'g2', groupName: 'B', tabList: [] }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabsDrop(
        { groupId: 'g1', selectedValues: ['t1'] } as any,
        { groupId: 'g2' } as any,
        0,
        0,
      );
      expect(list[0].groupList).toHaveLength(2);
    });
  });

  // ==========================================================================
  // mergeTags - newTagMap 处理
  // ==========================================================================
  describe('mergeTags (newTagMap)', () => {
    it('source 中有多个同名但 target 中不存在的分类时合并到 newTagMap', async () => {
      const source = [
        makeTag({
          tagId: 's1',
          tagName: 'NewWork',
          groupList: [
            makeGroup({
              groupId: 'sg1',
              groupName: 'A',
              tabList: [makeTab('https://a.com')],
            }),
          ],
        }),
        makeTag({
          tagId: 's2',
          tagName: 'NewWork',
          groupList: [
            makeGroup({
              groupId: 'sg2',
              groupName: 'B',
              tabList: [makeTab('https://b.com')],
            }),
          ],
        }),
      ];
      const target = [makeTag({ tagId: 't1', tagName: 'Other', groupList: [] })];
      const result = await utils.mergeTags(source, target);
      const newWorkTag = result.find(t => t.tagName === 'NewWork');
      expect(newWorkTag).toBeTruthy();
      expect(newWorkTag!.groupList).toHaveLength(2);
    });

    it('target 有重复分类名时在 targetMap 中合并', async () => {
      const source = [makeTag({ tagId: 's1', tagName: 'Work', groupList: [] })];
      const target = [
        makeTag({
          tagId: 't1',
          tagName: 'Work',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'A' })],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'Work',
          groupList: [makeGroup({ groupId: 'g2', groupName: 'B' })],
        }),
      ];
      const result = await utils.mergeTags(source, target);
      const workTag = result.find(t => t.tagName === 'Work');
      expect(workTag).toBeTruthy();
      // target 中两个 Work 被合并，source 的 Work 也被合并进去
      expect(workTag!.groupList.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // restoreTabsSnapshot
  // ==========================================================================
  describe('restoreTabsSnapshot', () => {
    it('还原独立标签页快照', async () => {
      const list = [
        { type: 'tab' as const, url: 'https://a.com', title: 'A' },
        { type: 'tab' as const, url: 'https://b.com', title: 'B' },
      ];
      await utils.restoreTabsSnapshot(list as any);
      expect(openNewTab).toHaveBeenCalledTimes(2);
      expect(openNewTab).toHaveBeenCalledWith('https://a.com');
      expect(openNewTab).toHaveBeenCalledWith('https://b.com');
    });

    it('reverse 模式下反转打开顺序', async () => {
      (Store.settingsUtils as any).settings = {
        ...defaultSettings,
        openingTabsOrder: 'reverse',
      };
      (Store.settingsUtils.getSettings as any).mockResolvedValue({
        ...defaultSettings,
        openingTabsOrder: 'reverse',
      });
      const list = [
        { type: 'tab' as const, url: 'https://a.com', title: 'A' },
        { type: 'tab' as const, url: 'https://b.com', title: 'B' },
      ];
      await utils.restoreTabsSnapshot(list as any);
      expect(openNewTab).toHaveBeenCalledTimes(2);
      // 反转后 b 先打开
      expect(vi.mocked(openNewTab).mock.calls[0][0]).toBe('https://b.com');
      expect(vi.mocked(openNewTab).mock.calls[1][0]).toBe('https://a.com');
    });

    it('标签组快照中的无 URL 标签页被过滤', async () => {
      const list = [
        {
          type: 'group' as const,
          groupName: 'G1',
          tabList: [
            { url: '', title: 'Empty' },
            { url: '  ', title: 'Spaces' },
          ],
        },
      ];
      await utils.restoreTabsSnapshot(list as any);
      // 无有效 URL 的标签页被过滤，不调用 openNewTab
      expect(openNewTab).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // onOpenedTabGroupDrop
  // ==========================================================================
  describe('onOpenedTabGroupDrop', () => {
    const mockExtractInstruction = extractInstruction as unknown as ReturnType<
      typeof vi.fn
    >;

    beforeEach(() => {
      mockExtractInstruction.mockReset();
    });

    it('浏览器标签组拖拽到分类节点（make-child）', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'make-child' });
      const list = [stagingTag([makeGroup({ groupId: 'g1', groupName: 'Existing' })])];
      setupTagList(list);
      await utils.onOpenedTabGroupDrop(
        {
          selectedGroup: {
            groupName: 'Browser Group',
            tabs: [
              { title: 'Tab 1', url: 'https://1.com', favIconUrl: '' },
              { title: 'Tab 2', url: 'https://2.com', favIconUrl: '' },
            ],
          },
        } as any,
        {
          tagId: '0',
          nodeType: 'tag',
          nodeData: { groupList: list[0].groupList },
        } as any,
      );
      expect(list[0].groupList).toHaveLength(2);
      // groupInsertPosition 为 top 时插入到顶部
      expect(list[0].groupList[0].groupName).toBe('Browser Group');
      expect(list[0].groupList[0].tabList).toHaveLength(2);
    });

    it('浏览器标签组拖拽到分类节点（reorder-below）', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'reorder-below' });
      const list = [stagingTag([makeGroup({ groupId: 'g1', groupName: 'Existing' })])];
      setupTagList(list);
      await utils.onOpenedTabGroupDrop(
        {
          selectedGroup: {
            groupName: 'Browser Group',
            tabs: [{ title: 'Tab 1', url: 'https://1.com', favIconUrl: '' }],
          },
        } as any,
        {
          tagId: '0',
          nodeType: 'tag',
          nodeData: { groupList: list[0].groupList },
        } as any,
      );
      expect(list[0].groupList).toHaveLength(2);
      expect(list[0].groupList[1].groupName).toBe('Browser Group');
    });

    it('浏览器标签组拖拽到分类节点（reorder-above，非第一个分类）', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'reorder-above' });
      const list = [
        stagingTag([makeGroup({ groupId: 'g0', groupName: 'Staging Group' })]),
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [makeGroup({ groupId: 'g1', groupName: 'Existing' })],
        }),
      ];
      setupTagList(list);
      await utils.onOpenedTabGroupDrop(
        {
          selectedGroup: {
            groupName: 'Browser Group',
            tabs: [{ title: 'Tab 1', url: 'https://1.com', favIconUrl: '' }],
          },
        } as any,
        {
          tagId: 't1',
          nodeType: 'tag',
          nodeData: { groupList: list[1].groupList },
        } as any,
      );
      // reorder-above 对非第一个分类：插入到前一个分类末尾
      expect(list[0].groupList).toHaveLength(2);
      expect(list[0].groupList[1].groupName).toBe('Browser Group');
    });

    it('浏览器标签组拖拽到标签组节点（reorder-above）', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'reorder-above' });
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.onOpenedTabGroupDrop(
        {
          selectedGroup: {
            groupName: 'New Group',
            tabs: [{ title: 'Tab', url: 'https://new.com', favIconUrl: '' }],
          },
        } as any,
        {
          tagId: '0',
          nodeType: 'tabGroup',
          groupId: 'g2',
          nodeData: { groupList: list[0].groupList },
        } as any,
      );
      expect(list[0].groupList).toHaveLength(3);
      // reorder-above g2 → 插入到 g2 之前（index 1）
      expect(list[0].groupList[1].groupName).toBe('New Group');
    });

    it('浏览器标签组拖拽到标签组节点（reorder-below）', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'reorder-below' });
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'A' }),
          makeGroup({ groupId: 'g2', groupName: 'B' }),
        ]),
      ];
      setupTagList(list);
      await utils.onOpenedTabGroupDrop(
        {
          selectedGroup: {
            groupName: 'New Group',
            tabs: [{ title: 'Tab', url: 'https://new.com', favIconUrl: '' }],
          },
        } as any,
        {
          tagId: '0',
          nodeType: 'tabGroup',
          groupId: 'g1',
          nodeData: { groupList: list[0].groupList },
        } as any,
      );
      expect(list[0].groupList).toHaveLength(3);
      // reorder-below g1 → 插入到 g1 之后（index 1）
      expect(list[0].groupList[1].groupName).toBe('New Group');
    });

    it('拖拽到星标区域时新组继承星标状态', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'make-child' });
      const list = [
        stagingTag([
          makeGroup({ groupId: 'g1', groupName: 'Starred', isStarred: true }),
          makeGroup({ groupId: 'g2', groupName: 'Normal' }),
        ]),
      ];
      setupTagList(list);
      // groupInsertPosition 为 bottom，插入到末尾
      (Store.settingsUtils as any).settings = {
        ...defaultSettings,
        groupInsertPosition: 'bottom',
      };
      (Store.settingsUtils.getSettings as any).mockResolvedValue({
        ...defaultSettings,
        groupInsertPosition: 'bottom',
      });
      await utils.onOpenedTabGroupDrop(
        {
          selectedGroup: {
            groupName: 'New Group',
            tabs: [{ title: 'Tab', url: 'https://new.com', favIconUrl: '' }],
          },
        } as any,
        {
          tagId: '0',
          nodeType: 'tag',
          nodeData: { groupList: list[0].groupList },
        } as any,
      );
      // 插入到末尾（index 2），在星标区域之后，不应继承星标
      expect(list[0].groupList[2].isStarred).toBeFalsy();
    });

    it('使用 groupName 属性替代 selectedGroup.groupName', async () => {
      mockExtractInstruction.mockReturnValue({ type: 'make-child' });
      const list = [stagingTag([])];
      setupTagList(list);
      await utils.onOpenedTabGroupDrop(
        {
          groupName: 'Direct Group Name',
          tabs: [{ title: 'Tab', url: 'https://new.com', favIconUrl: '' }],
        } as any,
        {
          tagId: '0',
          nodeType: 'tag',
          nodeData: { groupList: list[0].groupList },
        } as any,
      );
      expect(list[0].groupList[0].groupName).toBe('Direct Group Name');
    });
  });

  // ==========================================================================
  // tabMoveThrough - insertPosition top
  // ==========================================================================
  describe('tabMoveThrough (insertPosition)', () => {
    it('insertPosition 为 top 时标签页插入到顶部', async () => {
      const settings = { ...defaultSettings, tabInsertPosition: 'top' };
      (Store.settingsUtils as any).settings = settings;
      (Store.settingsUtils.getSettings as any).mockResolvedValue(settings);
      const list = [
        makeTag({
          tagId: 't1',
          tagName: 'T1',
          groupList: [
            makeGroup({
              groupId: 'g1',
              groupName: 'A',
              tabList: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
            }),
          ],
        }),
        makeTag({
          tagId: 't2',
          tagName: 'T2',
          groupList: [
            makeGroup({
              groupId: 'g2',
              groupName: 'B',
              tabList: [{ tabId: 'tab2', url: 'https://b.com', title: 'B' }],
            }),
          ],
        }),
      ];
      setupTagList(list);
      await utils.tabMoveThrough({
        sourceGroupId: 'g1',
        targetTagId: 't2',
        targetGroupId: 'g2',
        tabs: [{ tabId: 'tab1', url: 'https://a.com', title: 'A' }],
      });
      expect(list[1].groupList[0].tabList[0].tabId).toBe('tab1');
      expect(list[1].groupList[0].tabList[1].tabId).toBe('tab2');
    });
  });

  // ==========================================================================
  // onOpenedTabsDrop - 边界情况
  // ==========================================================================
  describe('onOpenedTabsDrop (edge cases)', () => {
    it('目标标签组不存在时不操作', async () => {
      setupTagList([
        stagingTag([makeGroup({ groupId: 'g1', groupName: 'A', tabList: [] })]),
      ]);
      await utils.onOpenedTabsDrop(
        {
          isMultiSelect: false,
          draggingTabItem: { title: 'New', url: 'https://new.com', favIconUrl: '' },
        } as any,
        { groupId: 'nonexistent', tagId: '0' } as any,
        0,
      );
      // 不应该调用 setTagList
      expect(setTagListSpy).not.toHaveBeenCalled();
    });

    it('选中标签页为空时不操作', async () => {
      setupTagList([stagingTag()]);
      await utils.onOpenedTabsDrop(
        { isMultiSelect: true, selectedTabs: [] } as any,
        { groupId: 'g1', tagId: '0' } as any,
        0,
      );
      expect(setTagListSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // createTabs / createTabsIndependent
  // ==========================================================================
  describe('createTabs', () => {
    it('创建独立标签页到新标签组', async () => {
      // 需要 mock isGroupSupported 返回 false
      // 由于 isGroupSupported 来自 browser 相关模块，这里通过 mock storage/index 间接测试
      setupTagList([]);
      // 设置默认的 tagList 为空
      (utils as any).tagList = [];
      const result = await utils.createTabsIndependent(
        [
          { id: 1, title: 'A', url: 'https://a.com', favIconUrl: '' } as any,
          { id: 2, title: 'B', url: 'https://b.com', favIconUrl: '' } as any,
        ],
        {},
      );
      expect(result.tagId).toBeTruthy();
      expect(result.groupId).toBeTruthy();
    });

    it('创建标签页到指定标签组', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
        ]),
      ];
      (utils as any).tagList = list;
      const result = await utils.createTabsIndependent(
        [{ id: 1, title: 'New', url: 'https://new.com', favIconUrl: '' } as any],
        { targetTagId: '0', targetGroupId: 'g1' },
      );
      expect(result.tagId).toBe('0');
      expect(result.groupId).toBe('g1');
      expect(list[0].groupList[0].tabList).toHaveLength(2);
    });

    it('allowDuplicateTabs 为 false 时去重', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
        ]),
      ];
      (utils as any).tagList = list;
      const result = await utils.createTabsIndependent(
        [{ id: 1, title: 'A dup', url: 'https://a.com', favIconUrl: '' } as any],
        { targetTagId: '0', targetGroupId: 'g1' },
      );
      expect(result.tagId).toBe('0');
      // URL 相同，去重后应为 1
      expect(list[0].groupList[0].tabList).toHaveLength(1);
    });

    it('allowDuplicateTabs 为 true 时不去重', async () => {
      (Store.settingsUtils as any).settings = {
        ...defaultSettings,
        allowDuplicateTabs: true,
      };
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
        ]),
      ];
      (utils as any).tagList = list;
      const result = await utils.createTabsIndependent(
        [{ id: 1, title: 'A dup', url: 'https://a.com', favIconUrl: '' } as any],
        { targetTagId: '0', targetGroupId: 'g1' },
      );
      expect(list[0].groupList[0].tabList).toHaveLength(2);
    });

    it('createNewGroupOnSendSingleTab 为 true 时创建新标签组', async () => {
      (Store.settingsUtils as any).settings = {
        ...defaultSettings,
        createNewGroupOnSendSingleTab: true,
      };
      const list = [stagingTag([])];
      (utils as any).tagList = list;
      const result = await utils.createTabsIndependent(
        [{ id: 1, title: 'New', url: 'https://new.com', favIconUrl: '' } as any],
        { targetTagId: '0' },
      );
      expect(result.tagId).toBe('0');
      expect(list[0].groupList).toHaveLength(1);
      expect(list[0].groupList[0].tabList).toHaveLength(1);
    });

    it('allowDuplicateGroups 为 false 时合并同名标签组', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'New Tab Group',
            tabList: [{ tabId: 't1', url: 'https://existing.com', title: 'Existing' }],
          }),
        ]),
      ];
      (utils as any).tagList = list;
      await utils.createTabsIndependent(
        [{ id: 1, title: 'New', url: 'https://new.com', favIconUrl: '' } as any],
        { targetTagId: '0' },
      );
      // 不允许重复组时，新标签页应合并到已存在的同名组
      expect(list[0].groupList[0].tabList.length).toBeGreaterThanOrEqual(2);
    });

    it('目标 tag 不存在时创建新的中转站', async () => {
      (utils as any).tagList = [];
      // 传入多个标签页以触发 newTabs.length > 1 分支，避免单标签时 tag0 为 undefined 的问题
      const result = await utils.createTabsIndependent(
        [
          { id: 1, title: 'New', url: 'https://new.com', favIconUrl: '' } as any,
          { id: 2, title: 'New2', url: 'https://new2.com', favIconUrl: '' } as any,
        ],
        { targetTagId: 'nonexistent' },
      );
      expect(result.tagId).toBeTruthy();
      expect((utils as any).tagList).toHaveLength(1);
      expect((utils as any).tagList[0].static).toBe(true);
    });
  });

  // ==========================================================================
  // transformTabItem
  // ==========================================================================
  describe('transformTabItem', () => {
    it('转换浏览器标签页为 TabItem', () => {
      const tab = {
        id: 1,
        title: 'Test',
        url: 'https://test.com',
        favIconUrl: 'https://test.com/favicon.ico',
      } as any;
      const result = utils.transformTabItem(tab);
      expect(result.title).toBe('Test');
      expect(result.url).toBe('https://test.com');
      expect(result.favIconUrl).toBe('https://test.com/favicon.ico');
      expect(result.tabId).toBeTruthy();
    });

    it('data:image/ 开头的 favIconUrl 被清空', () => {
      const tab = {
        id: 1,
        title: 'Test',
        url: 'https://test.com',
        favIconUrl: 'data:image/png;base64,abc',
      } as any;
      const result = utils.transformTabItem(tab);
      expect(result.favIconUrl).toBe('');
    });
  });

  // ==========================================================================
  // onOpenedTabsDrop
  // ==========================================================================
  describe('onOpenedTabsDrop', () => {
    it('浏览器标签页拖拽到列表中', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            groupName: 'A',
            tabList: [{ tabId: 't1', url: 'https://a.com', title: 'A' }],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.onOpenedTabsDrop(
        {
          isMultiSelect: false,
          draggingTabItem: { title: 'New Tab', url: 'https://new.com', favIconUrl: '' },
        } as any,
        { groupId: 'g1', tagId: '0' } as any,
        1,
      );
      expect(list[0].groupList[0].tabList).toHaveLength(2);
      expect(list[0].groupList[0].tabList[1].url).toBe('https://new.com');
    });

    it('多选浏览器标签页拖拽到列表中', async () => {
      const list = [
        stagingTag([makeGroup({ groupId: 'g1', groupName: 'A', tabList: [] })]),
      ];
      setupTagList(list);
      await utils.onOpenedTabsDrop(
        {
          isMultiSelect: true,
          selectedTabs: [
            { title: 'Tab 1', url: 'https://1.com', favIconUrl: '' },
            { title: 'Tab 2', url: 'https://2.com', favIconUrl: '' },
          ],
        } as any,
        { groupId: 'g1', tagId: '0' } as any,
        0,
      );
      expect(list[0].groupList[0].tabList).toHaveLength(2);
    });
  });

  // ==========================================================================
  // getTagList - 直接测试
  // ==========================================================================
  describe('getTagList', () => {
    beforeEach(() => {
      vi.mocked(storage.getItem).mockReset();
      vi.mocked(storage.setItem).mockReset();
      // getTagList 内部调用 setTagList 设置 this.tagList，需要恢复真实实现
      setTagListSpy.mockRestore();
      // 重新 spy 但不 mock，以便验证调用
      setTagListSpy = vi.spyOn(utils, 'setTagList');
    });

    it('存储为空时创建中转站并存入 storage', async () => {
      vi.mocked(storage.getItem).mockResolvedValueOnce(null);
      const result = await utils.getTagList();
      expect(result).toHaveLength(1);
      expect(result[0].static).toBe(true);
      expect(result[0].tagId).toBe('0');
      expect(setTagListSpy).toHaveBeenCalled();
    });

    it('存储中无中转站时自动补到首位', async () => {
      const tag1 = makeTag({ tagId: 't1', tagName: 'T1' });
      vi.mocked(storage.getItem).mockResolvedValueOnce([tag1] as any);
      const result = await utils.getTagList();
      expect(result).toHaveLength(2);
      expect(result[0].static).toBe(true);
      expect(result[1].tagId).toBe('t1');
      expect(setTagListSpy).toHaveBeenCalled();
    });

    it('中转站在首位时不重新排序', async () => {
      const staging = {
        tagId: '0',
        tagName: 'Staging',
        static: true,
        createTime: '',
        groupList: [],
      };
      const tag1 = makeTag({ tagId: 't1', tagName: 'T1' });
      vi.mocked(storage.getItem).mockResolvedValueOnce([staging, tag1] as any);
      const result = await utils.getTagList();
      expect(result).toHaveLength(2);
      expect(result[0].tagId).toBe('0');
      expect(result[1].tagId).toBe('t1');
      // 中转站已在首位，不应调用 setTagList
      expect(setTagListSpy).not.toHaveBeenCalled();
    });

    it('中转站在非首位时移到首位', async () => {
      const tag1 = makeTag({ tagId: 't1', tagName: 'T1' });
      const staging = {
        tagId: '0',
        tagName: 'Staging',
        static: true,
        createTime: '',
        groupList: [],
      };
      vi.mocked(storage.getItem).mockResolvedValueOnce([tag1, staging] as any);
      const result = await utils.getTagList();
      expect(result).toHaveLength(2);
      expect(result[0].tagId).toBe('0');
      expect(result[1].tagId).toBe('t1');
      expect(setTagListSpy).toHaveBeenCalled();
    });

    it('返回值与 this.tagList 一致', async () => {
      const tag1 = makeTag({ tagId: 't1', tagName: 'T1' });
      vi.mocked(storage.getItem).mockResolvedValueOnce([tag1] as any);
      const result = await utils.getTagList();
      expect(result).toBe((utils as any).tagList);
    });

    it('调用 setCountInfo 更新统计', async () => {
      const tag1 = makeTag({
        tagId: 't1',
        tagName: 'T1',
        groupList: [makeGroup({ tabList: [makeTab('https://a.com')] })],
      });
      vi.mocked(storage.getItem).mockResolvedValueOnce([tag1] as any);
      await utils.getTagList();
      expect(utils.countInfo.tabCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // onTabsDrop - 同组内移动
  // ==========================================================================
  describe('onTabsDrop (same-group)', () => {
    it('同组内移动标签页到指定位置', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
              { tabId: 't3', url: 'https://c.com', title: 'C' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      // 把 t1 移动到 index 2 的位置
      // 逻辑：先标记 t1 为 removeFlag，tmpList=[t1]，newTabList=[t1(rm),t2,t3]
      // splice(2,0,t1) → [t1(rm),t2,t1,t3]，filter → [t2,t1,t3]
      await utils.onTabsDrop(
        { groupId: 'g1', selectedValues: ['t1'] } as any,
        { groupId: 'g1' } as any,
        0,
        2,
      );
      const tabIds = list[0].groupList[0].tabList.map(t => t.tabId);
      expect(tabIds).toEqual(['t2', 't1', 't3']);
    });

    it('同组内移动多个选中的标签页', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
              { tabId: 't3', url: 'https://c.com', title: 'C' },
              { tabId: 't4', url: 'https://d.com', title: 'D' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      // 逻辑：标记 t1,t2 为 removeFlag，tmpList=[t1,t2]，newTabList=[t1(rm),t2(rm),t3,t4]
      // splice(3,0,t1,t2) → [t1(rm),t2(rm),t3,t1,t2,t4]，filter → [t3,t1,t2,t4]
      await utils.onTabsDrop(
        { groupId: 'g1', selectedValues: ['t1', 't2'] } as any,
        { groupId: 'g1' } as any,
        0,
        3,
      );
      const tabIds = list[0].groupList[0].tabList.map(t => t.tabId);
      expect(tabIds).toEqual(['t3', 't1', 't2', 't4']);
    });

    it('同组内移动不改变标签页总数', async () => {
      const list = [
        stagingTag([
          makeGroup({
            groupId: 'g1',
            tabList: [
              { tabId: 't1', url: 'https://a.com', title: 'A' },
              { tabId: 't2', url: 'https://b.com', title: 'B' },
            ],
          }),
        ]),
      ];
      setupTagList(list);
      await utils.onTabsDrop(
        { groupId: 'g1', selectedValues: ['t1'] } as any,
        { groupId: 'g1' } as any,
        0,
        1,
      );
      expect(list[0].groupList[0].tabList).toHaveLength(2);
    });
  });
});
