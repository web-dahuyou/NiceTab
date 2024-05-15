import React, { useEffect, useRef, useState, useCallback } from 'react';
import { theme, Modal } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { GroupItem } from '~/entrypoints/types';
import { openNewTab } from '~/entrypoints/common/tabs';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import EditInput from '../components/EditInput';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabListWrapper,
  StyledTabTitle,
  StyledTabItemFavicon,
} from './TabGroup.styled';
import DndComponent from '@/entrypoints/common/components/DndComponent';
import { DndTabItemProps, DndTabItemOnDropCallback } from './types';

type TabGroupProps = GroupItem & {
  selected?: boolean;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove: () => void;
  onRestore: () => void;
  onStarredChange?: (isStarred: boolean) => void;
  onDrop?: DndTabItemOnDropCallback;
};

const dndKey = Symbol('dnd-tab-item');

export default function TabGroup({
  groupId,
  groupName,
  createTime,
  tabList,
  isLocked,
  isStarred,
  selected,
  onChange,
  onRemove,
  onRestore,
  onStarredChange,
  onDrop,
}: TabGroupProps) {
  const { token } = theme.useToken();
  const groupRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleRemove = () => {
    setModalVisible(false);
    onRemove?.();
  };

  useEffect(() => {
    if (selected && groupRef.current) {
      // console.log('groupRef.current', groupRef.current)
      const offsetTop = groupRef.current.offsetTop;
      window.scrollTo({ top: offsetTop - 100, behavior: 'instant' });
    }
  }, [selected]);

  return (
    <>
      <StyledGroupWrapper
        className="tab-group-wrapper"
        data-gid={groupId}
        $bgColor={selected ? token.colorPrimaryBg : ''}
        ref={groupRef}
      >
        <StyledGroupHeader className="group-header" $primaryColor={token.colorPrimary}>
          {!isLocked && (
            <StyledActionIconBtn
              className="btn-remove"
              $size="16"
              title="删除"
              $hoverColor={ENUM_COLORS.red.primary}
              onClick={() => setModalVisible(true)}
            >
              <CloseOutlined />
            </StyledActionIconBtn>
          )}

          <div className="group-status-wrapper">
            {isLocked && (
              <LockOutlined
                style={{ fontSize: '22px', color: token.colorPrimaryHover }}
              />
            )}
            {isStarred && (
              <StarOutlined
                style={{ fontSize: '22px', color: token.colorPrimaryHover }}
              />
            )}
          </div>

          <div className="group-name-wrapper">
            <EditInput
              value={groupName || '未命名'}
              maxLength={18}
              maxWidth={160}
              fontSize={20}
              iconSize={16}
              onValueChange={(value) => onChange?.({ groupName: value || '未命名' })}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-create-time">{createTime}</div>
            <div className="group-action-btns">
              {!isLocked && (
                <span className="action-btn" onClick={() => setModalVisible(true)}>
                  删除该组
                </span>
              )}
              <span className="action-btn" onClick={() => onRestore?.()}>
                恢复该组
              </span>
              <span
                className="action-btn"
                onClick={() => onChange?.({ isLocked: !isLocked })}
              >
                {isLocked ? '取消锁定' : '锁定该组'}
              </span>
              <span className="action-btn" onClick={() => onStarredChange?.(!isStarred)}>
                {isStarred ? '取消星标' : '星标该组'}
              </span>
            </div>
          </div>
        </StyledGroupHeader>

        <StyledTabListWrapper className="tab-list-wrapper">
          {tabList.map((tab, index) => (
            <DndComponent<DndTabItemProps>
              canDrag
              key={index}
              data={{ ...tab, index, groupId, dndKey }}
              dndKey={dndKey}
              onDrop={onDrop}
            >
              <div className="tab-list-item" key={index}>
                <StyledActionIconBtn
                  className="tab-item-btn btn-remove"
                  $size="16"
                  title="删除"
                  $hoverColor={ENUM_COLORS.red.primary}
                  onClick={() =>
                    onChange?.({ tabList: tabList.filter((t, i) => i !== index) })
                  }
                >
                  <CloseOutlined />
                </StyledActionIconBtn>
                {tab.favIconUrl && (
                  <StyledTabItemFavicon
                    className="tab-item-favicon"
                    $bgUrl={tab.favIconUrl}
                  />
                )}
                <StyledTabTitle $primaryColor={token.colorPrimary}>
                  <span className="tab-title" onClick={() => openNewTab(tab)}>
                    {tab.title}
                  </span>
                </StyledTabTitle>
              </div>
            </DndComponent>
          ))}
        </StyledTabListWrapper>
      </StyledGroupWrapper>

      {modalVisible && (
        <Modal
          title="删除提醒"
          width={400}
          open={modalVisible}
          okText="确认"
          cancelText="取消"
          onOk={handleRemove}
          onCancel={() => setModalVisible(false)}
        >
          <div>您确定要删除该标签组吗？</div>
        </Modal>
      )}
    </>
  );
}
