import React, { useMemo, useState, useEffect, useRef } from 'react';
import { theme, Modal } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import { ENUM_COLORS, UNNAMED_TAG, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTreeNodeItem } from './Home.styled';
import { RenderTreeNodeProps } from './types';
import { dndKeys } from './constants';
import EditInput from '../components/EditInput';
import DropComponent from '@/entrypoints/common/components/DropComponent';

const allowDropKey = dndKeys.tabItem;

// 渲染 treeNode 节点
export default function RenderTreeNode({
  node,
  selected,
  container,
  refreshKey,
  onAction,
  onTabItemDrop // 这个 onTabItemDrop 只是为了方便右侧面板的标签页拖拽到左侧树的标签组，左侧树中的 分类和标签组的拖拽由 antd 的 Tree 组件自带实现
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

  // 是否锁定
  const isLocked = useMemo(() => {
    return !!node?.originData?.isLocked;
  }, [node]);

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

  useEffect(() => {
    if (selected && nodeRef.current) {
      nodeRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [container, refreshKey, selected]);

  return (
    // 这个 DropComponent 只是为了方便右侧面板的标签页拖拽到左侧树的标签组，左侧树中的 分类和标签组的拖拽由 antd 的 Tree 组件自带实现
    <DropComponent
      data={{ index: 0, groupId: node.key as string, allowKeys: node.type === 'tag' ? [] : [allowDropKey] }}
      canDrop={node.type === 'tabGroup'}
      onDrop={onTabItemDrop}
    >
      <>
        <StyledTreeNodeItem ref={nodeRef} className="tree-node-item">
          <span style={{ marginRight: '4px' }}>{node.icon}</span>
          <span className="tree-node-title">
            <EditInput
              value={node.title || unnamedNodeName}
              maxLength={20}
              fontSize={14}
              iconSize={14}
              onValueChange={handleRenameChange}
            ></EditInput>
          </span>

          <span className="tree-node-icon-group">
            {node.type === 'tag' && (
              <StyledActionIconBtn
                className="btn-add"
                $size="14"
                title={$fmt('home.createTabGroup')}
                $hoverColor={token.colorPrimaryHover}
                onClick={(e) => handleGroupCreate?.(e)}
              >
                <PlusOutlined />
              </StyledActionIconBtn>
            )}
            {!isLocked && (
              <StyledActionIconBtn
                className="btn-remove"
                $size="14"
                title={$fmt('common.remove')}
                $hoverColor={ENUM_COLORS.red.primary}
                onClick={(e) => onRemoveClick?.(e)}
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
      </>
    </DropComponent>
  );
}
