import { useState, useCallback, useEffect } from 'react';
import { Tabs } from 'wxt/browser';
import styled from 'styled-components';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import DndComponent, {
  type DraggableStateItem,
} from '~/entrypoints/common/components/DndComponent';
import TabItem, { type TabItemProps } from './TabItem';
import { StyledGroupWrapper } from './OpenedTabs.styled';
import { dndKeys } from '../constants';

const dndKey = dndKeys.tabItem;

export type TabGroupItemProps = {
  groupId: number;
  groupName: string;
  color?: string;
  collapsed?: boolean;
  tabs: Tabs.Tab[];
};

export type TabGroupItemParams = {
  group: TabGroupItemProps;
  onAction?: TabItemProps['onAction'];
  onDragStateChange?: (value: DraggableStateItem, tab: Tabs.Tab) => void;
};

export default function TabGroupItem({
  group,
  onAction,
  onDragStateChange,
}: TabGroupItemParams) {
  const { $fmt } = useIntlUtls();
  const [collapsed, setCollapsed] = useState(group.collapsed);

  const onToggle = useCallback(() => {
    setCollapsed(value => !value);
  }, []);

  const autoFocus = useCallback(() => {
    const hasActiveTab = group.tabs?.find(tab => tab.active);
    if (hasActiveTab) {
      setCollapsed(false);
    }
  }, [group.tabs]);

  useEffect(() => {
    setTimeout(() => {
      autoFocus();
    }, 30);
  }, [autoFocus]);

  // 如果是未分组的标签（groupId === -1），直接渲染标签项列表
  if (group.groupId === -1) {
    return (
      <>
        {group.tabs?.map((tab, index) => {
          return (
            <DndComponent
              key={tab.id || index}
              canDrag={true}
              canDrop={false}
              dndKey={dndKey}
              data={{
                ...tab,
                index,
                groupId: group.groupId,
                dndKey,
                selectedValues: [],
              }}
              mainField="id"
              onDragStateChange={value => onDragStateChange?.(value, tab)}
            >
              <TabItem key={tab.id} tab={tab} onAction={onAction}></TabItem>
            </DndComponent>
          );
        })}
      </>
    );
  }

  return (
    <StyledGroupWrapper
      className={classNames(collapsed && 'collapsed')}
      $color={group.color}
    >
      <div className="group-header-btn" onClick={onToggle}>
        <div className="collapse-icon-btn">
          {collapsed ? <RightOutlined /> : <DownOutlined />}
        </div>
        <div className="group-name">{group.groupName}</div>
      </div>
      <div className="tab-list">
        {group.tabs?.map((tab, index) => {
          const tabId = String(tab.id ?? `opened-${group.groupId}-${index}`);
          const tabTitle = tab.title || tab.url || '';

          return (
            <DndComponent
              key={tabId}
              canDrag={true}
              canDrop={false}
              dndKey={dndKey}
              data={{
                ...tab,
                index,
                groupId: String(group.groupId),
                dndKey,
                selectedValues: [],
              }}
              mainField="id"
              onDragStateChange={value => onDragStateChange?.(value, tab)}
            >
              <div className="tab-list-item" title={tabTitle}>
                <i className="group-color-flag"></i>
                <TabItem key={tab.id} tab={tab} onAction={onAction}></TabItem>
              </div>
            </DndComponent>
          );
        })}
      </div>
    </StyledGroupWrapper>
  );
}
