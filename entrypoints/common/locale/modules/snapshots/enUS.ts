import type { SnapshotLocaleKey } from './zhCN';

const enUS: Record<SnapshotLocaleKey, string> = {
  'snapshots.title': 'Snapshots',
  'snapshots.manual': 'Manual Snapshots',
  'snapshots.auto': 'Latest Automatic Snapshot',
  'snapshots.create': 'Snapshot Current Window',
  'snapshots.empty': 'No snapshots',
  'snapshots.autoEmpty': 'No automatic snapshot yet',
  'snapshots.tip.list': 'Snapshots list only retains the last 50 records.',
  'snapshots.stats': `{tabs, plural,
    one {1 tab}
    other {# tabs}
  } · {groups, plural,
    one {1 group}
    other {# groups}
  } · {pinned} pinned`,
  'snapshots.restoreNewWindow': 'Restore in New Window',
  'snapshots.restoreCurrentWindow': 'Replace Current Window',
  'snapshots.restoreCurrentConfirm': 'The existing tabs in the current window will be overwritten by this snapshot. Continue?',
  'snapshots.deleteConfirm': 'Are you sure you want to remove this snapshot?',
  'snapshots.pinned': 'Pinned',
  'snapshots.created': 'Snapshot created',
};

export default enUS;
