import React, { useRef, useState } from 'react';
import { Modal, Input } from 'antd';
import type { InputRef } from 'antd';
import { CloseOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTreeNodeItem } from './Home.styled';
import { RenderTreeNodeProps } from './types';

// 渲染 treeNode 节点
export default function RenderTreeNode({ node, onAction }: RenderTreeNodeProps) {
  const inputRef = useRef<InputRef>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState(node.title as string);
  const desc = `您确定要删除该${node.type === 'tag' ? '分类' : '标签组'}吗？`;
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('handleRemove');
    onAction?.({ actionType: node.type, node, actionName: 'remove' });
  };
  const handleGroupCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    node.type === 'tag' &&
      onAction?.({ actionType: 'tabGroup', node, actionName: 'create' });
  };
  const handleRenameClick = (e: React.MouseEvent) => {

  };

  // const handleRenameClick = (e: React.MouseEvent) => {
  //   setInputValue((node?.title as string) || '');
  //   setRenameModalVisible(true);
  //   setTimeout(() => {
  //     inputRef?.current?.focus();
  //   }, 10);
  // };

  // const onPressEnter = () => {
  //   const newValue = inputRef?.current?.input?.value || '';
  //   console.log('onPressEnter--inputValue', inputValue)
  //   console.log('onPressEnter--newValue', newValue)
  //   // handleModalOk();
  // }
  // const handleModalOk = () => {
  //   const titleKey = node.type === 'tag' ? 'tagName' : 'groupName';
  //   onAction?.({
  //     actionType: node.type,
  //     node,
  //     actionName: 'rename',
  //     data: { [titleKey]: inputValue },
  //   });
  //   setRenameModalVisible(false);
  // };
  // const handleModalCancel = () => {
  //   setRenameModalVisible(false);
  // };
  return (
    <>
      <StyledTreeNodeItem className="tree-node-item">
        <span className="tree-node-title">{node.title as string}</span>
        <span className="tree-node-icon-group">

          <StyledActionIconBtn $size="14" onClick={handleRenameClick}>
            <EditOutlined />
          </StyledActionIconBtn>
          {node.type === 'tag' && (
            <StyledActionIconBtn
              className="btn-add"
              $size="14"
              title="创建标签组"
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
            onClick={(e) => handleRemove?.(e)}
          >
            <CloseOutlined />
          </StyledActionIconBtn>
        </span>
      </StyledTreeNodeItem>

      {/* <Modal
        open={renameModalVisible}
        title={node.type === 'tag' ? '修改分类名' : '修改标签组名'}
        cancelText="取消"
        okText="确认"
        width={400}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Input
          ref={inputRef}
          size="small"
          value={inputValue}
          defaultValue={(node?.title as string) || ''}
          maxLength={12}
          variant="outlined"
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={onPressEnter}
        />
      </Modal> */}
    </>
  );
}
