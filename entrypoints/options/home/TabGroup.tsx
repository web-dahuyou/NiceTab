import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { theme, message, Modal, Checkbox, Spin, Skeleton } from 'antd';
import type { CheckboxProps } from 'antd';
import {
  DeleteOutlined,
  LockFilled,
  StarFilled,
  ExportOutlined,
  SendOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import copyToClipboard from 'copy-to-clipboard';
import { IconRepeat } from '~/entrypoints/common/components/icon/CustomIcon';
import { GroupItem, TabItem, ActionBtnStyle } from '~/entrypoints/types';
import {
  ENUM_COLORS,
  UNNAMED_GROUP,
  ENUM_SETTINGS_PROPS,
} from '~/entrypoints/common/constants';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils, settingsUtils } from '~/entrypoints/common/storage';
import DndComponent, {
  idleState,
  type OnSourceDropCallback,
  type DraggableStateItem,
} from '~/entrypoints/common/components/DndComponent';
import DropComponent from '~/entrypoints/common/components/DropComponent';

import { HomeContext } from './hooks/treeData';
import { eventEmitter } from './hooks/homeCustomEvent';
import EditInput from '../components/EditInput';
import ActionBtnList, {
  type ActionOptionItem,
} from '~/entrypoints/common/components/ActionBtnList';
import TabListItem, { type QuickSelectFunc } from './TabListItem';
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
  GroupActionName,
  TabActionName,
} from './types';
import {
  dndKeys,
  defaultGroupActions,
  defaultTabActions,
  tabsActionOptions,
  type ActionOption,
} from './constants';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';
import useMultiSelection from './hooks/multiSelection';
import useGroupActions from './hooks/groupActions.tsx';

const dndKey = dndKeys.tabItem;
const {
  CONFIRM_BEFORE_DELETING_TABS,
  CONFIRM_BEFORE_DELETING_GROUPS,
  DELETE_AFTER_RESTORE,
} = ENUM_SETTINGS_PROPS;

type TabGroupProps = GroupItem & {
  tagId?: string;
  tagLocked?: boolean;
  canDrag?: boolean;
  canDrop?: boolean;
  allowGroupActions?: GroupActionName[];
  allowTabActions?: TabActionName[];
  selected?: boolean;
  actionBtnStyle?: ActionBtnStyle;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove?: () => void;
  onCreate?: (tagId: string, groupId: string, pos: 'before' | 'after') => void;
  onRestore?: () => void;
  onStarredChange?: (isStarred: boolean) => void;
  onDedup?: () => void;
  onCopy?: (groupId: string) => void;
  onRecover?: () => void;
  // onTabChange?: (data: TabItem) => void;
  // onTabRemove?: (groupId: string, tabs: TabItem[]) => void;
  onMoveTo?: ({ moveData, targetData, selected }: MoveToCallbackProps) => void;
};

const blockSize = 50;

function TabGroup({
  tagId,
  tagLocked,
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
  actionBtnStyle = 'icon',
  onChange,
  onRemove,
  onCreate,
  onRestore,
  onStarredChange,
  onDedup,
  onCopy,
  onRecover,
  onMoveTo,
}: TabGroupProps) {
  const { token } = theme.useToken();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { $fmt } = useIntlUtls();
  const [tabsRemoveModal, tabsRemoveContextHolder] = Modal.useModal();
  const groupRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [dedupModalVisible, setDedupModalVisible] = useState(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);
  const [draggableState, setDraggableState] = useState<DraggableStateItem>(idleState);
  const [draggingTabItem, setDraggingTabItem] = useState<TabItem | null>(null);

  const {
    modalVisible: moveToModalVisible,
    openModal: openMoveToModal,
    onConfirm: onMoveToConfirm,
    onClose: onMoveToClose,
    moveData,
  } = useMoveTo();
  const { treeDataHook } = useContext(HomeContext);

  const tag = useMemo(() => {
    return { isLocked: tagLocked };
  }, [tagLocked]);

  const group = useMemo(
    () => ({ groupId, groupName, createTime, isLocked, isStarred, selected }),
    [groupId, groupName, createTime, isLocked, isStarred, selected],
  );

  // 框选相关状态
  useMultiSelection({
    groupData: group,
    container: tabListRef.current!,
    selectedTabIds,
    setSelectedTabIds,
  });

  const removeDesc = useMemo(() => {
    const typeName = $fmt(`home.tabGroup`);
    return $fmt({
      id: 'home.removeDesc',
      values: {
        type: `${typeName}${` <strong>[${groupName}]</strong>`}`,
      },
    });
  }, [$fmt]);

  // 快捷选择，起始位置
  const [quickSelectedTabIds, setQuickSelectedTabIds] = useState<string[]>([]);
  const handleTabQuickSelect: QuickSelectFunc = async (tab, selected) => {
    // 由于快捷选择直接复用了checkbox的选择，onChange 回调中的setSelectedTabIds会覆盖quickSelect的setSelectedTabIds
    // 所以这里延时100ms，等待onChange回调执行完毕，再执行后面的操作
    await new Promise(r => setTimeout(r, 100));

    if (quickSelectedTabIds.length === 0) {
      selected && setQuickSelectedTabIds([tab.tabId]);
    } else if (quickSelectedTabIds.length === 1) {
      if (selected) {
        let startIndex = tabList.findIndex(item => item.tabId === quickSelectedTabIds[0]);
        let endIndex = tabList.findIndex(item => item.tabId === tab.tabId);
        if (startIndex > endIndex) {
          [startIndex, endIndex] = [endIndex, startIndex];
        }

        const _selectedTabIds = tabList
          .slice(startIndex, endIndex + 1)
          .map(item => item.tabId);

        const newSelectedIds = [...new Set([...selectedTabIds, ..._selectedTabIds])];
        setSelectedTabIds(newSelectedIds);
        setQuickSelectedTabIds([]);
      } else {
        quickSelectedTabIds[0] === tab.tabId && setQuickSelectedTabIds([]);
      }
    } else {
      setQuickSelectedTabIds([]);
    }
  };

  // 已选择的tabItem数组
  const selectedTabs = useMemo(() => {
    return tabList?.filter(tab => selectedTabIds.includes(tab.tabId)) || [];
  }, [tabList, selectedTabIds]);
  // 是否全选
  const isAllChecked = useMemo(() => {
    return tabList.length > 0 && selectedTabIds.length === tabList.length;
  }, [tabList, selectedTabIds]);

  // 全选框 indeterminate 状态
  const checkAllIndeterminate = useMemo(() => {
    return selectedTabIds.length > 0 && selectedTabIds.length < tabList.length;
  }, [tabList, selectedTabIds]);
  // 全选
  const handleSelectAll: CheckboxProps['onChange'] = e => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedTabIds(tabList.map(tab => tab.tabId));
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

  const handleGroupCopy = useCallback(() => {
    onCopy?.(groupId);
  }, [groupId]);

  const handleTabChange = useCallback((newData: TabItem) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemChange',
      params: [{ key: group.groupId }, newData],
    });
  }, []);

  const handleTabCopy = useCallback((tabs: TabItem[]) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemCopy',
      params: [{ groupId: group.groupId, tabs }],
    });
  }, []);

  const handleSelectedTabsCopy = useCallback(() => {
    handleTabCopy(selectedTabs);
  }, [selectedTabs]);

  const handleSelectedTabsCopyLinks = useCallback(() => {
    const tabLinks = tabListUtils.copyLinks(selectedTabs);
    const result = copyToClipboard(tabLinks);
    if (result) {
      messageApi.success($fmt('common.CopySuccess'));
    } else {
      messageApi.error($fmt('common.CopyFailed'));
    }
  }, [selectedTabs]);

  const handleTabsOpen = useCallback(() => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabsOpen',
      params: [group, selectedTabs],
    });

    const settings = settingsUtils.settings;
    if (settings[DELETE_AFTER_RESTORE] && !group?.isLocked) {
      setSelectedTabIds([]);
      setQuickSelectedTabIds([]);
    }
  }, [group, selectedTabs]);

  const handleTabRemove = useCallback(
    (tabs: TabItem[]) => {
      eventEmitter.emit('home:treeDataHook', {
        action: 'handleTabItemRemove',
        params: [group.groupId, tabs],
        callback: () => {
          setSelectedTabIds(selectedTabIds =>
            selectedTabIds.filter(id => !tabs.some(tab => tab.tabId === id)),
          );
          setQuickSelectedTabIds(ids =>
            ids.some(id => tabs.some(tab => tab.tabId === id)) ? [] : ids,
          );
        },
      });
    },
    [group.groupId],
  );
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

  const handleDragStateChange = useCallback(
    (value: DraggableStateItem, tabItem: TabItem) => {
      setDraggableState(value);
      setDraggingTabItem(tabItem);
    },
    [setDraggableState, setDraggingTabItem],
  );
  // 拖放到目标元素时触发 (targetData.groupId = 当前的groupId)
  const handleTabItemDrop: DndTabItemOnDropCallback = useCallback((...params) => {
    const params0 = { ...(params[0] || {}) };

    // 从已打开的浏览器标签页拖拽到列表标签页
    if (params0.sourceData?.from === 'opened-tabs') {
      params0.actionType = 'opened2tab';
    }

    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemDrop',
      params: [params0],
    });
  }, []);

  // 拖拽的元素drop时触发 (sourceData.groupId = 当前的groupId)
  const handleSourceTabItemDrop: OnSourceDropCallback<DndTabItemProps> = useCallback(
    ({ sourceData, targetData }) => {
      if (
        sourceData?.groupId !== targetData?.groupId &&
        draggingTabItem?.tabId &&
        sourceData?.selectedValues?.includes?.(draggingTabItem.tabId)
      ) {
        setSelectedTabIds(ids => {
          return ids.filter(id => !sourceData?.selectedValues?.includes(id));
        });
        setQuickSelectedTabIds(ids =>
          ids.some(id => sourceData?.selectedValues?.includes(id)) ? [] : ids,
        );
      }
    },
    [draggingTabItem, selectedTabIds, setSelectedTabIds],
  );

  const handleTabsSort = useCallback((sortType: string) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabsSort',
      params: [{ tagId: tagId!, groupId: group.groupId, sortType }],
    });
  }, []);

  const handleGroupAction = useCallback(
    (actionName: GroupActionName, actionGroupId: string) => {
      if (actionName === 'remove') {
        const settings = settingsUtils.settings || {};
        if (settings[CONFIRM_BEFORE_DELETING_GROUPS]) {
          setModalVisible(true);
        } else {
          onRemove?.();
        }
      } else if (actionName === 'restore') {
        onRestore?.();
      } else if (actionName === 'addGroupBefore') {
        onCreate?.(tagId!, actionGroupId, 'before');
      } else if (actionName === 'addGroupAfter') {
        onCreate?.(tagId!, actionGroupId, 'after');
      } else if (actionName === 'lock') {
        onChange?.({ isLocked: !isLocked });
      } else if (actionName === 'star') {
        onStarredChange?.(!isStarred);
      } else if (actionName === 'moveTo') {
        openMoveToModal?.({ groupId: actionGroupId });
      } else if (actionName === 'clone') {
        handleGroupCopy();
      } else if (actionName === 'dedup') {
        setDedupModalVisible(true);
      } else if (actionName === 'tabsSortAsc') {
        handleTabsSort('ascending');
      } else if (actionName === 'tabsSortDesc') {
        handleTabsSort('descending');
      }
    },
    [
      tagId,
      groupId,
      isLocked,
      isStarred,
      onRestore,
      onChange,
      onRemove,
      onCreate,
      onStarredChange,
      openMoveToModal,
      handleGroupCopy,
      handleTabsSort,
    ],
  );

  const { groupActions } = useGroupActions({
    groupId,
    tagId,
    tagLocked,
    isLocked,
    isStarred,
    tabList,
    allowGroupActions,
    onAction: handleGroupAction,
  });

  const selectedTabsActions: ActionOptionItem[] = useMemo(() => {
    const actionMap = tabsActionOptions.reduce(
      (result, option) => {
        result[option.actionName] = option;
        return result;
      },
      {} as Record<TabActionName, ActionOption<'tab'>>,
    );

    return [
      {
        key: 'remove',
        label: $fmt(actionMap['remove'].labelKey),
        icon: <DeleteOutlined />,
        disabled: tagLocked || isLocked,
        hoverColor: ENUM_COLORS.red,
        onClick: handleTabRemoveConfirm,
      },
      {
        key: 'open',
        label: $fmt(actionMap['open'].labelKey),
        icon: <ExportOutlined />,
        onClick: handleTabsOpen,
      },
      {
        key: 'moveTo',
        label: $fmt(actionMap['moveTo'].labelKey),
        icon: <SendOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => openMoveToModal?.({ groupId, tabs: selectedTabs }),
      },
      {
        key: 'copyLinks',
        label: $fmt(actionMap['copyLinks'].labelKey),
        icon: <CopyOutlined />,
        onClick: handleSelectedTabsCopyLinks,
      },
      {
        key: 'clone',
        label: $fmt(actionMap['clone'].labelKey),
        icon: <IconRepeat />,
        disabled: tagLocked || isLocked,
        onClick: handleSelectedTabsCopy,
      },
    ].filter(item => allowTabActions.includes(item.key as TabActionName));
  }, [
    $fmt,
    allowTabActions,
    tagLocked,
    isLocked,
    groupId,
    selectedTabs,
    handleTabsOpen,
    handleTabRemoveConfirm,
    handleSelectedTabsCopy,
    handleSelectedTabsCopyLinks,
    openMoveToModal,
  ]);

  /* 下面是分段加载相关 */
  const [rendering, setRendering] = useState(true);
  const [loading, setLoading] = useState(true);
  const tabListHeight = useMemo(() => {
    return tabList.length * 28 || 20;
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
      setBlockIndex(index => index + 1);
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
        className={classNames('tab-group-wrapper', isLocked && 'locked')}
        data-gid={groupId}
        $bgColor={selected ? token.colorPrimaryBg : token.colorBgContainer}
        ref={groupRef}
      >
        {/* 标签组 header 展示、操作区域 */}
        <StyledGroupHeader className="group-header select-none">
          <div className="group-header-top">
            {(isLocked || isStarred) && (
              <div className="group-status-wrapper">
                {isLocked && (
                  <LockFilled
                    style={{ fontSize: '22px', color: token.colorPrimaryHover }}
                  />
                )}
                {isStarred && (
                  <StarFilled
                    style={{ fontSize: '22px', color: token.colorPrimaryHover }}
                  />
                )}
              </div>
            )}
            <div className="group-name-wrapper">
              <EditInput
                value={groupName || UNNAMED_GROUP}
                disabled={!allowGroupActions.includes('rename') || tagLocked || isLocked}
                maxWidth={240}
                fontSize={20}
                iconSize={16}
                onValueChange={value => onChange?.({ groupName: value || UNNAMED_GROUP })}
              ></EditInput>
            </div>
            <div className="group-info">
              <span className="tab-count" style={{ color: ENUM_COLORS.volcano }}>
                {$fmt({
                  id: 'home.tab.count',
                  values: { count: tabList?.length || 0 },
                })}
              </span>
              <span className="group-create-time">{createTime || ''}</span>
            </div>
          </div>
          <ActionBtnList
            actionBtnStyle={actionBtnStyle}
            {...groupActions}
          ></ActionBtnList>
        </StyledGroupHeader>

        {/* tab 选择、操作区域 */}
        {tabList?.length > 0 && (
          <StyledTabActions>
            <div className="checkall-wrapper">
              <Checkbox
                checked={isAllChecked}
                indeterminate={checkAllIndeterminate}
                disabled={tagLocked || isLocked}
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
              <ActionBtnList
                actionBtnStyle={actionBtnStyle}
                outerList={selectedTabsActions}
                iconSize={14}
              ></ActionBtnList>
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
            ref={tabListRef}
            className={classNames('tab-list-wrapper', isLocked && 'locked')}
            style={{ minHeight: `${tabListHeight}px` }}
          >
            {rendering ? (
              <Skeleton title={false} paragraph={{ rows: 3 }}></Skeleton>
            ) : (
              <Spin spinning={loading} size="large">
                <Checkbox.Group
                  className="tab-list-checkbox-group"
                  value={selectedTabIds}
                  disabled={tagLocked || isLocked}
                  onChange={setSelectedTabIds}
                >
                  {tabListLocal.map((tab, index) => (
                    <DndComponent<DndTabItemProps>
                      canDrag={canDrag && !tagLocked && !isLocked}
                      key={tab.tabId || index}
                      data={{
                        ...tab,
                        index,
                        groupId,
                        dndKey,
                        from: 'tab-list',
                        selectedValues: selectedTabIds,
                        isDragging:
                          draggableState.type !== idleState.type &&
                          selectedTabIds.includes(tab.tabId) &&
                          selectedTabIds.includes(draggingTabItem?.tabId!),
                      }}
                      dndKey={dndKey}
                      mainField="tabId"
                      onDragStateChange={handleDragStateChange}
                      onDrop={handleTabItemDrop}
                      onSourceDrop={handleSourceTabItemDrop}
                    >
                      <TabListItem
                        key={tab.tabId || index}
                        tag={tag}
                        group={group}
                        {...tab}
                        highlight={
                          (tab.tabId != undefined &&
                            treeDataHook?.highlightTabId === tab.tabId) ||
                          quickSelectedTabIds.includes(tab.tabId)
                        }
                        onRemove={handleTabRemove}
                        onChange={handleTabChange}
                        onCopy={handleTabCopy}
                        onQuickSelect={handleTabQuickSelect}
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
          onOk={targetData => {
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
