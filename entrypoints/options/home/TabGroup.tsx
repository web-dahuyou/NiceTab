import React, { useEffect, useRef, useState, useCallback } from 'react';
import { theme, Modal, Space, Divider, Tag } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { openNewTab } from '~/entrypoints/common/tabs';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS, UNNAMED_TAG, UNNAMED_GROUP } from '~/entrypoints/common/constants';
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
import { dndKeys } from './constants';

const dndKey = dndKeys.tabItem;

type TabGroupProps = GroupItem & {
  refreshKey?: string;
  canDrag?: boolean;
  canDrop?: boolean;
  allowActions?: string[];
  selected?: boolean;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove?: () => void;
  onRestore?: () => void;
  onStarredChange?: (isStarred: boolean) => void;
  onRecover?: () => void;
  onDrop?: DndTabItemOnDropCallback;
  onTabRemove?: (groupId: string, tabItem: TabItem) => void;
};

const defaultGroupActions = ['remove', 'rename', 'restore', 'lock', 'star'];

export default function TabGroup({
  refreshKey,
  groupId,
  groupName,
  createTime,
  tabList,
  isLocked,
  isStarred,
  selected,
  allowActions = defaultGroupActions,
  canDrag = true,
  canDrop = true,
  onChange,
  onRemove,
  onRestore,
  onStarredChange,
  onRecover,
  onDrop,
  onTabRemove,
}: TabGroupProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const groupRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);

  const handleTabGroupRemove = () => {
    setModalVisible(false);
    onRemove?.();
  };
  const handleTabGroupRecover = () => {
    setRecoverModalVisible(false);
    onRecover?.();
  };

  useEffect(() => {
    if (selected && groupRef.current) {
      // console.log('groupRef.current', groupRef.current)
      const offsetTop = groupRef.current?.offsetTop || 0;
      window.scrollTo({ top: offsetTop - 100, behavior: 'instant' });
    }
  }, [refreshKey, selected]);

  return (
    <>
      <StyledGroupWrapper
        className="tab-group-wrapper"
        data-gid={groupId}
        $bgColor={selected ? token.colorPrimaryBg : ''}
        ref={groupRef}
      >
        <StyledGroupHeader className="group-header" $primaryColor={token.colorPrimary}>
          {allowActions.includes('remove') && !isLocked && (
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
              value={groupName || UNNAMED_GROUP}
              disabled={!allowActions.includes('rename')}
              maxLength={20}
              maxWidth={240}
              fontSize={20}
              iconSize={16}
              onValueChange={(value) => onChange?.({ groupName: value || UNNAMED_GROUP })}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-info">
              <Tag color="volcano">{$fmt({ id: 'home.tab.count', values: {count: tabList?.length || 0}})}</Tag>
              <span className="group-create-time">{createTime}</span>
            </div>
            <Space className="group-action-btns" size={0} split={<Divider type="vertical" style={{ background: token.colorBorder }} />}>
              {allowActions.includes('remove') && !isLocked && (
                <span className="action-btn" onClick={() => setModalVisible(true)}>
                  {$fmt('home.tabGroup.remove')}
                </span>
              )}
              {allowActions.includes('restore') && (
                <span className="action-btn" onClick={() => onRestore?.()}>
                  {$fmt('home.tabGroup.restore')}
                </span>
              )}
              {allowActions.includes('lock') && (
                <span
                  className="action-btn"
                  onClick={() => onChange?.({ isLocked: !isLocked })}
                >
                  {$fmt(isLocked ? 'home.tabGroup.unlock' : 'home.tabGroup.lock')}
                </span>
              )}
              {allowActions.includes('star') && (
                <span className="action-btn" onClick={() => onStarredChange?.(!isStarred)}>
                  {$fmt(isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star')}
                </span>
              )}
              {allowActions.includes('recover') && (
                <span className="action-btn" onClick={() => setRecoverModalVisible(true)}>
                  {$fmt('home.tabGroup.recover')}
                </span>
              )}
            </Space>
          </div>
        </StyledGroupHeader>

        <DropComponent data={{index: 0, groupId, allowKeys: tabList?.length > 0 ? [] : [dndKey]}} canDrop={canDrop} onDrop={onDrop}>
          <StyledTabListWrapper className="tab-list-wrapper">
            {tabList.map((tab, index) => (
              <DndComponent<DndTabItemProps>
                canDrag={canDrag && !isLocked}
                key={tab.tabId || index}
                data={{ ...tab, index, groupId, dndKey }}
                dndKey={dndKey}
                onDrop={onDrop}
              >
                <div className="tab-list-item" key={tab.tabId || index}>
                  { !isLocked && (
                    <StyledActionIconBtn
                      className="tab-item-btn btn-remove"
                      $size="16"
                      title={$fmt('common.remove')}
                      $hoverColor={ENUM_COLORS.red.primary}
                      onClick={() =>
                        // onChange?.({ tabList: tabList.filter((t, i) => i !== index) })
                        onTabRemove?.(groupId, tab)
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
          onOk={handleTabGroupRemove}
          onCancel={() => setModalVisible(false)}
        >
          <div>{$fmt({ id: 'home.removeDesc', values: { type: $fmt(`home.tabGroup`) }})}</div>
        </Modal>
      )}
      {recoverModalVisible && (
        <Modal
          title={$fmt('home.recoverTitle')}
          width={400}
          open={recoverModalVisible}
          onOk={handleTabGroupRecover}
          onCancel={() => setRecoverModalVisible(false)}
        >
          <div>{$fmt({ id: 'home.recoverDesc', values: { type: $fmt('home.tabGroup') } })}</div>
        </Modal>
      )}
    </>
  );
}
