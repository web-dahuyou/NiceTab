import React, { useMemo, useState, useRef } from 'react';
import { theme, Modal } from 'antd';
import { CloseOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { ENUM_COLORS, UNNAMED_TAG, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTreeNodeItem } from './Home.styled';
import { RenderTreeNodeProps } from './types';
import { dndKeys } from './constants';
import EditInput from '../components/EditInput';
import DropComponent from '@/entrypoints/common/components/DropComponent';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';

const allowDropKey = dndKeys.tabItem;

// 渲染 treeNode 节点
export default function RenderTreeNode({
  node,
  // selected,
  // container,
  // refreshKey,
  // virtual = false,
  onAction,
  onTabItemDrop, // 这个 onTabItemDrop 只是为了方便右侧面板的标签页拖拽到左侧树的标签组，左侧树中的 分类和标签组的拖拽由 antd 的 Tree 组件自带实现
  onMoveTo,
}: RenderTreeNodeProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const removeDesc = $fmt({
    id: 'home.removeDesc',
    values: { type: $fmt(`home.${node.type || 'tag'}`) },
  });
  const unnamedNodeName = node.type === 'tag' ? UNNAMED_TAG : UNNAMED_GROUP;

  const {
    modalVisible: moveToModalVisible,
    openModal: openMoveToModal,
    onConfirm: onMoveToConfirm,
    onClose: onMoveToClose,
    moveData,
  } = useMoveTo();

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
    openMoveToModal?.({ tagId: node.key as string });
  };
  const onRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalVisible(true);
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

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.({ actionType: node.type, node, actionName: 'remove' });
    setModalVisible(false);
  };
  const handleModalCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalVisible(false);
  };

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
              ></EditInput>
            </span>
          )}

          <span className="tree-node-icon-group">
            {node.type === 'tag' && (
              <>
                <StyledActionIconBtn
                  className="btn-add"
                  $size="14"
                  title={$fmt('home.moveAllGroupTo')}
                  $hoverColor={token.colorPrimaryHover}
                  onClick={onMoveToClick}
                >
                  <SendOutlined />
                </StyledActionIconBtn>
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

        {modalVisible && (
          <Modal
            title={$fmt('home.removeTitle')}
            width={400}
            open={modalVisible}
            onOk={handleRemove}
            onCancel={handleModalCancel}
          >
            <div>{removeDesc}</div>
          </Modal>
        )}

        {/* 移动到弹窗 */}
        {moveToModalVisible && (
          <MoveToModal
            visible={moveToModalVisible}
            moveData={moveData}
            onOk={(targetData) => {
              onMoveToConfirm(() => {
                onMoveTo?.({ targetData });
              });
            }}
            onCancel={onMoveToClose}
          />
        )}
      </>
    </DropComponent>
  );
}
