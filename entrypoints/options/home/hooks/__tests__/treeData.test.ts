// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { fakeBrowser } from 'wxt/testing';

// ========== wxt/storage 内存 Mock ==========
// TabListUtils 通过 auto-import 的 storage 读写数据，用内存 Map 代替

const { mockStorageMap } = vi.hoisted(() => ({
  mockStorageMap: new Map<string, any>(),
}));

vi.mock('wxt/storage', () => ({
  storage: {
    getItem: vi.fn(async (key: string) => mockStorageMap.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: any) => {
      mockStorageMap.set(key, value);
    }),
    watch: vi.fn(() => () => {}),
  },
}));

// ========== Mock 浏览器 API 相关模块 ==========

vi.mock('~/entrypoints/common/tabs', () => ({
  openNewTab: vi.fn(),
  openNewGroup: vi.fn(),
}));

vi.mock('~/entrypoints/common/locale', async () => {
  const actual = await vi.importActual<any>('~/entrypoints/common/locale');
  return {
    ...actual,
    getCustomLocaleMessages: () => ({}),
  };
});

// ========== 设置全局 navigator ==========

vi.stubGlobal('navigator', { language: 'en-US' });

// ========== 导入被测模块和依赖 ==========

import { tabListUtils, settingsUtils, stateUtils } from '~/entrypoints/common/storage';
import type { TagItem, GroupItem, TabItem } from '~/entrypoints/types';
import { openNewTab, openNewGroup } from '~/entrypoints/common/tabs';
import { useTreeData, HomeContext, type TreeDataHookProps } from '../treeData';
import type { TreeDataNodeTag, TreeDataNodeTabGroup } from '../../types';

// ========== Mock 数据 ==========

import mockTabListJson from '~/mock/mock_tabList.json';

/**
 * 将 mock_tabList.json 数据转为带 ID 的 TagItem[] 格式
 */
function prepareMockData(): TagItem[] {
  return (mockTabListJson as any[]).map((tag, tagIdx) => ({
    tagId: tagIdx === 0 ? '0' : `tag-${tagIdx}`,
    tagName: tag.tagName,
    createTime: tag.createTime,
    static: tag.static || false,
    groupList: (tag.groupList || []).map((group: any, groupIdx: number) => ({
      groupId: `group-${tagIdx}-${groupIdx}`,
      groupName: group.groupName,
      createTime: group.createTime,
      tabList: (group.tabList || []).map((tab: any, tabIdx: number) => ({
        tabId: `tab-${tagIdx}-${groupIdx}-${tabIdx}`,
        title: tab.title,
        url: tab.url,
      })),
    })),
  }));
}

// ========== 测试包装器 ==========

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      MemoryRouter,
      null,
      React.createElement(IntlProvider, { locale: 'en-US', messages: {} }, children),
    );
  };
}

// ========== 辅助函数 ==========

/** 获取当前 treeData 中第一个 tag */
function getFirstTag(result: { current: TreeDataHookProps }) {
  return result.current.treeData.find(n => n.type === 'tag');
}

/** 获取当前 treeData 中指定 tag 下的第一个 tabGroup */
function getFirstGroup(
  result: { current: TreeDataHookProps },
  tagKey?: string,
): TreeDataNodeTabGroup | undefined {
  const tag = tagKey
    ? result.current.treeData.find(n => n.type === 'tag' && n.key === tagKey)
    : getFirstTag(result);
  return tag?.children?.[0] as TreeDataNodeTabGroup | undefined;
}

// ========== 测试用例 ==========

describe('treeData', () => {
  beforeEach(async () => {
    // 1. 清空 fakeBrowser 内存存储
    fakeBrowser.reset();
    // 2. 配置 browser.windows.getCurrent 返回 mock 窗口
    const mockGetCurrent = fakeBrowser.windows.getCurrent as any;
    if (typeof mockGetCurrent?.mockResolvedValue === 'function') {
      mockGetCurrent.mockResolvedValue({ id: 1 });
    } else {
      vi.spyOn(fakeBrowser.windows as any, 'getCurrent').mockResolvedValue({ id: 1 });
    }
    // 3. 清空 wxt/storage mock
    mockStorageMap.clear();
    // 4. 清空所有 vi.fn() mock 的调用记录
    vi.clearAllMocks();
    // 5. 加载 mock 数据到存储
    const mockData = prepareMockData();
    await tabListUtils.importTags(mockData, 'overwrite');
    // 6. 确保数据就绪（含中转站）
    await tabListUtils.getTagList();
  });

  // ==========================================================================
  // 初始状态
  // ==========================================================================
  describe('初始状态', () => {
    it('init 完成后 treeData 应包含 mock 数据', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // mock_tabList.json 有 2 个 tag（含中转站）
      expect(result.current.treeData.length).toBeGreaterThanOrEqual(2);
      expect(result.current.treeData[0].title).toBe('Staging Area');
    });

    it('init 完成后 tagList 应包含 mock 数据', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tagList.length).toBeGreaterThanOrEqual(2);
    });

    it('init 完成后 countInfo 应正确统计', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 验证统计数值与实际数据一致
      const { tagList, countInfo } = result.current;
      expect(countInfo).toBeDefined();
      expect(countInfo!.tagCount).toBe(tagList.length);
      const totalGroups = tagList.reduce((sum, t) => sum + (t.groupList?.length || 0), 0);
      expect(countInfo!.groupCount).toBe(totalGroups);
      const totalTabs = tagList.reduce(
        (sum, t) =>
          sum + (t.groupList?.reduce((s, g) => s + (g.tabList?.length || 0), 0) || 0),
        0,
      );
      expect(countInfo!.tabCount).toBe(totalTabs);
    });

    it('初始 expandedKeys 应包含第一个 tag 的 key', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // init 自动选中第一个 tag 并展开
      const firstTagKey = result.current.treeData.find(n => n.type === 'tag')?.key;
      expect(firstTagKey).toBeDefined();
      expect(result.current.expandedKeys).toContain(firstTagKey);
    });

    it('初始 selectedKeys 应非空', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // init 自动选中第一个 tag 或 tabGroup
      expect(result.current.selectedKeys.length).toBeGreaterThanOrEqual(1);
      expect(result.current.selectedTagKey).toBeTruthy();
    });
  });

  // ==========================================================================
  // toggleExpand
  // ==========================================================================
  describe('toggleExpand', () => {
    it('toggleExpand(true) 应展开所有 tag 节点', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.toggleExpand(true);
      });

      const tagKeys = result.current.treeData
        .filter(n => n.type === 'tag')
        .map(n => n.key);
      expect(result.current.expandedKeys).toEqual(tagKeys);
    });

    it('toggleExpand(false) 应折叠所有节点', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 先展开
      act(() => {
        result.current.toggleExpand(true);
      });
      expect(result.current.expandedKeys.length).toBeGreaterThan(0);

      // 再折叠
      act(() => {
        result.current.toggleExpand(false);
      });
      expect(result.current.expandedKeys).toEqual([]);
    });
  });

  // ==========================================================================
  // handleMoreItemClick
  // ==========================================================================
  describe('handleMoreItemClick', () => {
    it('action 为 "clear" 时应清空所有数据', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 确认有数据
      expect(result.current.treeData.length).toBeGreaterThan(0);

      await act(async () => {
        await result.current.handleMoreItemClick('clear');
      });

      // 清空后 treeData 应只剩中转站（或为空）
      const nonStagingTags = result.current.treeData.filter(
        n => !(n.originData as any)?.static,
      );
      expect(nonStagingTags).toHaveLength(0);
    });

    it('action 不为 "clear" 时不应清空数据', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const treeDataBefore = [...result.current.treeData];

      await act(async () => {
        await result.current.handleMoreItemClick('other');
      });

      expect(result.current.treeData.length).toBe(treeDataBefore.length);
    });
  });

  // ==========================================================================
  // handleTagCreate
  // ==========================================================================
  describe('handleTagCreate', () => {
    it('应创建新分类并添加到 treeData', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const countBefore = result.current.treeData.length;

      await act(async () => {
        await result.current.handleTagCreate();
      });

      expect(result.current.treeData.length).toBe(countBefore + 1);
    });
  });

  // ==========================================================================
  // handleTagChange
  // ==========================================================================
  describe('handleTagChange', () => {
    it('应更新分类名称', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 找到非中转站的 tag
      const tag = result.current.treeData.find(
        n => n.type === 'tag' && !(n.originData as any)?.static,
      );
      expect(tag).toBeDefined();

      await act(async () => {
        await result.current.handleTagChange(tag!.key, { tagName: 'Updated Name' });
      });

      // 刷新后验证
      const updatedTag = result.current.treeData.find(n => n.key === tag!.key);
      expect(updatedTag?.title).toBe('Updated Name');
    });
  });

  // ==========================================================================
  // handleTagSort
  // ==========================================================================
  describe('handleTagSort', () => {
    it('按名称升序排序标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 找到有多个 children 的 tag（中转站）
      const tag = result.current.treeData.find(n => (n.children?.length || 0) > 1);
      expect(tag).toBeDefined();
      const groupsBefore = tag!.children!.map(g => g.title);

      await act(async () => {
        await result.current.handleTagSort('name', 'ascending', tag!.key);
      });

      // 验证排序后标签组按名称升序排列（忽略大小写）
      const groupsAfter = result.current.treeData.find(n => n.key === tag!.key)?.children;
      expect(groupsAfter).toBeDefined();
      expect(groupsAfter!.length).toBe(groupsBefore.length);
      const namesAfter = groupsAfter!.map(
        g => (g.title as string)?.toLowerCase?.() || '',
      );
      for (let i = 1; i < namesAfter.length; i++) {
        expect(namesAfter[i].localeCompare(namesAfter[i - 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it('按创建时间降序排序标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = getFirstTag(result);
      const groupsBefore = tag!.children!.map(g => g.title);

      await act(async () => {
        await result.current.handleTagSort('createTime', 'descending', tag!.key);
      });

      // 验证排序后标签组存在且数量不变
      const groupsAfter = result.current.treeData.find(n => n.key === tag!.key)?.children;
      expect(groupsAfter).toBeDefined();
      expect(groupsAfter!.length).toBe(groupsBefore.length);
    });
  });

  // ==========================================================================
  // handleTabGroupCreate
  // ==========================================================================
  describe('handleTabGroupCreate', () => {
    it('应在指定分类下创建新标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = getFirstTag(result);
      const groupCountBefore = tag?.children?.length || 0;

      await act(async () => {
        await result.current.handleTabGroupCreate(tag!.key);
      });

      const updatedTag = result.current.treeData.find(n => n.key === tag!.key);
      expect(updatedTag?.children?.length).toBe(groupCountBefore + 1);
    });
  });

  // ==========================================================================
  // handleTabGroupChange
  // ==========================================================================
  describe('handleTabGroupChange', () => {
    it('应更新标签组名称', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result) as TreeDataNodeTabGroup;
      expect(group).toBeDefined();

      await act(async () => {
        await result.current.handleTabGroupChange(group, {
          groupName: 'Updated Group',
        });
      });

      // 刷新后验证
      const tag = result.current.treeData.find(n => n.key === group!.parentKey);
      const updatedGroup = tag?.children?.find(g => g.key === group!.key);
      expect(updatedGroup?.title).toBe('Updated Group');
    });

    it('缺少 key 时不应更新', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const treeDataBefore = JSON.stringify(result.current.treeData);

      await act(async () => {
        await result.current.handleTabGroupChange(
          {
            key: '',
            parentKey: 'tag1',
            type: 'tabGroup',
            title: '',
            originData: {} as any,
          } as any,
          { groupName: 'Should Not Update' },
        );
      });

      expect(JSON.stringify(result.current.treeData)).toBe(treeDataBefore);
    });
  });

  // ==========================================================================
  // handleTabGroupRemove
  // ==========================================================================
  describe('handleTabGroupRemove', () => {
    it('应删除指定标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      expect(group).toBeDefined();
      const tagKey = group!.parentKey;
      const groupCountBefore =
        result.current.treeData.find(n => n.key === tagKey)?.children?.length || 0;

      await act(async () => {
        await result.current.handleTabGroupRemove(group as any);
      });

      const updatedTag = result.current.treeData.find(n => n.key === tagKey);
      expect(updatedTag?.children?.length).toBe(groupCountBefore - 1);
    });

    it('缺少 key 时不应删除', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const treeDataBefore = JSON.stringify(result.current.treeData);

      await act(async () => {
        await result.current.handleTabGroupRemove({
          key: '',
          parentKey: 'tag1',
          type: 'tabGroup',
          title: '',
          originData: {} as any,
        } as any);
      });

      expect(JSON.stringify(result.current.treeData)).toBe(treeDataBefore);
    });
  });

  // ==========================================================================
  // handleTabGroupDedup
  // ==========================================================================
  describe('handleTabGroupDedup', () => {
    it('应对标签组进行 URL 去重', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 中转站的 Group5 有重复的 URL（styled-components 和 Lerna）
      const stagingTag = result.current.treeData.find(n => n.originData?.static);
      const group5 = stagingTag?.children?.find(
        g => (g as TreeDataNodeTabGroup).originData?.groupName === 'Group5',
      ) as TreeDataNodeTabGroup;

      if (group5) {
        const tabCountBefore = group5.originData.tabList?.length || 0;
        const urlsBefore = group5.originData.tabList?.map((t: any) => t.url) || [];
        const uniqueUrlsBefore = [...new Set(urlsBefore)];

        await act(async () => {
          await result.current.handleTabGroupDedup(group5 as any);
        });

        // 去重后标签数应等于去重前的唯一 URL 数
        const updatedStaging = result.current.treeData.find(
          n => (n.originData as any)?.static,
        );
        const updatedGroup5 = updatedStaging?.children?.find(
          g => (g as TreeDataNodeTabGroup).originData?.groupName === 'Group5',
        ) as TreeDataNodeTabGroup | undefined;
        expect(updatedGroup5).toBeDefined();
        expect(updatedGroup5!.originData.tabList?.length).toBe(uniqueUrlsBefore.length);
      }
    });
  });

  // ==========================================================================
  // handleTabGroupCopy
  // ==========================================================================
  describe('handleTabGroupCopy', () => {
    it('应克隆标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const tagKey = group!.parentKey;
      const groupCountBefore =
        result.current.treeData.find(n => n.key === tagKey)?.children?.length || 0;

      await act(async () => {
        await result.current.handleTabGroupCopy(group!.key as string);
      });

      const updatedTag = result.current.treeData.find(n => n.key === tagKey);
      expect(updatedTag?.children?.length).toBe(groupCountBefore + 1);
    });
  });

  // ==========================================================================
  // handleTabGroupStarredChange
  // ==========================================================================
  describe('handleTabGroupStarredChange', () => {
    it('应切换标签组星标状态', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const wasStarred = (group?.originData as any)?.isStarred || false;

      await act(async () => {
        await result.current.handleTabGroupStarredChange(group as any, !wasStarred);
      });

      // 验证星标状态已切换
      const tag = result.current.treeData.find(n => n.key === group!.parentKey);
      const updatedGroup = tag?.children?.find(
        g => g.key === group!.key,
      ) as TreeDataNodeTabGroup;
      expect(updatedGroup?.originData?.isStarred).toBe(!wasStarred);
    });
  });

  // ==========================================================================
  // handleTabItemRemove
  // ==========================================================================
  describe('handleTabItemRemove', () => {
    it('应删除指定标签页', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const tabs = group?.originData?.tabList || [];
      expect(tabs.length).toBeGreaterThan(0);

      const tabToRemove = tabs[0];

      await act(async () => {
        await result.current.handleTabItemRemove(group!.key, [tabToRemove]);
      });

      // 刷新后验证标签页数量减少
      const tag = result.current.treeData.find(n => n.key === group!.parentKey);
      const updatedGroup = tag?.children?.find(
        g => g.key === group!.key,
      ) as TreeDataNodeTabGroup;
      const updatedTabs = updatedGroup?.originData?.tabList || [];
      expect(updatedTabs.length).toBe(tabs.length - 1);
    });
  });

  // ==========================================================================
  // handleTabItemChange
  // ==========================================================================
  describe('handleTabItemChange', () => {
    it('应更新标签页信息', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const tabs = group?.originData?.tabList || [];
      expect(tabs.length).toBeGreaterThan(0);

      const tabToChange = tabs[0];

      await act(async () => {
        await result.current.handleTabItemChange(
          { parentKey: group!.parentKey, key: group!.key },
          { ...tabToChange, title: 'Updated Title' },
        );
      });

      // 刷新后验证
      const tag = result.current.treeData.find(n => n.key === group!.parentKey);
      const updatedGroup = tag?.children?.find(
        g => g.key === group!.key,
      ) as TreeDataNodeTabGroup;
      const updatedTab = updatedGroup?.originData?.tabList?.find(
        t => t.tabId === tabToChange.tabId,
      );
      expect(updatedTab?.title).toBe('Updated Title');
    });
  });

  // ==========================================================================
  // handleTabItemCopy
  // ==========================================================================
  describe('handleTabItemCopy', () => {
    it('应复制标签页到同一标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const tabs = group?.originData?.tabList || [];
      expect(tabs.length).toBeGreaterThan(0);

      const tabCountBefore = tabs.length;

      await act(async () => {
        await result.current.handleTabItemCopy({
          groupId: group!.key,
          tabs: [tabs[0]],
        });
      });

      // 刷新后验证标签页数量增加
      const tag = result.current.treeData.find(n => n.key === group!.parentKey);
      const updatedGroup = tag?.children?.find(
        g => g.key === group!.key,
      ) as TreeDataNodeTabGroup;
      expect(updatedGroup?.originData?.tabList?.length).toBe(tabCountBefore + 1);
    });
  });

  // ==========================================================================
  // handleTabsSort
  // ==========================================================================
  describe('handleTabsSort', () => {
    it('应按名称排序标签页', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);

      const tabsBefore = group?.originData?.tabList || [];

      await act(async () => {
        await result.current.handleTabsSort({
          tagId: group!.parentKey,
          groupId: group!.key as string,
          sortType: 'ascending',
        });
      });

      // 验证排序后标签页按标题升序排列（localeCompare 匹配组件排序逻辑）
      const tag = result.current.treeData.find(n => n.key === group!.parentKey);
      const updatedGroup = tag?.children?.find(
        g => g.key === group!.key,
      ) as TreeDataNodeTabGroup;
      const tabTitles =
        updatedGroup.originData.tabList?.map(t => t.title)?.filter?.(t => !!t) || [];
      for (let i = 1; i < tabTitles.length; i++) {
        expect(tabTitles[i]!.localeCompare(tabTitles[i - 1]!)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ==========================================================================
  // handleSelect / onSelect
  // ==========================================================================
  describe('handleSelect', () => {
    it('选中 tag 节点时应更新 selectedTagKey', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = result.current.treeData.find(
        n => n.type === 'tag' && !(n.originData as any)?.static,
      );
      expect(tag).toBeDefined();

      act(() => {
        result.current.onSelect([tag!.key], { node: tag! } as any);
      });

      expect(result.current.selectedTagKey).toBe(tag!.key);
      expect(result.current.selectedKeys).toEqual([tag!.key]);
    });

    it('选中 tabGroup 节点时应更新 selectedTabGroupKey', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      expect(group).toBeDefined();

      act(() => {
        result.current.onSelect([group!.key], { node: group! } as any);
      });

      expect(result.current.selectedTabGroupKey).toBe(group!.key);
      expect(result.current.selectedTagKey).toBe(group!.parentKey);
    });

    it('选中 tag 时应将其 key 加入 expandedKeys', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const tag = result.current.treeData.find(
        n => n.type === 'tag' && !(n.originData as any)?.static,
      );

      act(() => {
        result.current.onSelect([tag!.key], { node: tag! } as any);
      });

      expect(result.current.expandedKeys).toContain(tag!.key);
    });
  });

  // ==========================================================================
  // handleTabGroupRestore
  // ==========================================================================
  describe('handleTabGroupRestore', () => {
    it('应调用 openNewGroup 恢复标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      expect(group).toBeDefined();

      await act(async () => {
        await result.current.handleTabGroupRestore(group as any);
      });

      expect(openNewGroup).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // handleTagRestore
  // ==========================================================================
  describe('handleTagRestore', () => {
    it('应恢复分类下所有标签组', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 清空之前的 mock 调用记录
      (openNewGroup as ReturnType<typeof vi.fn>).mockClear();

      const tag = result.current.treeData.find(
        n => n.type === 'tag' && !(n.originData as any)?.static,
      );
      expect(tag).toBeDefined();
      const groupCount = tag?.children?.length || 0;

      await act(async () => {
        await result.current.handleTagRestore(tag!.key);
      });

      // openNewGroup 应被调用 groupCount 次
      expect(openNewGroup).toHaveBeenCalledTimes(groupCount);
    });
  });

  // ==========================================================================
  // handleTabsOpen
  // ==========================================================================
  describe('handleTabsOpen', () => {
    it('单个标签页应调用 openNewTab', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const tab = group?.originData?.tabList?.[0];
      expect(tab).toBeDefined();

      await act(async () => {
        await result.current.handleTabsOpen(
          {
            groupName: group!.title,
            groupId: group!.key as string,
            isLocked: false,
          },
          [tab!],
        );
      });

      expect(openNewTab).toHaveBeenCalledWith(tab!.url, { active: true });
    });

    it('多个标签页应调用 openNewGroup', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const group = getFirstGroup(result);
      const tabs = group?.originData?.tabList || [];
      expect(tabs.length).toBeGreaterThan(1);

      await act(async () => {
        await result.current.handleTabsOpen(
          {
            groupName: group!.title,
            groupId: group!.key as string,
            isLocked: false,
          },
          tabs,
        );
      });

      expect(openNewGroup).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // refreshTreeData
  // ==========================================================================
  describe('refreshTreeData', () => {
    it('应刷新 treeData 和 tagList', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 创建一个新分类
      await act(async () => {
        await result.current.handleTagCreate();
      });

      const countAfter = result.current.treeData.length;

      // refreshTreeData 应同步最新的 tagList
      act(() => {
        result.current.refreshTreeData();
      });

      expect(result.current.treeData.length).toBe(countAfter);
    });

    it('callback 应在刷新后被调用', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const callback = vi.fn();
      act(() => {
        result.current.refreshTreeData(callback);
      });

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(result.current.treeData);
    });
  });

  // ==========================================================================
  // init 初始化逻辑
  // ==========================================================================
  describe('init 初始化逻辑', () => {
    it('init 应加载 tagList 并构建 treeData', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // treeData 应包含 mock 数据中的 tag
      const tagNames = result.current.treeData.map(n => n.title);
      expect(tagNames).toContain('Staging Area');
      expect(tagNames).toContain('Tag-test');
    });

    it('init 应自动选中第一个 tag', async () => {
      const { result } = renderHook(() => useTreeData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 应自动选中某个节点
      expect(result.current.selectedKeys.length).toBeGreaterThan(0);
      expect(result.current.selectedTagKey).toBeTruthy();
    });
  });
});

export default {};
