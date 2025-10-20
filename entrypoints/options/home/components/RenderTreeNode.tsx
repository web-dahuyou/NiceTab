import React, { useMemo, useRef, memo } from 'react';
import { theme } from 'antd';
import { CloseOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { ENUM_COLORS, UNNAMED_TAG, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import EditInput from '~/entrypoints/options/components/EditInput';
import DropComponent from '~/entrypoints/common/components/DropComponent';
import { dndKeys } from '../constants';
import type { RenderTreeNodeProps, TreeDataNodeTabGroup } from '../types';
import { StyledTreeNodeItem } from '../Home.styled';
import { type TreeDataHookProps } from '../hooks/treeData';
import { eventEmitter as homeEventEmitter } from '../hooks/homeCustomEvent';

const allowDropKey = dndKeys.tabItem;

// 渲染 treeNode 节点
function RenderTreeNode({ node, onAction }: RenderTreeNodeProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const nodeRef = useRef<HTMLDivElement>(null);
  const unnamedNodeName = node.type === 'tag' ? UNNAMED_TAG : UNNAMED_GROUP;

  // 是否锁定
  const isLocked = useMemo(() => {
    if (node.type === 'tag') {
      return node.originData?.isLocked;
    }

    return node?.originData?.isLocked || node?.parentData?.isLocked;
  }, [node]);

  // 是否是中转站
  const isStaticTag = useMemo(() => {
    return node.type === 'tag' && !!node?.originData?.static;
  }, [node]);

  const onMoveToClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAction?.({ actionType: node.type, node, actionName: 'moveTo' });
    },
    [onAction],
  );

  const onRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAction?.({ actionType: node.type, node, actionName: 'remove' });
    },
    [onAction],
  );

  const handleGroupCreate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      node.type === 'tag' &&
        onAction?.({ actionType: 'tabGroup', node, actionName: 'create' });
    },
    [onAction],
  );

  const handleRenameChange = useCallback(
    (value?: string) => {
      const fieldKey = node.type === 'tag' ? 'tagName' : 'groupName';
      onAction?.({
        actionType: node.type,
        node,
        actionName: 'rename',
        data: { [fieldKey]: value || unnamedNodeName },
      });
    },
    [onAction],
  );

  // 这个 onTabItemDrop 只是为了方便右侧面板的标签页拖拽到左侧树的标签组，左侧树中的 分类和标签组的拖拽由 antd 的 Tree 组件自带实现
  const onTabItemDrop: TreeDataHookProps['handleTabItemDrop'] = useCallback(
    params => {
      const targetTabListLength =
        (node as TreeDataNodeTabGroup)?.originData?.tabList?.length || 0;
      homeEventEmitter.emit('home:treeDataHook', {
        action: 'handleTabItemDrop',
        params: [
          {
            ...params,
            actionType: 'tab2group',
            targetTabListLength,
          },
        ],
      });
    },
    [node],
  );

  // 编辑状态禁止node节点拖拽
  const handleEditingStatusChange = useCallback((status: boolean) => {
    // console.log('handleEditingStatusChange', status);
    const draggableTreeNode = nodeRef.current?.closest(
      '.nicetab-tree-treenode-draggable',
    );
    draggableTreeNode?.setAttribute('draggable', status ? 'false' : 'true');
    eventEmitter.emit('home:set-editing-status', status);
  }, []);

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    // 这个 DropComponent 只是为了方便右侧面板的标签页拖拽到左侧树的标签组，左侧树中的 分类和标签组的拖拽由 antd 的 Tree 组件自带实现
    <DropComponent
      data={{
        index: 0,
        groupId: node.key as string,
        allowKeys: node.type === 'tag' ? [] : [allowDropKey],
      }}
      canDrop={node.type === 'tabGroup'}
      onDrop={onTabItemDrop}
    >
      <>
        <StyledTreeNodeItem ref={nodeRef} className="tree-node-item">
          <span style={{ marginRight: '4px' }}>{node.icon}</span>
          {isStaticTag ? (
            <span className="tree-node-title static">
              {$fmt('home.stagingArea') || node.title}
            </span>
          ) : (
            <span className="tree-node-title">
              <EditInput
                value={node.title || unnamedNodeName}
                disabled={isLocked}
                visible={!isLocked}
                fontSize={14}
                iconSize={14}
                onValueChange={handleRenameChange}
                onEditingStatusChange={handleEditingStatusChange}
                onClick={handleInputClick}
              ></EditInput>
            </span>
          )}

          <span className="tree-node-icon-group">
            {node.type === 'tag' && !node.originData?.isLocked && (
              <>
                {node.children?.length ? (
                  <StyledActionIconBtn
                    className="btn-send"
                    $size="14"
                    title={$fmt('home.moveAllGroupTo')}
                    $hoverColor={token.colorPrimaryHover}
                    onClick={onMoveToClick}
                  >
                    <SendOutlined />
                  </StyledActionIconBtn>
                ) : null}
                <StyledActionIconBtn
                  className="btn-add"
                  $size="14"
                  title={$fmt('home.createTabGroup')}
                  $hoverColor={token.colorPrimaryHover}
                  onClick={handleGroupCreate}
                >
                  <PlusOutlined />
                </StyledActionIconBtn>
              </>
            )}
            {!isLocked && !isStaticTag && (
              <StyledActionIconBtn
                className="btn-remove"
                $size="14"
                title={$fmt('common.remove')}
                $hoverColor={ENUM_COLORS.red}
                onClick={onRemoveClick}
              >
                <CloseOutlined />
              </StyledActionIconBtn>
            )}
          </span>
        </StyledTreeNodeItem>
      </>
    </DropComponent>
  );
}

export default memo(RenderTreeNode);
