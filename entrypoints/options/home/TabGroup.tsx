import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { theme, message, Modal, Space, Divider, Checkbox, Spin, Skeleton } from 'antd';
import type { CheckboxProps } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import copyToClipboard from 'copy-to-clipboard';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import {
  ENUM_COLORS,
  UNNAMED_GROUP,
  ENUM_SETTINGS_PROPS,
} from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils, settingsUtils } from '~/entrypoints/common/storage';
import DndComponent from '~/entrypoints/common/components/DndComponent';
import DropComponent from '~/entrypoints/common/components/DropComponent';

import { HomeContext } from './hooks/treeData';
import { eventEmitter } from './hooks/homeCustomEvent';
import EditInput from '../components/EditInput';
import TabListItem from './TabListItem';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabActions,
  StyledTabListWrapper,
} from './TabGroup.styled';
import type {
  DndTabItemProps,
  DndTabItemOnDropCallback,
  MoveToCallbackProps,
} from './types';
import { dndKeys } from './constants';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';

const dndKey = dndKeys.tabItem;
const { CONFIRM_BEFORE_DELETING_TABS } = ENUM_SETTINGS_PROPS;

type TabGroupProps = GroupItem & {
  canDrag?: boolean;
  canDrop?: boolean;
  allowGroupActions?: string[];
  allowTabActions?: string[];
  selected?: boolean;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove?: () => void;
  onRestore?: () => void;
  onStarredChange?: (isStarred: boolean) => void;
  onDedup?: () => void;
  onRecover?: () => void;
  // onTabChange?: (data: TabItem) => void;
  // onTabRemove?: (groupId: string, tabs: TabItem[]) => void;
  onMoveTo?: ({ moveData, targetData, selected }: MoveToCallbackProps) => void;
};

const defaultGroupActions = [
  'remove',
  'rename',
  'restore',
  'lock',
  'star',
  'dedup',
  'moveTo',
  'copyLinks',
];
const defaultTabActions = ['remove', 'moveTo'];

const blockSize = 50;

function TabGroup({
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
  onDedup,
  onRecover,
  onMoveTo,
}: TabGroupProps) {
  const { token } = theme.useToken();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { $fmt } = useIntlUtls();
  const [tabsRemoveModal, tabsRemoveContextHolder] = Modal.useModal();
  const groupRef = useRef<HTMLDivElement>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [dedupModalVisible, setDedupModalVisible] = useState(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);

  const {
    modalVisible: moveToModalVisible,
    openModal: openMoveToModal,
    onConfirm: onMoveToConfirm,
    onClose: onMoveToClose,
    moveData,
  } = useMoveTo();
  const { treeDataHook } = useContext(HomeContext);

  const group = useMemo(
    () => ({ groupId, groupName, createTime, isLocked, isStarred, selected }),
    [groupId, groupName, createTime, isLocked, isStarred, selected]
  );

  const removeDesc = useMemo(() => {
    const typeName = $fmt(`home.tabGroup`);
    return $fmt({
      id: 'home.removeDesc',
      values: {
        type: `${typeName}${` <strong>[${groupName}]</strong>`}`,
      },
    });
  }, [$fmt]);

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
  const handleTabGroupDedup = () => {
    setDedupModalVisible(false);
    onDedup?.();
  };
  const handleTabGroupRecover = () => {
    setRecoverModalVisible(false);
    onRecover?.();
  };

  const handleCopy = useCallback(() => {
    const tabLinks = tabListUtils.copyLinks(tabList);
    const result = copyToClipboard(tabLinks);
    if (result) {
      messageApi.success($fmt('common.CopySuccess'));
    } else {
      messageApi.error($fmt('common.CopyFailed'));
    }
  }, [tabList]);

  const handleTabChange = useCallback((newData: TabItem) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemChange',
      params: [{ key: group.groupId }, newData],
    });
  }, []);

  const handleTabRemove = useCallback((tabs: TabItem[]) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemRemove',
      params: [group.groupId, tabs],
    });

    setTimeout(() => {
      setSelectedTabIds((selectedTabIds) =>
        selectedTabIds.filter((id) => !tabs.some((tab) => tab.tabId === id))
      );
    }, 0);
  }, []);
  // 删除确认
  const handleTabRemoveConfirm = useCallback(async () => {
    const settings = settingsUtils.settings || {};
    if (!settings[CONFIRM_BEFORE_DELETING_TABS]) {
      handleTabRemove(selectedTabs);
      return;
    }

    const confirmed = await tabsRemoveModal.confirm({
      title: $fmt('common.confirm'),
      content: $fmt({
        id: 'home.tab.removeSelected',
        values: {
          count: selectedTabs.length,
        },
      }),
    });

    if (confirmed) {
      handleTabRemove(selectedTabs);
    }
  }, [$fmt, selectedTabs]);

  const handleTabItemDrop: DndTabItemOnDropCallback = useCallback((...params) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemDrop',
      params,
    });
  }, []);

  /* 下面是分段加载相关 */
  const [rendering, setRendering] = useState(true);
  const [loading, setLoading] = useState(true);
  const tabListHeight = useMemo(() => {
    return tabList.length * 24 || 24;
  }, [tabList]);

  const [blockIndex, setBlockIndex] = useState<number>(1);
  const tabListLocal = useMemo(() => {
    return tabList.slice(0, 10 + blockIndex * blockSize);
  }, [tabList, blockIndex]);

  const timerRef = useRef<{ timer: NodeJS.Timeout | string | number | undefined }>({
    timer: undefined,
  });
  const recursion = (index: number = 1) => {
    if (10 + index * blockSize >= tabList.length) {
      setLoading(false);
      return;
    }
    timerRef.current.timer = setTimeout(() => {
      setBlockIndex((index) => index + 1);
      recursion(index + 1);
    }, 30);
  };

  useEffect(() => {
    setRendering(false);
    recursion();
    return () => {
      clearTimeout(timerRef.current.timer);
    };
  }, []);

  return (
    <>
      <StyledGroupWrapper
        className="tab-group-wrapper"
        data-gid={groupId}
        $bgColor={selected ? token.colorPrimaryBg : token.colorBgContainer}
        ref={groupRef}
      >
        {/* 标签组 header 展示、操作区域 */}
        <StyledGroupHeader className="group-header select-none">
          {allowGroupActions.includes('remove') && !isLocked && (
            <StyledActionIconBtn
              className="btn-remove"
              $size="16"
              title={$fmt('common.remove')}
              $hoverColor={ENUM_COLORS.red}
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
              maxWidth={240}
              fontSize={20}
              iconSize={16}
              onValueChange={(value) => onChange?.({ groupName: value || UNNAMED_GROUP })}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-info">
              <span className="tab-count" style={{ color: ENUM_COLORS.volcano }}>
                {$fmt({
                  id: 'home.tab.count',
                  values: { count: tabList?.length || 0 },
                })}
              </span>
              <span className="group-create-time">{createTime}</span>
            </div>
            <Space
              className="group-action-btns"
              size={0}
              split={
                <Divider type="vertical" style={{ background: token.colorBorder }} />
              }
            >
              {allowGroupActions.includes('remove') && !isLocked && (
                <span className="action-btn" onClick={() => setModalVisible(true)}>
                  {$fmt('home.tabGroup.remove')}
                </span>
              )}
              {allowGroupActions.includes('restore') && (
                <span className="action-btn" onClick={() => onRestore?.()}>
                  {$fmt('home.tabGroup.open')}
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
                <span
                  className="action-btn"
                  onClick={() => onStarredChange?.(!isStarred)}
                >
                  {$fmt(isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star')}
                </span>
              )}
              {allowGroupActions.includes('moveTo') && (
                <span
                  className="action-btn"
                  onClick={() => openMoveToModal?.({ groupId })}
                >
                  {$fmt('common.moveTo')}
                </span>
              )}
              {allowGroupActions.includes('copyLinks') && (
                <span className="action-btn" onClick={handleCopy}>
                  {$fmt('home.copyLinks')}
                </span>
              )}
              {allowGroupActions.includes('dedup') && (
                <span className="action-btn" onClick={() => setDedupModalVisible(true)}>
                  {$fmt('common.dedup')}
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

        {/* tab 选择、操作区域 */}
        {tabList?.length > 0 && !isLocked && (
          <StyledTabActions>
            <div className="checkall-wrapper">
              <Checkbox
                checked={isAllChecked}
                indeterminate={checkAllIndeterminate}
                onChange={handleSelectAll}
              ></Checkbox>
              <span
                className="selected-count-text"
                style={{ color: ENUM_COLORS.volcano }}
              >
                {`${selectedTabIds.length} / ${tabList?.length}`}
              </span>
            </div>
            {selectedTabIds.length > 0 && (
              <Space
                className="tab-action-btns select-none"
                size={0}
                split={
                  <Divider type="vertical" style={{ background: token.colorBorder }} />
                }
              >
                {allowTabActions.includes('remove') && (
                  <span className="action-btn" onClick={handleTabRemoveConfirm}>
                    {$fmt('common.remove')}
                  </span>
                )}
                {allowTabActions.includes('moveTo') && (
                  <span
                    className="action-btn"
                    onClick={() => openMoveToModal?.({ groupId, tabs: selectedTabs })}
                  >
                    {$fmt('common.moveTo')}
                  </span>
                )}
              </Space>
            )}
          </StyledTabActions>
        )}

        {/* tab 列表 */}
        <DropComponent
          data={{
            index: 0,
            groupId,
            allowKeys: tabList?.length > 0 ? [] : [dndKey],
          }}
          canDrop={canDrop}
          onDrop={handleTabItemDrop}
        >
          <StyledTabListWrapper
            className="tab-list-wrapper"
            style={{ minHeight: `${tabListHeight}px` }}
          >
            {rendering ? (
              <Skeleton title={false} paragraph={{ rows: 3 }}></Skeleton>
            ) : (
              <Spin spinning={loading} size="large">
                <Checkbox.Group
                  className="tab-list-checkbox-group"
                  value={selectedTabIds}
                  onChange={setSelectedTabIds}
                >
                  {tabListLocal.map((tab, index) => (
                    <DndComponent<DndTabItemProps>
                      canDrag={canDrag && !isLocked && selectedTabIds.length === 0}
                      key={tab.tabId || index}
                      data={{ ...tab, index, groupId, dndKey }}
                      dndKey={dndKey}
                      onDrop={handleTabItemDrop}
                    >
                      <TabListItem
                        key={tab.tabId || index}
                        group={group}
                        {...tab}
                        highlight={
                          tab.tabId != undefined &&
                          treeDataHook?.highlightTabId === tab.tabId
                        }
                        onRemove={handleTabRemove}
                        onChange={handleTabChange}
                      />
                    </DndComponent>
                  ))}
                </Checkbox.Group>
              </Spin>
            )}
          </StyledTabListWrapper>
        </DropComponent>
      </StyledGroupWrapper>

      {messageContextHolder}
      {tabsRemoveContextHolder}

      {/* 标签组删除确认弹窗 */}
      {modalVisible && (
        <Modal
          title={$fmt('home.removeTitle')}
          width={400}
          centered
          open={modalVisible}
          onOk={handleTabGroupRemove}
          onCancel={() => setModalVisible(false)}
        >
          <div dangerouslySetInnerHTML={{ __html: removeDesc }}>
            {/* {$fmt({ id: 'home.removeDesc', values: { type: $fmt(`home.tabGroup`) } })} */}
          </div>
        </Modal>
      )}
      {/* 标签组去重确认弹窗 */}
      {dedupModalVisible && (
        <Modal
          title={$fmt('home.dedupTitle')}
          width={400}
          centered
          open={dedupModalVisible}
          onOk={handleTabGroupDedup}
          onCancel={() => setDedupModalVisible(false)}
        >
          <div>{$fmt('home.dedupDesc')}</div>
        </Modal>
      )}
      {/* 还原确认弹窗 */}
      {recoverModalVisible && (
        <Modal
          title={$fmt('home.recoverTitle')}
          width={400}
          centered
          open={recoverModalVisible}
          onOk={handleTabGroupRecover}
          onCancel={() => setRecoverModalVisible(false)}
        >
          <div>
            {$fmt({ id: 'home.recoverDesc', values: { type: $fmt('home.tabGroup') } })}
          </div>
        </Modal>
      )}
      {/* 移动到弹窗 */}
      {moveToModalVisible && (
        <MoveToModal
          visible={moveToModalVisible}
          listData={treeDataHook.tagList}
          moveData={moveData}
          onOk={(targetData) => {
            onMoveToConfirm(() => {
              onMoveTo?.({ moveData, targetData, selected: !!selected });
              setSelectedTabIds([]);
            });
          }}
          onCancel={onMoveToClose}
        />
      )}
    </>
  );
}

export default memo(TabGroup);
