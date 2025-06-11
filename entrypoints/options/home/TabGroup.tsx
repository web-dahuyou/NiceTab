import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { theme, message, Modal, Checkbox, Spin, Skeleton } from 'antd';
import type { CheckboxProps } from 'antd';
import {
  CloseOutlined,
  DeleteOutlined,
  LockOutlined,
  LockFilled,
  UnlockOutlined,
  StarOutlined,
  StarFilled,
  ExportOutlined,
  SendOutlined,
  CopyOutlined,
  BlockOutlined,
} from '@ant-design/icons';
import copyToClipboard from 'copy-to-clipboard';
import { IconRepeat } from '~/entrypoints/common/components/icon/CustomIcon';
import { GroupItem, TabItem, ActionBtnStyle } from '~/entrypoints/types';
import { type LocaleKeys } from '~/entrypoints/common/locale';
import {
  ENUM_COLORS,
  UNNAMED_GROUP,
  ENUM_SETTINGS_PROPS,
} from '~/entrypoints/common/constants';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils, settingsUtils } from '~/entrypoints/common/storage';
import DndComponent from '~/entrypoints/common/components/DndComponent';
import DropComponent from '~/entrypoints/common/components/DropComponent';

import { HomeContext } from './hooks/treeData';
import { eventEmitter } from './hooks/homeCustomEvent';
import EditInput from '../components/EditInput';
import ActionBtnList, { type ActionOptionItem } from '../components/ActionBtnList';
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
import {
  dndKeys,
  defaultGroupActions,
  defaultTabActions,
  groupActionOptions,
  tabsActionOptions,
  type ActionOption,
} from './constants';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';
import useMultiSelection from './hooks/multiSelection';

const dndKey = dndKeys.tabItem;
const {
  CONFIRM_BEFORE_DELETING_TABS,
  DELETE_AFTER_RESTORE,
  GROUP_ACTION_BTNS_COMMONLY_USED,
} = ENUM_SETTINGS_PROPS;

type TabGroupProps = GroupItem & {
  tagLocked?: boolean;
  canDrag?: boolean;
  canDrop?: boolean;
  allowGroupActions?: string[];
  allowTabActions?: string[];
  selected?: boolean;
  actionBtnStyle?: ActionBtnStyle;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove?: () => void;
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
  actionBtnStyle = 'text',
  onChange,
  onRemove,
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
    [groupId, groupName, createTime, isLocked, isStarred, selected]
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

  const handleGroupCopy = useCallback(() => {
    onCopy?.(groupId);
  }, [groupId]);

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

  const handleTabCopy = useCallback((tabs: TabItem[]) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemCopy',
      params: [{ groupId: group.groupId, tabs }],
    });
  }, []);

  const handleSelectedTabsCopy = useCallback(() => {
    handleTabCopy(selectedTabs);
  }, [selectedTabs]);

  const handleTabsOpen = useCallback(() => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabsOpen',
      params: [group, selectedTabs],
    });

    const settings = settingsUtils.settings;
    if (settings[DELETE_AFTER_RESTORE] && !group?.isLocked) {
      setSelectedTabIds([]);
    }
  }, [group, selectedTabs]);

  const handleTabRemove = useCallback(
    (tabs: TabItem[]) => {
      eventEmitter.emit('home:treeDataHook', {
        action: 'handleTabItemRemove',
        params: [group.groupId, tabs],
        callback: () => {
          setSelectedTabIds((selectedTabIds) =>
            selectedTabIds.filter((id) => !tabs.some((tab) => tab.tabId === id))
          );
        },
      });
    },
    [group.groupId]
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

  const handleTabItemDrop: DndTabItemOnDropCallback = useCallback((...params) => {
    eventEmitter.emit('home:treeDataHook', {
      action: 'handleTabItemDrop',
      params,
    });
  }, []);

  const getGroupActionOptions: () => ActionOptionItem[] = useCallback(() => {
    const actionMap = groupActionOptions.reduce<Record<string, ActionOption>>(
      (result, option) => {
        result[option.actionName] = option;
        return result;
      },
      {}
    );

    const btns: ActionOptionItem[] = [
      {
        key: 'remove',
        label: $fmt(actionMap['remove'].labelKey),
        icon: <CloseOutlined />,
        disabled: tagLocked || isLocked,
        hoverColor: ENUM_COLORS.red,
        // validator: () => !isLocked,
        onClick: () => setModalVisible(true),
      },
      {
        key: 'restore',
        label: $fmt(actionMap['restore'].labelKey),
        icon: <ExportOutlined />,
        onClick: () => onRestore?.(),
      },
      {
        key: 'lock',
        label: $fmt(
          isLocked ? 'home.tabGroup.unlock' : 'home.tabGroup.lock'
        ) as LocaleKeys,
        disabled: tagLocked,
        icon: isLocked ? <UnlockOutlined /> : <LockOutlined />,
        onClick: () => onChange?.({ isLocked: !isLocked }),
      },
      {
        key: 'star',
        label: $fmt(
          isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star'
        ) as LocaleKeys,
        disabled: tagLocked,
        icon: <StarOutlined />,
        onClick: () => onStarredChange?.(!isStarred),
      },
      {
        key: 'moveTo',
        label: $fmt(actionMap['moveTo'].labelKey),
        disabled: tagLocked,
        icon: <SendOutlined />,
        onClick: () => openMoveToModal?.({ groupId }),
      },
      {
        key: 'copyGroup',
        label: $fmt(actionMap['copyGroup'].labelKey),
        disabled: tagLocked,
        icon: <IconRepeat />,
        onClick: handleGroupCopy,
      },
      {
        key: 'copyLinks',
        label: $fmt(actionMap['copyLinks'].labelKey),
        icon: <CopyOutlined />,
        onClick: handleCopy,
      },
      {
        key: 'dedup',
        label: $fmt(actionMap['dedup'].labelKey),
        icon: <BlockOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => setDedupModalVisible(true),
      },
    ];

    return btns.filter((item) => {
      const isAllowed = allowGroupActions.includes(item.key);
      const isValid = item.validator?.() ?? true;
      return isAllowed && isValid;
    });
  }, [
    $fmt,
    allowGroupActions,
    groupId,
    isLocked,
    isStarred,
    onRestore,
    onChange,
    onStarredChange,
    openMoveToModal,
    handleCopy,
    handleGroupCopy,
  ]);

  const groupActions = useMemo(() => {
    const settings = settingsUtils.settings;
    const outerList: ActionOptionItem[] = [],
      innerList: ActionOptionItem[] = [];

    const groupActionBtnOptions = getGroupActionOptions();

    groupActionBtnOptions.forEach((item) => {
      if (settings[GROUP_ACTION_BTNS_COMMONLY_USED]?.includes(item.key)) {
        outerList.push(item);
      } else {
        innerList.push(item);
      }
    });

    return { outerList, innerList };
  }, [getGroupActionOptions]);

  const selectedTabsActions: ActionOptionItem[] = useMemo(() => {
    const actionMap = tabsActionOptions.reduce<Record<string, ActionOption>>(
      (result, option) => {
        result[option.actionName] = option;
        return result;
      },
      {}
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
        key: 'copy',
        label: $fmt(actionMap['copy'].labelKey),
        icon: <CopyOutlined />,
        disabled: tagLocked || isLocked,
        onClick: handleSelectedTabsCopy,
      },
      {
        key: 'moveTo',
        label: $fmt(actionMap['moveTo'].labelKey),
        icon: <SendOutlined />,
        disabled: tagLocked || isLocked,
        onClick: () => openMoveToModal?.({ groupId, tabs: selectedTabs }),
      },
    ].filter((item) => allowTabActions.includes(item.key));
  }, [
    $fmt,
    groupId,
    selectedTabs,
    handleTabsOpen,
    handleTabRemoveConfirm,
    handleSelectedTabsCopy,
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
                onValueChange={(value) =>
                  onChange?.({ groupName: value || UNNAMED_GROUP })
                }
              ></EditInput>
            </div>
            <div className="group-info">
              <span className="tab-count" style={{ color: ENUM_COLORS.volcano }}>
                {$fmt({
                  id: 'home.tab.count',
                  values: { count: tabList?.length || 0 },
                })}
              </span>
              <span className="group-create-time">{createTime}</span>
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
                      canDrag={
                        canDrag && !tagLocked && !isLocked && selectedTabIds.length === 0
                      }
                      key={tab.tabId || index}
                      data={{ ...tab, index, groupId, dndKey }}
                      dndKey={dndKey}
                      onDrop={handleTabItemDrop}
                    >
                      <TabListItem
                        key={tab.tabId || index}
                        tag={tag}
                        group={group}
                        {...tab}
                        highlight={
                          tab.tabId != undefined &&
                          treeDataHook?.highlightTabId === tab.tabId
                        }
                        onRemove={handleTabRemove}
                        onChange={handleTabChange}
                        onCopy={handleTabCopy}
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
