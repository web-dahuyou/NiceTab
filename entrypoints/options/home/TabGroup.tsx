import React, { useEffect, useRef, useState, useMemo } from 'react';
import { theme, Modal, Space, Divider, Tag, Checkbox } from 'antd';
import type { CheckboxProps } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { TagItem, GroupItem, TabItem } from '~/entrypoints/types';
import { openNewTab } from '~/entrypoints/common/tabs';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks';
import EditInput from '../components/EditInput';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabActions,
  StyledTabListWrapper,
  StyledTabTitle,
  StyledTabItemFavicon,
} from './TabGroup.styled';
import DndComponent from '@/entrypoints/common/components/DndComponent';
import DropComponent from '@/entrypoints/common/components/DropComponent';
import { DndTabItemProps, DndTabItemOnDropCallback, MoveDataProps } from './types';
import { dndKeys } from './constants';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';

const dndKey = dndKeys.tabItem;

type TabGroupProps = GroupItem & {
  tagList?: TagItem[];
  refreshKey?: string;
  canDrag?: boolean;
  canDrop?: boolean;
  allowGroupActions?: string[];
  allowTabActions?: string[];
  selected?: boolean;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove?: () => void;
  onRestore?: () => void;
  onStarredChange?: (isStarred: boolean) => void;
  onRecover?: () => void;
  onDrop?: DndTabItemOnDropCallback;
  onTabRemove?: (groupId: string, tabs: TabItem[]) => void;
  onMoveTo?: ({ moveData, selected }: { moveData?: MoveDataProps, selected: boolean }) => void;
};

const defaultGroupActions = ['remove', 'rename', 'restore', 'lock', 'star', 'moveTo'];
const defaultTabActions = ['remove', 'moveTo'];

export default function TabGroup({
  tagList,
  refreshKey,
  groupId,
  groupName,
  createTime,
  tabList,
  isLocked,
  isStarred,
  selected,
  allowGroupActions = defaultGroupActions,
  allowTabActions = defaultTabActions,
  canDrag = true,
  canDrop = true,
  onChange,
  onRemove,
  onRestore,
  onStarredChange,
  onRecover,
  onDrop,
  onTabRemove,
  onMoveTo
}: TabGroupProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const groupRef = useRef<HTMLDivElement>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);

  const {
    modalVisible: moveToModalVisible,
    openModal: openMoveToModal,
    onConfirm: onMoveToConfirm,
    onClose: onMoveToClose,
    moveData
  } = useMoveTo();

  // 已选择的tabItem数组
  const selectedTabs = useMemo(() => {
    return tabList.filter((tab) => selectedTabIds.includes(tab.tabId));
  }, [selectedTabIds]);
  // 是否全选
  const isAllChecked = useMemo(() => {
    return tabList.length > 0 && selectedTabIds.length === tabList.length;
  }, [tabList, selectedTabIds]);

  // 全选框 indeterminate 状态
  const checkAllIndeterminate = useMemo(() => {
    return selectedTabIds.length > 0 && selectedTabIds.length < tabList.length;
  }, [tabList, selectedTabIds]);
  // 全选
  const handleSelectAll: CheckboxProps['onChange'] = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedTabIds(tabList.map((tab) => tab.tabId));
    } else {
      setSelectedTabIds([]);
    }
  };

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
          {allowGroupActions.includes('remove') && !isLocked && (
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
              disabled={!allowGroupActions.includes('rename')}
              maxLength={20}
              maxWidth={240}
              fontSize={20}
              iconSize={16}
              onValueChange={(value) => onChange?.({ groupName: value || UNNAMED_GROUP })}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-info">
              <span className="tab-count" style={{ color: ENUM_COLORS.volcano.primary }}>
                {$fmt({ id: 'home.tab.count', values: {count: tabList?.length || 0}})}
              </span>
              <span className="group-create-time">{createTime}</span>
            </div>
            <Space className="group-action-btns" size={0} split={<Divider type="vertical" style={{ background: token.colorBorder }} />}>
              {allowGroupActions.includes('remove') && !isLocked && (
                <span className="action-btn" onClick={() => setModalVisible(true)}>
                  {$fmt('home.tabGroup.remove')}
                </span>
              )}
              {allowGroupActions.includes('restore') && (
                <span className="action-btn" onClick={() => onRestore?.()}>
                  {$fmt('home.tabGroup.restore')}
                </span>
              )}
              {allowGroupActions.includes('lock') && (
                <span
                  className="action-btn"
                  onClick={() => onChange?.({ isLocked: !isLocked })}
                >
                  {$fmt(isLocked ? 'home.tabGroup.unlock' : 'home.tabGroup.lock')}
                </span>
              )}
              {allowGroupActions.includes('star') && (
                <span className="action-btn" onClick={() => onStarredChange?.(!isStarred)}>
                  {$fmt(isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star')}
                </span>
              )}
              {allowGroupActions.includes('moveTo') && (
                <span className="action-btn" onClick={() => openMoveToModal?.({ groupId })}>
                  {$fmt('common.moveTo')}
                </span>
              )}
              {allowGroupActions.includes('recover') && (
                <span className="action-btn" onClick={() => setRecoverModalVisible(true)}>
                  {$fmt('home.tabGroup.recover')}
                </span>
              )}
            </Space>
          </div>
        </StyledGroupHeader>

        { tabList?.length > 0 && !isLocked && (
          <StyledTabActions $primaryColor={token.colorPrimary}>
            <div className="checkall-wrapper">
              <Checkbox checked={isAllChecked} indeterminate={checkAllIndeterminate} onChange={handleSelectAll}></Checkbox>
              <span className="selected-count-text" style={{ color: ENUM_COLORS.volcano.primary }}>
                { `${selectedTabIds.length} / ${tabList?.length}` }
              </span>
            </div>
            { selectedTabIds.length > 0 && (
              <Space className="tab-action-btns" size={0} split={<Divider type="vertical" style={{ background: token.colorBorder }} />}>
                { allowTabActions.includes('remove') && (
                  <span className="action-btn" onClick={() => {
                    setSelectedTabIds([]);
                    onTabRemove?.(groupId, selectedTabs);
                  } }>
                    {$fmt('common.remove')}
                  </span>
                ) }
                { allowTabActions.includes('moveTo') && (
                  <span className="action-btn" onClick={() => openMoveToModal?.({ groupId, tabs: selectedTabs })}>
                    {$fmt('common.moveTo')}
                  </span>
                )}
              </Space>
            ) }
          </StyledTabActions>
        ) }

        <DropComponent data={{index: 0, groupId, allowKeys: tabList?.length > 0 ? [] : [dndKey]}} canDrop={canDrop} onDrop={onDrop}>
          <StyledTabListWrapper className="tab-list-wrapper">
            <Checkbox.Group className="tab-list-checkbox-group" value={ selectedTabIds } onChange={ setSelectedTabIds }>
              {tabList.map((tab, index) => (
                <DndComponent<DndTabItemProps>
                  canDrag={canDrag && !isLocked && selectedTabIds.length === 0}
                  key={tab.tabId || index}
                  data={{ ...tab, index, groupId, dndKey }}
                  dndKey={dndKey}
                  onDrop={onDrop}
                >
                  <div className="tab-list-item" key={tab.tabId || index}>
                    { !isLocked && (
                      <Checkbox className="checkbox-item" value={tab.tabId}></Checkbox>
                    )}
                    { !isLocked && (
                      <StyledActionIconBtn
                        className="tab-item-btn btn-remove"
                        $size="16"
                        title={$fmt('common.remove')}
                        $hoverColor={ENUM_COLORS.red.primary}
                        onClick={() =>
                          onTabRemove?.(groupId, [tab])
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
            </Checkbox.Group>
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
      {/* 移动到弹窗 */}
      { moveToModalVisible && (
        <MoveToModal
          visible={moveToModalVisible}
          listData={tagList}
          moveData={moveData}
          onOk={() => {
            onMoveToConfirm(() => {
              onMoveTo?.({ moveData, selected: !!selected });
              setSelectedTabIds([]);
            });
          }}
          onCancel={onMoveToClose}
        />
      )}
    </>
  );
}
