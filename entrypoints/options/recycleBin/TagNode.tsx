import { useState } from 'react';
import { theme, Flex, Space, Modal, Divider, Tag } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import { TagItem } from '@/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { recycleUtils } from '~/entrypoints/common/storage';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { StyledTagNode } from './index.styled';

export default function TagNode({
  tag,
  onRemove,
  onRecover,
}: {
  tag: TagItem;
  onRemove: () => void;
  onRecover: () => void;
}) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [removeModalVisible, setRemoveModalVisible] = useState<boolean>(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState<boolean>(false);

  // 删除分类
  const handleRemove = async () => {
    if (!tag?.tagId) return;
    await recycleUtils.removeTag(tag.tagId);
    onRemove?.();
  };
  // 还原分类
  const handleRecover = async () => {
    if (!tag?.tagId) return;
    await recycleUtils.recoverTag(tag);
    onRecover?.();
  };

  /* 删除弹窗、确认、取消 */
  // 删除弹窗
  const openConfirmModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoveModalVisible(true);
  };

  // 确认删除
  const handleRemoveConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleRemove();
    setRemoveModalVisible(false);
  };
  // 取消删除
  const handleRemoveCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoveModalVisible(false);
  };

  /* 还原弹窗、确认、取消 */
  // 删除弹窗
  const openRecoverModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecoverModalVisible(true);
  };

  // 确认删除
  const handleRecoverConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleRecover?.();
    setRecoverModalVisible(false);
  };
  // 取消删除
  const handleRecoverCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecoverModalVisible(false);
  };

  return (
    <StyledTagNode>
      <TagOutlined />
      <div className="tag-name">{ tag.static ? $fmt('home.stagingArea') : tag.tagName }</div>
      <Flex align="center">
        <span className="count" style={{ color: ENUM_COLORS.volcano }}>
          {$fmt({
            id: 'home.tabGroup.count',
            values: { count: tag?.groupList?.length || 0 },
          })}
        </span>
        <span className="tag-create-time">{tag.createTime}</span>
      </Flex>
      <Space
        className="action-btns"
        size={0}
        align="center"
        split={<Divider type="vertical" style={{ background: token.colorBorder }} />}
      >
        <span className="action-btn" onClick={openConfirmModal}>
          {$fmt('home.tag.remove')}
        </span>
        <span className="action-btn" onClick={openRecoverModal}>
          {$fmt('home.tag.recover')}
        </span>
      </Space>

      {/* 删除提示 */}
      {removeModalVisible && (
        <Modal
          title={$fmt('home.removeTitle')}
          width={400}
          open={removeModalVisible}
          onOk={handleRemoveConfirm}
          onCancel={handleRemoveCancel}
        >
          <div>{$fmt({ id: 'home.removeDesc', values: { type: $fmt('home.tag') } })}</div>
        </Modal>
      )}
      {recoverModalVisible && (
        <Modal
          title={$fmt('home.recoverTitle')}
          width={400}
          open={recoverModalVisible}
          onOk={handleRecoverConfirm}
          onCancel={handleRecoverCancel}
        >
          <div>{$fmt({ id: 'home.recoverDesc', values: { type: $fmt('home.tag') } })}</div>
        </Modal>
      )}
    </StyledTagNode>
  );
}