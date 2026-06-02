import { useCallback, useEffect, useState } from 'react';
import { browser, Tabs } from 'wxt/browser';
import { theme, Spin, Empty } from 'antd';
import { isGroupSupported, classNames } from '~/entrypoints/common/utils';
import { getAdminTabInfo } from '~/entrypoints/common/tabs';
import { TAB_EVENTS } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { DraggableStateItem } from '~/entrypoints/common/components/DndComponent';
import ToggleSidebarBtn from '../../components/ToggleSidebarBtn';
import { StyledRightPanelWrapper } from '../Home.styled';
import TabGroupItem, { type TabGroupItemProps } from './TabGroupItem';
import type { TabActions, TabItemProps } from './TabItem';

export default function RightPanel({
  collapsed,
  onCollapseChange,
}: {
  collapsed: boolean;
  onCollapseChange: (status: boolean) => void;
}) {
  const { $fmt } = useIntlUtls();
  const [tabGroupList, setTabGroupList] = useState<TabGroupItemProps[]>([]);
  const [loading, setLoading] = useState(true);

  const initTabs = useCallback(async () => {
    setLoading(true);

    const allTabs = await browser.tabs.query({ currentWindow: true });
    const { tab: adminTab } = await getAdminTabInfo();
    const tabs = allTabs.filter(tab => tab.id !== adminTab?.id);

    let groupList: TabGroupItemProps[] = [];
    if (!isGroupSupported()) {
      groupList = tabs.map(tab => ({
        groupId: -1,
        groupName: '',
        tabs: [tab],
      }));
    } else {
      groupList = tabs.reduce<TabGroupItemProps[]>((result, tab) => {
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

  useEffect(() => {
    initTabs();

    TAB_EVENTS.forEach(event => {
      browser.tabs[event]?.addListener(initTabs);
    });

    return () => {
      TAB_EVENTS.forEach(event => {
        browser.tabs[event]?.removeListener(initTabs);
      });
    };
  }, []);

  const handleDragStateChange = useCallback(
    (value: DraggableStateItem, tab: Tabs.Tab) => {
      console.log('rightPanel--handleDragStateChange', value, tab);
    },
    [],
  );

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
          <div className="opened-tabs-list">
            <Spin spinning={loading}>
              {tabGroupList?.length > 0 ? (
                tabGroupList.map((group, groupIndex) => (
                  <TabGroupItem
                    key={~group.groupId || groupIndex}
                    group={group}
                    onDragStateChange={handleDragStateChange}
                    onAction={handleTabAction}
                  />
                ))
              ) : (
                <div className="no-data">
                  <Empty description={$fmt('home.emptyTip')}></Empty>
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>
    </StyledRightPanelWrapper>
  );
}
