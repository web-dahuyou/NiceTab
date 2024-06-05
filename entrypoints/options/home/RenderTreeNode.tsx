import React, { useMemo, useState } from 'react';
import { theme, Modal } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTreeNodeItem } from './Home.styled';
import { RenderTreeNodeProps } from './types';
import EditInput from '../components/EditInput';

// 渲染 treeNode 节点
export default function RenderTreeNode({ node, onAction }: RenderTreeNodeProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [modalVisible, setModalVisible] = useState(false);
  const removeDesc = $fmt({ id: 'home.removeDesc', values: { type: $fmt(`home.${node.type || 'tag'}`) }});
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
      data: { [fieldKey]: value || 'Unnamed' },
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
    <>
      <StyledTreeNodeItem className="tree-node-item">
        <span style={{ marginRight: '4px' }}>{ node.icon }</span>
        <span className="tree-node-title">
          <EditInput
            value={node.title || 'Unnamed'}
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
              title={$fmt('home.addTabGroup')}
              $hoverColor={token.colorPrimaryHover}
              onClick={(e) => handleGroupCreate?.(e)}
            >
              <PlusOutlined />
            </StyledActionIconBtn>
          )}
          { !isLocked && (
            <StyledActionIconBtn
              className="btn-remove"
              $size="14"
              title={$fmt('common.remove')}
              $hoverColor={ENUM_COLORS.red.primary}
              onClick={(e) => onRemoveClick?.(e)}
            >
              <CloseOutlined />
            </StyledActionIconBtn>
          ) }
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
  );
}