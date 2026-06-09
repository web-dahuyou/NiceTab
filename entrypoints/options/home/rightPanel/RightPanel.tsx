import { useCallback, useEffect, useMemo, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { Empty, Checkbox } from 'antd';
import type { CheckboxProps } from 'antd';
import { CloseOutlined, CoffeeOutlined } from '@ant-design/icons';
import { isGroupSupported, classNames } from '~/entrypoints/common/utils';
import { getAdminTabInfo } from '~/entrypoints/common/tabs';
import {
  TAB_EVENTS,
  TAB_GROUP_EVENTS,
  ENUM_COLORS,
} from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import ToggleSidebarBtn from '../../components/ToggleSidebarBtn';
import ActionBtnList, { type ActionOptionItem } from '../../components/ActionBtnList';
import { StyledRightPanelWrapper } from '../Home.styled';
import { StyledOpenedTabsActions } from './OpenedTabs.styled';
import TabGroupItem, { type TabGroupItemProps } from './TabGroupItem';
import type { TabItemProps, QuickSelectFunc } from './TabItem';
import DndComponent, {
  idleState,
  type DraggableStateItem,
  type DragData,
} from '~/entrypoints/common/components/DndComponent';
import { dndKeys } from '../constants';

const dndKey = dndKeys.tabGroupItem;

export type OpenedGroupDragData = DragData & {
  selectedGroup: TabGroupItemProps;
  selectedTabs: Tabs.Tab[];
};

export default function RightPanel({
  collapsed,
  onCollapseChange,
}: {
  collapsed: boolean;
  onCollapseChange: (status: boolean) => void;
}) {
  const { $fmt } = useIntlUtls();
  const [tabs, setTabs] = useState<Tabs.Tab[]>([]);
  const [tabGroupList, setTabGroupList] = useState<TabGroupItemProps[]>([]);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedTabs = useMemo(() => {
    return tabs.filter(tab => tab.id && selectedTabIds.includes(tab.id));
  }, [tabs, selectedTabIds]);

  const initTabs = useCallback(async () => {
    setLoading(true);

    const allTabs = await browser.tabs.query({ currentWindow: true });
    const { tab: adminTab } = await getAdminTabInfo();
    const _tabs = allTabs.filter(tab => tab.id && tab.id !== adminTab?.id);
    setTabs(_tabs);

    let groupList: TabGroupItemProps[] = [];
    if (!isGroupSupported()) {
      groupList = _tabs.map(tab => ({
        groupId: -1,
        groupName: '',
        tabs: [tab],
      }));
    } else {
      groupList = _tabs.reduce<TabGroupItemProps[]>((result, tab) => {
        const groupId = tab.groupId || -1;
        if (groupId === -1) {
          return result.concat({ groupId: -1, groupName: '', tabs: [tab] });
        }

        const group = result.find(item => item.groupId === groupId);
        if (!group) {
          return result.concat({ groupId, groupName: '', tabs: [tab] });
        }

        group.tabs.push(tab);
        return result;
      }, []);

      if (browser.tabGroups?.get) {
        for (const group of groupList) {
          if (group.groupId === -1) continue;
          const tabGroup = await browser.tabGroups.get(group.groupId);
          group.groupName = tabGroup?.title || group.groupName;
          group.collapsed = tabGroup?.collapsed;
          group.color = tabGroup?.color;
        }
      }
    }

    setTabGroupList(groupList);
    setLoading(false);
  }, []);

  const handleTabDiscard = useCallback(
    async (tab: Tabs.Tab) => {
      if (tab.active || tab.discarded) return;

      tab.id && (await browser.tabs.discard(tab.id));
      initTabs();
    },
    [initTabs],
  );

  const handleTabRemove = useCallback(
    async (tab: Tabs.Tab) => {
      if (tab.id) await browser.tabs.remove(tab.id);
      initTabs();
    },
    [initTabs],
  );

  const handleTabAction = useCallback<Required<TabItemProps>['onAction']>(
    (action, tab) => {
      if (!tab.id) return;

      switch (action) {
        case 'active':
          browser.tabs.update(tab.id, { active: true });
          break;
        case 'discard':
          handleTabDiscard(tab);
          break;
        case 'remove':
          handleTabRemove(tab);
          break;
        default:
          break;
      }
    },
    [],
  );

  // 批量删除
  const handleBatchRemove = useCallback(async () => {
    if (selectedTabIds.length === 0) return;

    await browser.tabs.remove(selectedTabIds);
    setSelectedTabIds([]);
    initTabs();
  }, [selectedTabIds, initTabs]);

  // 批量休眠
  const handleBatchDiscard = useCallback(async () => {
    if (selectedTabIds.length === 0) return;

    const discardableTabs = selectedTabs.filter(tab => !tab.active && !tab.discarded);
    const discardableTabIds = discardableTabs.map(tab => tab.id!).filter(Boolean);

    if (discardableTabIds.length > 0) {
      await Promise.all(discardableTabIds.map(id => browser.tabs.discard(id)));
      setSelectedTabIds([]);
      initTabs();
    }
  }, [selectedTabs, initTabs]);

  // 全选相关
  const isAllChecked = useMemo(() => {
    return tabs.length > 0 && selectedTabIds.length === tabs.length;
  }, [tabs, selectedTabIds]);

  const checkAllIndeterminate = useMemo(() => {
    return selectedTabIds.length > 0 && selectedTabIds.length < tabs.length;
  }, [tabs, selectedTabIds]);

  const handleSelectAll: CheckboxProps['onChange'] = e => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedTabIds(tabs.map(tab => tab.id!));
    } else {
      setSelectedTabIds([]);
    }
  };

  // 批量操作按钮配置
  const selectedTabsActions: ActionOptionItem[] = useMemo(() => {
    return [
      {
        key: 'discard',
        label: $fmt('common.hibernate'),
        icon: <CoffeeOutlined />,
        onClick: handleBatchDiscard,
      },
      {
        key: 'remove',
        label: $fmt('common.remove'),
        icon: <CloseOutlined />,
        hoverColor: ENUM_COLORS.red,
        onClick: handleBatchRemove,
      },
    ];
  }, [$fmt, handleBatchRemove, handleBatchDiscard]);

  // 快捷选择，起始位置
  const [quickSelectedTabIds, setQuickSelectedTabIds] = useState<number[]>([]);
  const handleTabQuickSelect: QuickSelectFunc = async (tab, selected) => {
    // 由于快捷选择直接复用了checkbox的选择，onChange 回调中的setSelectedTabIds会覆盖quickSelect的setSelectedTabIds
    // 所以这里延时100ms，等待onChange回调执行完毕，再执行后面的操作
    await new Promise(r => setTimeout(r, 100));

    if (quickSelectedTabIds.length === 0) {
      selected && setQuickSelectedTabIds([tab.id!]);
    } else if (quickSelectedTabIds.length === 1) {
      if (selected) {
        let startIndex = tabs.findIndex(item => item.id === quickSelectedTabIds[0]);
        let endIndex = tabs.findIndex(item => item.id === tab.id);
        if (startIndex > endIndex) {
          [startIndex, endIndex] = [endIndex, startIndex];
        }

        const _selectedTabIds = tabs
          .slice(startIndex, endIndex + 1)
          .map(item => item.id!);

        const newSelectedIds = [...new Set([...selectedTabIds, ..._selectedTabIds])];
        setSelectedTabIds(newSelectedIds);
        setQuickSelectedTabIds([]);
      } else {
        quickSelectedTabIds[0] === tab.id && setQuickSelectedTabIds([]);
      }
    } else {
      setQuickSelectedTabIds([]);
    }
  };

  const [draggableState, setDraggableState] = useState<DraggableStateItem>(idleState);
  const [draggingTabItem, setDraggingTabItem] = useState<Tabs.Tab | null>(null);
  const handleDragStateChange = useCallback(
    (value: DraggableStateItem, tabItem: Tabs.Tab) => {
      setDraggableState(value);
      setDraggingTabItem(tabItem);
    },
    [setDraggableState, setDraggingTabItem],
  );

  useEffect(() => {
    initTabs();

    TAB_EVENTS.forEach(event => {
      browser.tabs[event]?.addListener(initTabs);
    });
    TAB_GROUP_EVENTS.forEach(event => {
      browser.tabGroups?.[event]?.addListener(initTabs);
    });

    return () => {
      TAB_EVENTS.forEach(event => {
        browser.tabs[event]?.removeListener(initTabs);
      });
      TAB_GROUP_EVENTS.forEach(event => {
        browser.tabGroups?.[event]?.removeListener(initTabs);
      });
    };
  }, []);

  return (
    <StyledRightPanelWrapper className="opened-tabs-panel" $collapsed={collapsed}>
      <div className={classNames('right-panel-inner-box', collapsed && 'collapsed')}>
        <div className="right-panel-action-box">
          <ToggleSidebarBtn
            collapsed={collapsed}
            position="right"
            onCollapseChange={onCollapseChange}
          ></ToggleSidebarBtn>
        </div>
        <div className="right-panel-inner-content">
          <div className="opened-tabs-title">{$fmt('common.openedTabs')}</div>

          {/* 全选和批量操作区域 */}
          {tabs.length > 0 && (
            <StyledOpenedTabsActions>
              <div className="checkall-wrapper">
                <Checkbox
                  checked={isAllChecked}
                  indeterminate={checkAllIndeterminate}
                  onChange={handleSelectAll}
                />
                <span
                  className="selected-count-text"
                  style={{ color: ENUM_COLORS.volcano }}
                >
                  {`${selectedTabIds.length} / ${tabs.length}`}
                </span>
              </div>
              {selectedTabIds.length > 0 && (
                <ActionBtnList
                  actionBtnStyle="icon"
                  outerList={selectedTabsActions}
                  iconSize={14}
                  gap={10}
                />
              )}
            </StyledOpenedTabsActions>
          )}

          <div className="opened-tabs-list">
            {tabGroupList?.length > 0 || loading ? (
              <Checkbox.Group
                className="tab-list-checkbox-group"
                value={selectedTabIds}
                onChange={setSelectedTabIds}
              >
                {tabGroupList.map((group, index) => (
                  <DndComponent<OpenedGroupDragData>
                    key={`opened-group-${index}`}
                    canDrag={group.groupId !== -1}
                    canDrop={false}
                    dndKey={dndKey}
                    data={{
                      ...group,
                      index,
                      groupId: group.groupId,
                      dndKey,
                      from: 'opened-tab-group',
                      selectedValues: selectedTabIds,
                      selectedGroup: group,
                      selectedTabs,
                    }}
                    mainField="groupId"
                    showDragPreview
                    previewContent={group.groupName}
                  >
                    <TabGroupItem
                      key={~group.groupId || index}
                      group={group}
                      selectedTabs={selectedTabs}
                      quickSelectedTabIds={quickSelectedTabIds}
                      draggableState={draggableState}
                      draggingTabItem={draggingTabItem}
                      onAction={handleTabAction}
                      onQuickSelect={handleTabQuickSelect}
                      onDragStateChange={handleDragStateChange}
                    />
                  </DndComponent>
                ))}
              </Checkbox.Group>
            ) : (
              <div className="no-data">
                <Empty description={$fmt('home.emptyTip')}></Empty>
              </div>
            )}
          </div>
        </div>
      </div>
    </StyledRightPanelWrapper>
  );
}
