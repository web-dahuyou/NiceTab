import { memo, useMemo, useContext } from 'react';
import { Typography } from 'antd';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TabItem } from '~/entrypoints/types';
import type { TreeDataNodeTag, TreeDataNodeTabGroup, MoveToCallbackProps } from './types';
import TabGroup from './TabGroup';
import { HomeContext } from './hooks/treeData';
import { getSelectedCounts } from './utils';


const ListItem = memo(
  ({ tabGroup, virtual }: { tabGroup: TreeDataNodeTabGroup; virtual?: boolean }) => {
    const { treeDataHook } = useContext(HomeContext);
    const {
      selectedTagKey,
      selectedTabGroupKey,
      refreshKey,
      handleSelect,
      refreshTreeData,
      handleTabGroupRemove,
      handleTabGroupChange,
      handleTabGroupStarredChange,
      handleTabGroupDedup,
      handleTabGroupRestore,
      handleTabItemDrop,
      handleTabItemChange,
      handleTabItemRemove,
    } = treeDataHook;

    // 移动单个标签组
    const handleTabGroupMoveTo = async ({
      moveData,
      targetData,
      selected,
    }: MoveToCallbackProps) => {
      refreshTreeData((treeData) => {
        if (selected) {
          const { groupId, tabs } = moveData || {};
          const { targetTagId, targetGroupId } = targetData || {};
          if (!groupId) return;
          // 如果是移动标签页的话，则不需要重新选择标签组
          if (tabs && tabs?.length > 0) return;
          if (!targetTagId) return;

          let group = null;
          for (let tag of treeData) {
            if (!!targetTagId && tag.key !== targetTagId) continue;
            if (!targetGroupId) {
              handleSelect(treeData, [targetTagId], { node: tag as TreeDataNodeTag });
              break;
            }
            for (let g of tag.children || []) {
              if (g.key === targetGroupId) {
                group = g;
                break;
              }
            }
          }
          group &&
            handleSelect(treeData, [groupId], { node: group as TreeDataNodeTabGroup });
        }
      });
    };

    return (
      <TabGroup
        key={tabGroup.key}
        selected={tabGroup.key === selectedTabGroupKey}
        refreshKey={
          !virtual && tabGroup.key === selectedTabGroupKey ? refreshKey : undefined
        }
        {...tabGroup.originData}
        onChange={(data) => handleTabGroupChange(tabGroup, data)}
        onRemove={() =>
          handleTabGroupRemove(tabGroup, selectedTagKey, selectedTabGroupKey)
        }
        onRestore={() => handleTabGroupRestore(tabGroup)}
        onStarredChange={(isStarred) => handleTabGroupStarredChange(tabGroup, isStarred)}
        onDedup={() => handleTabGroupDedup(tabGroup)}
        onDrop={handleTabItemDrop}
        onTabChange={(tabItem: TabItem) => handleTabItemChange(tabGroup, tabItem)}
        onTabRemove={handleTabItemRemove}
        onMoveTo={handleTabGroupMoveTo}
      ></TabGroup>
    );
  }
);

export default function TabGroupList({ virtual }: { virtual?: boolean }) {
  const { $fmt } = useIntlUtls();
  const { treeDataHook } = useContext(HomeContext);
  const { selectedTagKey, selectedTabGroupKey, selectedTag, refreshKey } = treeDataHook;
  const selectedTabGroupRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    return getSelectedCounts(selectedTag.originData);
  }, [selectedTag.originData]);

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const [prevSelectedTagKey, setPrevSelectedTagKey] = useState(selectedTagKey);
  const scrollHandler = useCallback(() => {
    if (virtual && virtuosoRef.current) {
      const index = selectedTag?.children?.findIndex(
        (group) => group.key === selectedTabGroupKey
      );
      virtuosoRef.current?.scrollToIndex({
        index: index || 0,
        align: 'center',
        behavior: 'auto',
      });
    } else if (!virtual && selectedTabGroupRef.current) {
      // const offsetTop = selectedTabGroupRef.current?.offsetTop || 0;
      // window.scrollTo({ top: offsetTop - 100, behavior: 'instant' });

      const pagePaddingTop = 100
      const body = document.documentElement || document.body;
      const scrollTop = body.scrollTop;
      const groupTop = selectedTabGroupRef.current?.offsetTop || 0;
      if (groupTop < scrollTop + pagePaddingTop) {
        body.scrollTo(0, groupTop - pagePaddingTop - 60);
      } else if (groupTop + pagePaddingTop + 80 > window.innerHeight + scrollTop) {
        body.scrollTo(0, groupTop + pagePaddingTop - window.innerHeight + 300);
      }
    }
  }, [selectedTag, selectedTabGroupKey, refreshKey]);

  useEffect(() => {
    if (selectedTagKey === prevSelectedTagKey) {
      scrollHandler();
    } else {
      setTimeout(() => {
        setPrevSelectedTagKey(selectedTagKey);
        scrollHandler();
      }, 100);
    }
  }, [selectedTagKey, selectedTabGroupKey, refreshKey]);

  return (
    <div className="content">
      {virtual && (
        <div className="tip">
          <Typography.Text type="warning">{$fmt('home.tip.tooManyTabs')}</Typography.Text>
        </div>
      )}
      <div className="count-info">
        <span className="count-item">{$fmt('home.tag.countInfo')}：</span>
        <span className="count-item">
          {$fmt('home.tabGroup')} ({counts?.groupCount})
        </span>
        <span className="count-item">
          {$fmt('home.tab')} ({counts?.tabCount})
        </span>
      </div>

      {virtual ? (
        <Virtuoso
          ref={virtuosoRef}
          useWindowScroll
          overscan={12}
          increaseViewportBy={{ top: 400, bottom: 200 }}
          data={selectedTag?.children || []}
          itemContent={(index, tabGroup) => <ListItem tabGroup={tabGroup}></ListItem>}
        />
      ) : (
        (selectedTag?.children as TreeDataNodeTabGroup[])?.map(
          (tabGroup: TreeDataNodeTabGroup) =>
            tabGroup?.originData && (
              <div ref={tabGroup.key === selectedTabGroupKey ? selectedTabGroupRef : null} key={tabGroup.key}>
                <ListItem tabGroup={tabGroup} virtual={virtual}></ListItem>
              </div>
            )
        )
      )}
    </div>
  );
}
