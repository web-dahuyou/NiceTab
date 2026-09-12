const zhCN = {
  'snapshots.title': '快照',
  'snapshots.manual': '手动快照',
  'snapshots.auto': '最新自动快照',
  'snapshots.create': '创建当前窗口快照',
  'snapshots.empty': '暂无快照',
  'snapshots.autoEmpty': '暂无自动快照',
  'snapshots.tip.list': '快照列表只保留最近的50条记录',
  'snapshots.stats': '{tabs} 个标签页 · {groups} 个分组 · {pinned} 个固定标签',
  'snapshots.restoreNewWindow': '在新窗口还原',
  'snapshots.restoreCurrentWindow': '替换当前窗口',
  'snapshots.restoreCurrentConfirm': '当前窗口中的标签页将被该快照覆盖，是否继续？',
  'snapshots.deleteConfirm': '您确定删除这个快照吗？',
  'snapshots.pinned': '已固定',
  'snapshots.created': '快照已创建',
};

export type SnapshotLocaleKey = keyof typeof zhCN;
export default zhCN;
