import { useRef, useState, useCallback, useEffect } from 'react';
import { Tabs } from 'wxt/browser';
import { RightOutlined, DownOutlined, ExportOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import TabItem from './TabItem';
import { StyledGroupWrapper } from './App.styled';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';

export interface GroupListItem {
  groupId: number;
  groupName: string;
  tabs: Tabs.Tab[];
  collapsed?: boolean;
  color?: string;
}

export type TabActions = 'active' | 'discard' | 'remove' | 'send' | 'sendGroup';
export interface GroupItemProps {
  group: GroupListItem;
  onAction: (action: TabActions, tab: Tabs.Tab) => void;
  checkTabCanSend: (tab: Tabs.Tab) => { canSend: boolean; reason?: string };
}

export default function TabGroupItem({ group, onAction, checkTabCanSend }: GroupItemProps) {
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

  const handleGroupAction = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>, action: TabActions) => {
      event.stopPropagation();
      // 发送标签组时，将组内所有标签页传递回去。
      // 但 onAction 签名通常只接受一个 tab。
      // 这里我们传递组内的第一个 tab，但在 actionHandler 中我们需要处理整个组。
      // 或者我们可以修改 onAction 签名，但这改动较大。
      // 这里的约定是：当 action 为 'sendGroup' 时，tab 参数代表该组的一个 样本tab (通常是第一个)，
      // 后续处理 (strategyHandler -> sendGroupTabs) 会根据 tab.groupId 找到所有 tabs。
      // 但 tabs.ts 中的 sendGroupTabs 接收的是 tabs 数组。
      // 让我们看看 App.tsx 中 handleTabAction 是怎么写的。
      // 它调用 strategyHandler(ENUM_ACTION_NAME.SEND_GROUP_TABS, tab);
      // 然后 strategyHandler -> actionHandler -> tabUtils.sendGroupTabs(undefined, tab);
      // 等等，tabs.ts 中 sendGroupTabs 签名是 (tabs: Tabs.Tab[], targetData?: SendTargetProps)
      // 而 actionHandler 中调用的是 tabUtils.sendLeftTabs(targetData, tab) 类似的。
      // 我们需要更新 actionHandler 来正确调用 sendGroupTabs。
      if (group.tabs?.length > 0) {
        onAction('sendGroup', group.tabs[0]);
      }
    },
    [group, onAction],
  );

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
        <StyledActionIconBtn
          className="group-action-btn"
          $size={18}
          title={$fmt('common.sendGroup')}
          onClick={event => handleGroupAction(event, 'sendGroup')}
        >
          <ExportOutlined />
        </StyledActionIconBtn>
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
