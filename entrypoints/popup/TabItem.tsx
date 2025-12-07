import React, { useRef, useCallback, useEffect } from 'react';
import { Tabs } from 'wxt/browser';
import { CloseOutlined, CoffeeOutlined, ExportOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import Favicon from '~/entrypoints/common/components/Favicon';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { StyledTabItem } from './App.styled';

export type TabActions = 'active' | 'discard' | 'remove' | 'send' | 'sendGroup';
interface TabItemProps {
  tab: Tabs.Tab;
  onAction: (action: TabActions, tab: Tabs.Tab) => void;
  checkTabCanSend: (tab: Tabs.Tab) => { canSend: boolean; reason?: string };
}

export default function TabItem({ tab, onAction, checkTabCanSend }: TabItemProps) {
  const { $fmt } = useIntlUtls();
  const tabRef = useRef<HTMLDivElement>(null);
  const handleAction = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>, action: TabActions) => {
      if (action === 'discard' || action === 'remove' || action === 'send') {
        event.stopPropagation();
      }
      onAction(action, tab);
    },
    [tab],
  );

  useEffect(() => {
    if (tab.active) {
      tabRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [tab.active]);

  const { canSend, reason } = checkTabCanSend(tab);

  return (
    <StyledTabItem
      ref={tabRef}
      className={classNames(
        'tab-item',
        tab.active && 'active',
        tab.discarded && 'discarded',
      )}
      title={tab.title}
      onClick={event => handleAction(event, 'active')}
    >
      <Favicon pageUrl={tab.url!} favIconUrl={tab.favIconUrl}></Favicon>
      <span className="tab-item-title">{tab.title}</span>

      <StyledActionIconBtn
        className="action-icon-btn send-btn"
        $size={16}
        disabled={!canSend}
        title={!canSend ? reason : $fmt('common.sendCurrentTab')}
        onClick={event => canSend && handleAction(event, 'send')}
      >
        <ExportOutlined />
      </StyledActionIconBtn>

      {!tab.active && (
        <StyledActionIconBtn
          className={classNames('action-icon-btn', tab.discarded && 'btn-discarded')}
          $size={16}
          title={$fmt(tab.discarded ? 'common.hibernated' : 'common.hibernate')}
          onClick={event => handleAction(event, 'discard')}
        >
          <CoffeeOutlined />
        </StyledActionIconBtn>
      )}

      <StyledActionIconBtn
        className="action-icon-btn"
        $size={16}
        $hoverColor="red"
        title={$fmt('common.remove')}
        onClick={event => handleAction(event, 'remove')}
      >
        <CloseOutlined />
      </StyledActionIconBtn>
    </StyledTabItem>
  );
}
