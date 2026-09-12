import { useCallback, useState } from 'react';
import { RightOutlined, DownOutlined, PushpinFilled } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type {
  SnapshotRecord,
  WindowSnapshotGroup,
  WindowSnapshotTab,
} from '~/entrypoints/types';
import Favicon from '~/entrypoints/common/components/Favicon';
import { StyledGroupItem, StyledTabRow } from './Snapshots.styled';

function TabRow({ tab }: { tab: WindowSnapshotTab }) {
  const { $fmt } = useIntlUtls();
  return (
    <StyledTabRow>
      <Favicon pageUrl={tab.url} favIconUrl={tab.favIconUrl} />
      <div className="detail-tab-content">
        <div className="detail-tab-title">{tab.title || tab.url}</div>
        <div className="detail-tab-url" title={tab.url}>
          {tab.url}
        </div>
      </div>
      {tab.pinned && (
        <PushpinFilled className="detail-tab-icon" title={$fmt('snapshots.pinned')} />
      )}
    </StyledTabRow>
  );
}

function GroupItem({ group }: { group: WindowSnapshotGroup }) {
  const { $fmt } = useIntlUtls();
  const [collapsed, setCollapsed] = useState(group.collapsed);

  const onToggle = useCallback(() => {
    setCollapsed(value => !value);
  }, []);

  return (
    <StyledGroupItem className={classNames(collapsed && 'collapsed')}>
      <div className="detail-group-header" onClick={onToggle}>
        <div className="detail-collapse-icon">
          {collapsed ? <RightOutlined /> : <DownOutlined />}
        </div>
        <span className="detail-group-color" style={{ backgroundColor: group.color }} />
        <span className="detail-group-title">
          {group.title || $fmt('common.unnamed')}
        </span>
      </div>
      <div className="detail-tab-list">
        {group.tabs.map(tab => (
          <div className="detail-tab-item" key={tab.id}>
            <span className="detail-tab-color" style={{ backgroundColor: group.color }} />
            <TabRow tab={tab} />
          </div>
        ))}
      </div>
    </StyledGroupItem>
  );
}

export default function SnapshotDetails({ record }: { record: SnapshotRecord }) {
  return (
    <div className="snapshot-details">
      {record.items.map(item => {
        if (item.type === 'group') {
          return <GroupItem key={item.id} group={item} />;
        }
        return <TabRow key={item.id} tab={item} />;
      })}
    </div>
  );
}
