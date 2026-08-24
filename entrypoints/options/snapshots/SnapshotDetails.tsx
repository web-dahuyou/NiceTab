import { PushpinFilled, StarFilled } from '@ant-design/icons';
import { Space, Tag, Typography } from 'antd';
import VirtualList from 'rc-virtual-list';
import Favicon from '~/entrypoints/common/components/Favicon';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type {
  SnapshotRecord,
  WindowSnapshotGroup,
  WindowSnapshotTab,
} from '~/entrypoints/types';
import { StyledSnapshotDrawerContent } from './Snapshots.styled';

type DetailRow =
  | { type: 'group'; key: string; group: WindowSnapshotGroup }
  | {
      type: 'tab';
      key: string;
      tab: WindowSnapshotTab;
      group?: WindowSnapshotGroup;
    };

function flattenRecord(record: SnapshotRecord): DetailRow[] {
  return record.items.reduce<DetailRow[]>((rows, item) => {
    if (item.type === 'group') {
      rows.push({ type: 'group', key: `group-${item.id}`, group: item });
      rows.push(
        ...item.tabs.map(tab => ({
          type: 'tab' as const,
          key: `group-${item.id}-tab-${tab.id}`,
          tab,
          group: item,
        })),
      );
    } else {
      rows.push({ type: 'tab', key: `tab-${item.id}`, tab: item });
    }
    return rows;
  }, []);
}

export default function SnapshotDetails({ record }: { record: SnapshotRecord }) {
  const { $fmt } = useIntlUtls();
  const rows = flattenRecord(record);

  return (
    <StyledSnapshotDrawerContent className="snapshot-details">
      <VirtualList
        data={rows}
        height={Math.min(720, window.innerHeight - 150)}
        itemHeight={48}
        itemKey="key"
      >
        {row => {
          if (row.type === 'group') {
            return (
              <div className="detail-group-row">
                <Space size={8}>
                  <Tag color={row.group.color}>{row.group.color}</Tag>
                  <Typography.Text strong>
                    {row.group.title || $fmt('snapshots.ungrouped')}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {row.group.tabs.length}
                  </Typography.Text>
                  {row.group.collapsed && (
                    <Typography.Text type="secondary">
                      {$fmt('snapshots.groupCollapsed')}
                    </Typography.Text>
                  )}
                </Space>
              </div>
            );
          }
          return (
            <div className={row.group ? 'detail-tab-row grouped' : 'detail-tab-row'}>
              <Favicon pageUrl={row.tab.url} favIconUrl={row.tab.favIconUrl} />
              <div className="detail-tab-content">
                <div className="detail-tab-title">{row.tab.title || row.tab.url}</div>
                <div className="detail-tab-url" title={row.tab.url}>
                  {row.tab.url}
                </div>
              </div>
              {row.tab.pinned && <PushpinFilled title={$fmt('snapshots.pinned')} />}
              {row.tab.active && <StarFilled title={$fmt('snapshots.active')} />}
            </div>
          );
        }}
      </VirtualList>
    </StyledSnapshotDrawerContent>
  );
}
