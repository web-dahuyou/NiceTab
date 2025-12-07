import { useRef, useState, useCallback, useEffect } from 'react';
import { Tabs } from 'wxt/browser';
import { RightOutlined, DownOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import TabItem from './TabItem';
import { StyledGroupWrapper } from './App.styled';

export interface GroupListItem {
  groupId: number;
  groupName: string;
  tabs: Tabs.Tab[];
  collapsed?: boolean;
  color?: string;
}

export type TabActions = 'active' | 'discard' | 'remove' | 'send';
export interface GroupItemProps {
  group: GroupListItem;
  onAction: (action: TabActions, tab: Tabs.Tab) => void;
  checkTabCanSend: (tab: Tabs.Tab) => { canSend: boolean; reason?: string };
}

export default function TabGroupItem({ group, onAction, checkTabCanSend }: GroupItemProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(group.collapsed);
  const onToggle = useCallback(() => {
    setCollapsed(value => !value);
  }, []);

  const autoFocus = useCallback(() => {
    const hasActiveTab = group.tabs?.find(tab => tab.active);
    // 如果有激活的tab，则自动展开标签组
    if (hasActiveTab) {
      setCollapsed(false);
    }
  }, [group]);

  useEffect(() => {
    setTimeout(() => {
      autoFocus();
    }, 30);
  }, []);

  if (group.groupId === -1) {
    return group.tabs?.map(tab => (
      <TabItem
        key={tab.id}
        tab={tab}
        onAction={onAction}
        checkTabCanSend={checkTabCanSend}
      />
    ));
  }

  return (
    <StyledGroupWrapper
      ref={groupRef}
      className={classNames(collapsed && 'collapsed')}
      $color={group.color}
    >
      <div className="group-title" onClick={onToggle}>
        <div className="collapse-icon-btn">
          {collapsed ? <RightOutlined /> : <DownOutlined />}
        </div>
        <div className="group-name">{group.groupName}</div>
      </div>
      <div className="tab-list">
        {group.tabs?.map(tab => (
          <div className="tab-list-item" key={tab.id}>
            <i className="group-color-flag"></i>
            <TabItem tab={tab} onAction={onAction} checkTabCanSend={checkTabCanSend} />
          </div>
        ))}
      </div>
    </StyledGroupWrapper>
  );
}
