import React, { useEffect, useRef, useState, useCallback } from 'react';
import { theme, Modal, Space, Divider } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { GroupItem } from '~/entrypoints/types';
import { openNewTab } from '~/entrypoints/common/tabs';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import EditInput from '../components/EditInput';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabListWrapper,
  StyledTabTitle,
  StyledTabItemFavicon,
} from './TabGroup.styled';
import DndComponent from '@/entrypoints/common/components/DndComponent';
import DropComponent from '@/entrypoints/common/components/DropComponent';
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
  const { $fmt } = useIntlUtls();
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
              title={$fmt('common.remove')}
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
              value={groupName || 'Unnamed'}
              maxLength={18}
              maxWidth={160}
              fontSize={20}
              iconSize={16}
              onValueChange={(value) => onChange?.({ groupName: value || 'Unnamed' })}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-info">
              {/* <span className="tab-count">{tabList?.length || 0}个标签页</span> */}
              <span className="tab-count">{$fmt({ id: 'home.tab.count', values: {count: tabList?.length || 0}})}</span>
              <span className="group-create-time">{createTime}</span>
            </div>
            <Space className="group-action-btns" size={0} split={<Divider type="vertical" style={{ background: token.colorBorder }} />}>
              {!isLocked && (
                <span className="action-btn" onClick={() => setModalVisible(true)}>
                  {$fmt('home.tabGroup.remove')}
                </span>
              )}
              <span className="action-btn" onClick={() => onRestore?.()}>
              {$fmt('home.tabGroup.restore')}
              </span>
              <span
                className="action-btn"
                onClick={() => onChange?.({ isLocked: !isLocked })}
              >
                {$fmt(isLocked ? 'home.tabGroup.unlock' : 'home.tabGroup.lock')}
              </span>
              <span className="action-btn" onClick={() => onStarredChange?.(!isStarred)}>
                {$fmt(isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star')}
              </span>
            </Space>
          </div>
        </StyledGroupHeader>

        <DropComponent data={{index: 0, groupId, allowKeys: tabList?.length > 0 ? [] : [dndKey]}} onDrop={onDrop}>
          <StyledTabListWrapper className="tab-list-wrapper">
            {tabList.map((tab, index) => (
              <DndComponent<DndTabItemProps>
                canDrag={!isLocked}
                key={index}
                data={{ ...tab, index, groupId, dndKey }}
                dndKey={dndKey}
                onDrop={onDrop}
              >
                <div className="tab-list-item" key={index}>
                  { !isLocked && (
                    <StyledActionIconBtn
                      className="tab-item-btn btn-remove"
                      $size="16"
                      title={$fmt('common.remove')}
                      $hoverColor={ENUM_COLORS.red.primary}
                      onClick={() =>
                        onChange?.({ tabList: tabList.filter((t, i) => i !== index) })
                      }
                    >
                      <CloseOutlined />
                    </StyledActionIconBtn>
                  ) }
                  {tab.favIconUrl && (
                    <StyledTabItemFavicon
                      className="tab-item-favicon"
                      $bgUrl={tab.favIconUrl}
                    />
                  )}
                  <StyledTabTitle $primaryColor={token.colorPrimary}>
                    <span className="tab-title" title={tab.title} onClick={() => openNewTab(tab)}>
                      {tab.title}
                    </span>
                  </StyledTabTitle>
                </div>
              </DndComponent>
            ))}
          </StyledTabListWrapper>
        </DropComponent>
      </StyledGroupWrapper>

      {modalVisible && (
        <Modal
          title={$fmt('home.removeTitle')}
          width={400}
          open={modalVisible}
          onOk={handleRemove}
          onCancel={() => setModalVisible(false)}
        >
          <div>{$fmt({ id: 'home.removeDesc', values: { type: $fmt(`home.tabGroup`) }})}</div>
        </Modal>
      )}
    </>
  );
}
