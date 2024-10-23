import React, { useMemo, useState, useRef, memo } from 'react';
import { theme } from 'antd';
import { CloseOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { ENUM_COLORS, UNNAMED_TAG, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTreeNodeItem } from './Home.styled';
import { RenderTreeNodeProps } from './types';
import { dndKeys } from './constants';
import EditInput from '../components/EditInput';
import DropComponent from '@/entrypoints/common/components/DropComponent';

const allowDropKey = dndKeys.tabItem;

// 渲染 treeNode 节点
function RenderTreeNode({
  node,
  onAction,
  onTabItemDrop, // 这个 onTabItemDrop 只是为了方便右侧面板的标签页拖拽到左侧树的标签组，左侧树中的 分类和标签组的拖拽由 antd 的 Tree 组件自带实现
}: RenderTreeNodeProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const nodeRef = useRef<HTMLDivElement>(null);
  const unnamedNodeName = node.type === 'tag' ? UNNAMED_TAG : UNNAMED_GROUP;

  // 是否锁定
  const isLocked = useMemo(() => {
    return !!node?.originData?.isLocked;
  }, [node]);

  // 是否是中转站
  const isStaticTag = useMemo(() => {
    return node.type === 'tag' && !!node?.originData?.static;
  }, [node]);

  const onMoveToClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.({ actionType: node.type, node, actionName: 'moveTo' });
  };
  const onRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.({ actionType: node.type, node, actionName: 'remove' });
  };
  const handleGroupCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    node.type === 'tag' &&
      onAction?.({ actionType: 'tabGroup', node, actionName: 'create' });
  };
  const handleRenameChange = (value?: string) => {
    const fieldKey = node.type === 'tag' ? 'tagName' : 'groupName';
    onAction?.({
      actionType: node.type,
      node,
      actionName: 'rename',
      data: { [fieldKey]: value || unnamedNodeName },
    });
  };

  // 编辑状态禁止node节点拖拽
  const handleEditingStatusChange = useCallback((status: boolean) => {
    // console.log('handleEditingStatusChange', status);
    const draggableTreeNode = nodeRef.current?.closest('.ant-tree-treenode-draggable');
    draggableTreeNode?.setAttribute('draggable', status ? 'false' : 'true');
    eventEmitter.emit('home:set-editing-status', status);
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
                maxLength={20}
                fontSize={14}
                iconSize={14}
                onValueChange={handleRenameChange}
                onEditingStatusChange={handleEditingStatusChange}
              ></EditInput>
            </span>
          )}

          <span className="tree-node-icon-group">
            {node.type === 'tag' && (
              <>
                { node.children?.length ? (
                  <StyledActionIconBtn
                    className="btn-add"
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
