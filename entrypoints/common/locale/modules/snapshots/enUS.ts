import type { SnapshotLocaleKey } from './zhCN';

const enUS: Record<SnapshotLocaleKey, string> = {
  'snapshots.title': 'Snapshots',
  'snapshots.manual': 'Manual Snapshots',
  'snapshots.auto': 'Latest Automatic Snapshot',
  'snapshots.create': 'Snapshot Current Window',
  'snapshots.empty': 'No snapshots',
  'snapshots.autoEmpty': 'No automatic snapshot yet',
  'snapshots.stats': '{tabs} tabs · {groups} groups · {pinned} pinned',
  'snapshots.restoreNewWindow': 'Restore in New Window',
  'snapshots.restoreCurrentWindow': 'Replace Current Window',
  'snapshots.restoreCurrentConfirm':
    'The existing tabs in this window will be closed. Continue?',
  'snapshots.restoreResult': 'Restored {created} tabs; {failed} failed',
  'snapshots.limitTitle': 'Manual Snapshot Limit Reached',
  'snapshots.limitContent':
    'You can keep up to 50 manual snapshots. Delete the oldest and continue?',
  'snapshots.deleteConfirm': 'Delete this snapshot?',
  'snapshots.deleteGroupConfirm': 'Delete this group and all of its tabs?',
  'snapshots.snapshotName': 'Snapshot Name',
  'snapshots.addTab': 'Add Tab',
  'snapshots.addGroup': 'Add Group',
  'snapshots.editTab': 'Edit Tab',
  'snapshots.editGroup': 'Edit Group',
  'snapshots.groupName': 'Group Name',
  'snapshots.groupColor': 'Group Color',
  'snapshots.groupCollapsed': 'Restore Collapsed',
  'snapshots.pinned': 'Pinned Tab',
  'snapshots.active': 'Activate After Restore',
  'snapshots.ungrouped': 'Ungrouped Tabs',
  'snapshots.dropHere': 'Drop tabs here',
  'snapshots.unsaved': 'Unsaved changes',
  'snapshots.saved': 'Snapshot saved',
  'snapshots.created': 'Snapshot created',
  'snapshots.invalidUrl': 'Enter a valid URL',
};

export default enUS;
