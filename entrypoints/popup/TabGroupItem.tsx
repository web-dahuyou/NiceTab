import { useRef, useState, useCallback, useEffect } from 'react';
import { Tabs } from 'wxt/browser';
import {
  RightOutlined,
  DownOutlined,
  CloseOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { ENUM_COLORS } from '~/entrypoints/common/constants';
import ActionBtnList, {
  type ActionOptionItem,
} from '@/entrypoints/common/components/ActionBtnList';
import TabItem from './TabItem';
import { StyledGroupWrapper } from './App.styled';

export interface GroupListItem {
  groupId: number;
  groupName: string;
  tabs: Tabs.Tab[];
  collapsed?: boolean;
  color?: string;
}

export type TabActions = 'active' | 'discard' | 'remove';
export interface GroupItemProps {
  group: GroupListItem;
  onAction: (action: TabActions, tab: Tabs.Tab) => void;
  onGroupAction?: (action: TabActions, group: GroupListItem) => void;
}

export default function TabGroupItem({ group, onAction, onGroupAction }: GroupItemProps) {
  const { $fmt } = useIntlUtls();
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

  // 分组级批量操作
  const handleGroupDiscard = useCallback(async () => {
    const discardableTabs = group.tabs.filter(tab => !tab.active && !tab.discarded);
    const discardableTabIds = discardableTabs.map(tab => tab.id!).filter(Boolean);
    if (discardableTabIds.length > 0) {
      await Promise.all(discardableTabIds.map(id => browser.tabs.discard(id)));
      onGroupAction?.('discard', group);
    }
  }, [group, onGroupAction]);

  const handleGroupRemove = useCallback(async () => {
    const tabIds = group.tabs.map(tab => tab.id!).filter(Boolean);
    if (tabIds.length > 0) {
      await browser.tabs.remove(tabIds);
      onGroupAction?.('remove', group);
    }
  }, [group, onGroupAction]);

  const groupActions: ActionOptionItem[] = useMemo(() => {
    const discardableTabs = group.tabs.filter(tab => !tab.active && !tab.discarded);

    return [
      {
        key: 'discard',
        label: $fmt('common.hibernate'),
        icon: <CoffeeOutlined />,
        disabled: !discardableTabs?.length,
        onClick: handleGroupDiscard,
      },
      {
        key: 'remove',
        label: $fmt('common.remove'),
        icon: <CloseOutlined />,
        hoverColor: ENUM_COLORS.red,
        onClick: handleGroupRemove,
      },
    ];
  }, [group]);

  if (group.groupId === -1) {
    return group.tabs?.map(tab => <TabItem key={tab.id} tab={tab} onAction={onAction} />);
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
        <div className="group-actions" onClick={e => e.stopPropagation()}>
          <ActionBtnList actionBtnStyle="icon" outerList={groupActions} gap={8} />
        </div>
      </div>
      <div className="tab-list">
        {group.tabs?.map(tab => (
          <div className="tab-list-item" key={tab.id}>
            <i className="group-color-flag"></i>
            <TabItem tab={tab} onAction={onAction} />
          </div>
        ))}
      </div>
    </StyledGroupWrapper>
  );
}
