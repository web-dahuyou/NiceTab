import { useState, memo, useCallback, useRef, useLayoutEffect } from 'react';
import { Tree, Button, Input, Empty, Spin } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import type { SearchProps } from 'antd/es/input/Search';
import { DownOutlined } from '@ant-design/icons';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TagItem, GroupItem } from '~/entrypoints/types';
import type {
  TreeDataNodeTag,
  TreeDataNodeUnion,
  MoveToCallbackProps,
} from './types';
import { HomeContext } from './hooks/treeData';
import RenderTreeNode from './RenderTreeNode';
import {
  useTreeNodeAction,
  RemoveActionModal,
  MoveToActionModal,
} from './TreeNodeActionModals';
import { getTreeData } from './utils';

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
    handleTreeNodeDrop,
    handleTabItemDrop,
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

  const [searchValue, setSearchValue] = useState<string>('');
  const [isEditing, setIsediting] = useState<boolean>(false);
  const [treeBoxHeight, setTreeBoxHeight] = useState<number>(400);

  useLayoutEffect(() => {
    setTimeout(() => {
      treeRef.current?.scrollTo({ key: selectedKeys[0], offset: 80 });
    }, 100);
  }, [refreshKey, selectedKeys]);

  const onSearch: SearchProps['onSearch'] = (value) => {
    const text = value?.trim().toLowerCase();
    setSearchValue(text);
    setTimeout(() => {
      toggleExpand(!!text);
    }, 30);
  };
  const onSearchTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target?.value?.trim().toLowerCase();
    if (!text) {
      onSearch?.(text);
    }
  }, []);

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
  }, [tagList, searchValue]);

  // 判断节点是否可拖拽
  const isNodeDraggable = useCallback((node: TreeDataNode) => {
    const _node = node as TreeDataNodeUnion;
    // 中转站分类不可拖拽
    if (_node.type === 'tag' && _node?.originData?.static) return false;
    if (isEditing) return false;
    return true;
  }, []);

  // 判断能否拖拽到节点上
  const checkAllowDrop: TreeProps<TreeDataNodeUnion>['allowDrop'] = ({
    dragNode,
    dropNode,
    dropPosition,
  }) => {
    // console.log('checkAllowDrop--dragNode', dragNode)
    // console.log('checkAllowDrop--dropNode', dropNode)
    // console.log('checkAllowDrop--dropPosition', dropPosition)

    // dropPosition = 0 时表示，拖放到目标 node 的子集
    // dropPosition = 1 时表示，拖放到目标 node 的同级之后
    // dropPosition = -1 时表示，拖放到目标 node 的同级之前
    if (
      (dragNode.type === 'tag' && dragNode?.originData?.static) ||
      (dropNode.type === 'tag' && dropNode?.originData?.static && dropPosition == -1)
    ) {
      // 中转站永远置顶，不允许其他分类排到它前面
      return false;
    }

    return (
      (dragNode.type === 'tabGroup' && dropNode.type === 'tabGroup') ||
      (dragNode.type === 'tag' && dropNode.type === 'tag' && dropPosition !== 0) ||
      (dragNode.type === 'tabGroup' && dropNode.type === 'tag' && dropPosition >= 0)
    );
  };

  // 移动所有标签组
  const handleAllTabGroupsMoveTo = async ({ targetData }: MoveToCallbackProps) => {
    refreshTreeData((treeData) => {
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
  const onRightClick: TreeProps<TreeDataNodeUnion>['onRightClick'] = ({
    event,
    node,
  }) => {
    event?.preventDefault();
    event?.stopPropagation();
    // console.log('onRightClick--node', node)
    // TODO 添加右键菜单
  };

  useEffect(() => {
    const listHeight = listRef.current?.offsetHeight || 400;
    setTreeBoxHeight(listHeight);
    eventEmitter.on('home:set-tree-searchValue', setSearchValue);
    eventEmitter.on('home:set-editing-status', setIsediting);
    return () => {
      eventEmitter.off('home:set-tree-searchValue', setSearchValue);
      eventEmitter.off('home:set-editing-status', setIsediting);
    }
  }, []);

  return (
    <>
      {/* 列表搜索框 */}
      <Input.Search
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
              draggable={{ icon: false, nodeDraggable: isNodeDraggable }}
              allowDrop={checkAllowDrop}
              blockNode
              switcherIcon={<DownOutlined />}
              autoExpandParent
              defaultExpandAll
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              treeData={searchTreeData}
              titleRender={(node) => (
                <RenderTreeNode
                  node={node}
                  onAction={handleTreeNodeAction}
                  onTabItemDrop={handleTabItemDrop}
                ></RenderTreeNode>
              )}
              onExpand={(expandedKeys) => setExpandedKeys(expandedKeys)}
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
      { removeModalVisible && (
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
      { moveToModalVisible && (
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
