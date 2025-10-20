import { useState, memo, useCallback, useRef, useLayoutEffect } from 'react';
import { debounce } from 'lodash-es';
import { Tree, Button, Input, Empty, Spin } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import { DownOutlined } from '@ant-design/icons';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TagItem, GroupItem } from '~/entrypoints/types';
import type { TreeDataNodeTag, TreeDataNodeUnion, MoveToCallbackProps } from './types';
import { HomeContext, type TreeDataHookProps } from './hooks/treeData';
import { eventEmitter as homeEventEmitter } from './hooks/homeCustomEvent';
import RenderTreeNode from './components/RenderTreeNode';
import {
  useTreeNodeAction,
  RemoveActionModal,
  MoveToActionModal,
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
    closeModal,
  } = useTreeNodeAction(onTreeNodeAction);

  const listRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<any>(null);

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
    if (!value) return treeData;
    const searchTagList =
      tagList.reduce<TagItem[]>((result, tag): TagItem[] => {
        if (tag?.tagName?.toLowerCase().includes(value)) {
          return [...result, tag];
        }

        const groupList =
          tag?.groupList?.reduce<GroupItem[]>((list, group: GroupItem): GroupItem[] => {
            if (group?.groupName?.toLowerCase().includes(value)) {
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
  }, [tagList, treeData, searchValue]);

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

  // 移动所有标签组
  const handleAllTabGroupsMoveTo = async ({ targetData }: MoveToCallbackProps) => {
    refreshTreeData(treeData => {
      const { targetTagId } = targetData || {};
      for (let tag of treeData) {
        if (tag.key == targetTagId) {
          handleSelect(treeData, [targetTagId], { node: tag as TreeDataNodeTag });
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

  const debounceResize = useMemo(
    () =>
      debounce(() => {
        const listHeight = listRef.current?.offsetHeight || 400;
        setTreeBoxHeight(listHeight);
      }, 300),
    [],
  );

  const handleResize = useCallback(() => {
    debounceResize();
  }, [debounceResize]);

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
    const listHeight = listRef.current?.offsetHeight || 400;
    setTreeBoxHeight(listHeight);
    eventEmitter.on('home:set-tree-searchValue', setTreeSearchValue);
    eventEmitter.on('home:set-editing-status', setIsediting);
    window.addEventListener('resize', handleResize);
    return () => {
      eventEmitter.off('home:set-tree-searchValue', setTreeSearchValue);
      eventEmitter.off('home:set-editing-status', setIsediting);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      {/* 列表搜索框 */}
      <Input.Search
        value={searchText}
        style={{ marginBottom: 8 }}
        placeholder={$fmt('home.searchTagAndGroup')}
        allowClear
        onChange={onSearchTextChange}
        onSearch={onSearch}
      />
      <div ref={listRef} className="sidebar-tree-wrapper">
        <Spin spinning={loading} size="large">
          {searchTreeData?.length > 0 ? (
            <Tree
              ref={treeRef}
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
            handleAllTabGroupsMoveTo(...props);
          }}
          onCancel={() => closeModal('moveTo')}
        ></MoveToActionModal>
      )}
    </>
  );
}

export default memo(TreeBox);
