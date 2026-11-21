import { useState, memo, useCallback, useRef, useLayoutEffect } from 'react';
import { Tree, Space, Typography, Button, Checkbox, Input, Empty, Spin } from 'antd';
import type { TreeDataNode } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TagItem, GroupItem } from '~/entrypoints/types';
import type { TreeDataNodeUnion, MoveToCallbackProps } from './types';
import { HomeContext, type TreeDataHookProps } from './hooks/treeData';
import { eventEmitter as homeEventEmitter } from './hooks/homeCustomEvent';
import RenderTreeNode from './components/RenderTreeNode';
import TreeBatchActions from './components/TreeBatchActions';
import {
  useTreeNodeAction,
  RemoveActionModal,
  MoveToActionModal,
  DedupActionModal,
} from './TreeNodeActionModals';
import { getTreeData, checkAllowDrop } from './utils';

function TreeBox() {
  const { $fmt } = useIntlUtls();
  const { treeDataHook } = useContext(HomeContext);
  const {
    loading,
    tagList,
    treeData,
    selectedKeys,
    expandedKeys,
    setExpandedKeys,
    refreshKey,
    handleSelect,
    onSelect,
    onTreeNodeAction,
    toggleExpand,
    refreshTreeData,
    handleTagCreate,
  } = treeDataHook || {};

  const {
    onAction: handleTreeNodeAction,
    actionParams: treeNodeActionParams,
    removeModalVisible,
    moveToModalVisible,
    dedupModalVisible,
    closeModal,
  } = useTreeNodeAction(onTreeNodeAction);

  const listRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<any>(null);

  const [checkedGroupIds, setCheckedGroupIds] = useState<string[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);
  const [filterList, setFilterList] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [isEditing, setIsediting] = useState<boolean>(false);
  const [treeBoxHeight, setTreeBoxHeight] = useState<number>(400);

  useLayoutEffect(() => {
    setTimeout(() => {
      treeRef.current?.scrollTo({ key: selectedKeys[0], offset: 80 });
    }, 100);
  }, [refreshKey, selectedKeys]);

  const setSearchTextValue = useCallback((value: string) => {
    setSearchText(value);
    setSearchValue(value);
    setCheckedGroupIds([]);
  }, []);

  const onSearch = useCallback(
    (value: string) => {
      const text = value?.trim().toLowerCase();
      setSearchTextValue(text);
      setTimeout(() => {
        if (text) toggleExpand(true);
      }, 30);
    },
    [setSearchTextValue, toggleExpand],
  );

  const onFilterChange = useCallback((values: string[]) => {
    setFilterList(values);
    setCheckedGroupIds([]);
  }, []);

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target?.value?.trim().toLowerCase();
      setSearchText(text);
      if (!text) {
        onSearch?.(text);
      }
    },
    [onSearch],
  );

  // 搜索过滤后的 treeData
  const searchTreeData = useMemo(() => {
    const value = searchValue?.trim().toLowerCase();
    if (!value && !filterList?.length) return treeData;
    const isLocked = filterList.includes('isLocked');
    const isStarred = filterList.includes('isStarred');
    const searchTagList =
      tagList.reduce<TagItem[]>((result, tag): TagItem[] => {
        if (tag?.tagName?.toLowerCase().includes(value) && !isLocked && !isStarred) {
          return [...result, tag];
        }

        const groupList =
          tag?.groupList?.reduce<GroupItem[]>((list, group: GroupItem): GroupItem[] => {
            const isMatch =
              (!isLocked || group?.isLocked) && (!isStarred || group?.isStarred);
            if (group?.groupName?.toLowerCase().includes(value) && isMatch) {
              return [...list, group];
            }
            return list;
          }, []) || [];
        if (groupList?.length > 0) {
          return [...result, { ...tag, groupList }];
        } else {
          return result;
        }
      }, []) || [];
    return getTreeData(searchTagList);
  }, [tagList, treeData, filterList, searchValue]);

  const visibleGroups = useMemo(
    () => searchTreeData.flatMap(tag => tag.children || []),
    [searchTreeData],
  );
  const checkedKeys = useMemo(() => {
    const groups = visibleGroups.filter(group =>
      checkedGroupIds.includes(String(group.key)),
    );
    const tags = searchTreeData.filter(
      tag =>
        tag.children?.length &&
        tag.children.every(group => checkedGroupIds.includes(String(group.key))),
    );
    return [...groups, ...tags].map(node => node.key);
  }, [searchTreeData, visibleGroups, checkedGroupIds]);
  const selectedGroupIds = visibleGroups
    .filter(group => checkedGroupIds.includes(String(group.key)))
    .map(group => String(group.key));

  useEffect(() => {
    setCheckedGroupIds(ids =>
      ids.filter(id => visibleGroups.some(group => String(group.key) === id)),
    );
  }, [visibleGroups]);

  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setTreeBoxHeight(element.clientHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 判断节点是否可拖拽
  const isNodeDraggable = useCallback(
    (node: TreeDataNode) => {
      const _node = node as TreeDataNodeUnion;
      // 中转站分类不可拖拽
      if (
        _node.type === 'tag' &&
        _node.originData?.static &&
        _node.originData?.isLocked
      ) {
        return false;
      }
      if (_node.type === 'tabGroup' && _node.parentData?.isLocked) {
        return false;
      }
      if (isEditing) return false;
      return true;
    },
    [isEditing],
  );

  const draggableConfig = useMemo(() => {
    return { icon: false, nodeDraggable: isNodeDraggable };
  }, [isNodeDraggable]);

  const titleRender = useCallback(
    (node: TreeDataNodeUnion) => (
      <RenderTreeNode node={node} onAction={handleTreeNodeAction} />
    ),
    [handleTreeNodeAction],
  );

  // 移动标签组
  const handleTabGroupMoveTo = async ({ targetData }: MoveToCallbackProps) => {
    refreshTreeData(treeData => {
      const { targetTagId, targetGroupId } = targetData || {};
      for (let tag of treeData) {
        if (tag.key == targetTagId) {
          if (targetGroupId) {
            for (let g of tag.children || []) {
              if (g.key == targetGroupId) {
                handleSelect(treeData, [targetTagId, targetGroupId], {
                  node: g as TreeDataNodeUnion,
                });
                break;
              }
            }
          } else {
            handleSelect(treeData, [targetTagId], { node: tag as TreeDataNodeUnion });
          }

          break;
        }
      }
    });
  };

  // 阻止右键默认行为
  const onRightClick = useCallback(
    ({ event, node }: { event: React.MouseEvent; node: TreeDataNodeUnion }) => {
      event?.preventDefault();
      event?.stopPropagation();
      // console.log('onRightClick--node', node)
      // TODO 添加右键菜单
    },
    [],
  );

  // treeNode 拖拽
  const handleTreeNodeDrop: TreeDataHookProps['handleTreeNodeDrop'] = useCallback(
    (...params) => {
      homeEventEmitter.emit('home:treeDataHook', {
        action: 'handleTreeNodeDrop',
        params,
      });
    },
    [],
  );

  const setTreeSearchValue = useCallback(
    ({ value, callback }: { value: string; callback?: () => void }) => {
      setSearchTextValue(value);
      setTimeout(() => {
        callback?.();
      }, 100);
    },
    [setSearchTextValue],
  );

  useEffect(() => {
    eventEmitter.on('home:set-tree-searchValue', setTreeSearchValue);
    eventEmitter.on('home:set-editing-status', setIsediting);
    return () => {
      eventEmitter.off('home:set-tree-searchValue', setTreeSearchValue);
      eventEmitter.off('home:set-editing-status', setIsediting);
    };
  }, []);

  return (
    <>
      <Space size={8} direction="vertical" style={{ flexShrink: 0 }}>
        <Space size={12}>
          <Typography.Text>{$fmt('common.filter')}:</Typography.Text>
          <Checkbox.Group
            options={[
              { label: $fmt('common.starred'), value: 'isStarred' },
              { label: $fmt('common.locked'), value: 'isLocked' },
            ]}
            value={filterList}
            onChange={onFilterChange}
          ></Checkbox.Group>
        </Space>

        {/* 列表搜索框 */}
        <Input.Search
          value={searchText}
          style={{ marginBottom: 8 }}
          placeholder={$fmt('home.searchTagAndGroup')}
          allowClear
          onChange={onSearchTextChange}
          onSearch={onSearch}
        />
      </Space>
      <TreeBatchActions
        groupIds={selectedGroupIds}
        total={visibleGroups.length}
        onSelectAll={checked =>
          setCheckedGroupIds(checked ? visibleGroups.map(group => String(group.key)) : [])
        }
        onProcessed={ids =>
          setCheckedGroupIds(current => current.filter(id => !ids.includes(id)))
        }
        onBusyChange={setBatchBusy}
      />
      <div ref={listRef} className="sidebar-tree-wrapper">
        <Spin spinning={loading} size="large">
          {searchTreeData?.length > 0 ? (
            <Tree
              ref={treeRef}
              checkable
              checkedKeys={checkedKeys}
              onCheck={keys => {
                if (batchBusy) return;
                const checked = Array.isArray(keys) ? keys : keys.checked;
                setCheckedGroupIds(
                  visibleGroups
                    .filter(group => checked.includes(group.key))
                    .map(group => String(group.key)),
                );
              }}
              virtual={true}
              height={treeBoxHeight}
              draggable={draggableConfig}
              allowDrop={checkAllowDrop}
              blockNode
              switcherIcon={<DownOutlined />}
              autoExpandParent
              defaultExpandAll
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              treeData={searchTreeData}
              titleRender={titleRender}
              onExpand={setExpandedKeys}
              onSelect={onSelect}
              onDrop={handleTreeNodeDrop}
              onRightClick={onRightClick}
            />
          ) : (
            <div className="no-data">
              <Empty description={$fmt('home.emptyTip')}>
                <Button type="primary" size="small" onClick={handleTagCreate}>
                  {$fmt('home.addTag')}
                </Button>
              </Empty>
            </div>
          )}
        </Spin>
      </div>

      {/* 左侧列表分类和标签组删除 */}
      {removeModalVisible && (
        <RemoveActionModal
          open={removeModalVisible}
          actionParams={treeNodeActionParams}
          onOk={(...props) => {
            closeModal('remove');
            onTreeNodeAction(...props);
          }}
          onCancel={() => closeModal('remove')}
        ></RemoveActionModal>
      )}

      {/* 移动到弹窗 */}
      {moveToModalVisible && (
        <MoveToActionModal
          open={moveToModalVisible}
          actionParams={treeNodeActionParams}
          onOk={(...props) => {
            closeModal('moveTo');
            handleTabGroupMoveTo(...props);
          }}
          onCancel={() => closeModal('moveTo')}
        ></MoveToActionModal>
      )}

      {/* 标签组去重确认弹窗 */}
      {dedupModalVisible && (
        <DedupActionModal
          open={dedupModalVisible}
          actionParams={treeNodeActionParams}
          onOk={(...props) => {
            closeModal('dedup');
            onTreeNodeAction(...props);
          }}
          onCancel={() => closeModal('dedup')}
        ></DedupActionModal>
      )}
    </>
  );
}

export default memo(TreeBox);
