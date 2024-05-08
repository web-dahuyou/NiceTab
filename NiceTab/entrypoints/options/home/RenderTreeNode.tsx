import React, { useState } from 'react';
import { theme, Modal } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTreeNodeItem } from './Home.styled';
import { RenderTreeNodeProps } from './types';
import EditInput from '../components/EditInput';

// 渲染 treeNode 节点
export default function RenderTreeNode({ node, onAction }: RenderTreeNodeProps) {
  const { token } = theme.useToken();
  const [modalVisible, setModalVisible] = useState(false);
  const removeDesc = `您确定要删除该${node.type === 'tag' ? '分类' : '标签组'}吗？`;
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
      data: { [fieldKey]: value || '未命名' },
    });
  };


  const handleRemove = () => {
    onAction?.({ actionType: node.type, node, actionName: 'remove' });
    setModalVisible(false);
  };
  const handleModalCancel = () => {
    setModalVisible(false);
  };
  return (
    <>
      <StyledTreeNodeItem className="tree-node-item">
        <span className="tree-node-title">
          <EditInput
            value={(node.title as string) || '未命名'}
            maxLength={18}
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
              title="创建标签组"
              $hoverColor={token.colorPrimaryHover}
              onClick={(e) => handleGroupCreate?.(e)}
            >
              <PlusOutlined />
            </StyledActionIconBtn>
          )}
          <StyledActionIconBtn
            className="btn-remove"
            $size="14"
            title="删除"
            $hoverColor={ENUM_COLORS.red.primary}
            onClick={(e) => onRemoveClick?.(e)}
          >
            <CloseOutlined />
          </StyledActionIconBtn>
        </span>
      </StyledTreeNodeItem>

      {modalVisible && (
        <Modal
          title="删除提醒"
          width={400}
          open={modalVisible}
          okText="确认"
          cancelText="取消"
          onOk={handleRemove}
          onCancel={handleModalCancel}
        >
          <div>{removeDesc}</div>
        </Modal>
      )}
    </>
  );
}
