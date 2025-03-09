const zhCN = {
  'sync.settings': '同步设置',
  'sync.autoSync': '是否自动同步',
  'sync.syncing': '正在同步',
  'sync.noAccessToken': '未设置 access token',
  'sync.noGithubToken': '未设置 github access token',
  'sync.noGiteeToken': '未设置 gitee access token',
  'sync.syncType.auto': '自动同步',
  'sync.syncType.autoPullMerge': '自动拉取-合并到本地',
  'sync.syncType.autoPullForce': '自动拉取-覆盖本地数据',
  'sync.syncType.autoPushMerge': '自动同步-合并推送',
  'sync.syncType.autoPushForce': '自动同步-覆盖推送',
  'sync.syncType.manualPullMerge': '手动拉取-合并到本地',
  'sync.syncType.manualPullForce': '手动拉取-覆盖本地数据',
  'sync.syncType.manualPushMerge': '手动同步-合并推送',
  'sync.syncType.manualPushForce': '手动同步-覆盖推送',
  'sync.lastSyncTime': '上次同步时间',
  'sync.lastSyncType': '上次同步方式',
  'sync.lastSyncResult': '上次同步结果',
  'sync.syncTime': '同步时间',
  'sync.syncType': '同步方式',
  'sync.syncResult': '同步结果',
  'sync.actionTip': '操作提醒',
  'sync.actionTip.manualPullForce': '该操作将覆盖本地数据，您确定要继续吗？',
  'sync.actionTip.manualPushForce': '该操作将覆盖远程数据，您确定要继续吗？',
  'sync.tip.auto': '以合并推送的方式按时自动同步',
  'sync.tip.autoPullMerge': '自动拉取远程数据，合并到本地',
  'sync.tip.autoPullForce': '自动拉取远程数据，覆盖本地数据',
  'sync.tip.autoPushMerge': '自动拉取远程数据，与本地合并，然后推送',
  'sync.tip.autoPushForce': '自动推送本地数据到远程（强制覆盖）',
  'sync.tip.manualPullMerge': '拉取远程数据，合并到本地',
  'sync.tip.manualPullForce': '拉取远程数据，覆盖本地数据',
  'sync.tip.manualPushMerge': '拉取远程数据，与本地合并，然后推送',
  'sync.tip.manualPushForce': '推送本地数据到远程（强制覆盖）',
  'sync.tip.tokenChange': '修改access token会清空本地{type}的同步历史记录',
  // 'sync.tip.contentTooLarge': '远程文件内容太大，返回的内容被 gist API 截断了，取消合并到本地',
  'sync.tip.syncHistory': '同步历史只保留最近的50条记录，您还可以手动清空历史记录',
  'sync.tip.supportTip': '远程同步已支持标签页列表和偏好设置同步，同步操作时会同时同步标签页列表和偏好设置数据，不支持分开同步。',
  'sync.getYourToken': '前往获取/设置 token',
  'sync.syncHistory': '同步历史记录',
  'sync.noSyncHistory': '暂无历史同步记录',
  'sync.clearSyncHistory': '清空同步历史记录',
  'sync.removeDesc': '您确定要删除该配置项吗？',
  'sync.noWebdavConnectionUrl': '未设置 WebDAV URL',
  'sync.pushToAllRemotes': '一键推送到所有远程存储（强制覆盖）',

  'sync.reason.contentTooLarge': '远程文件内容太大，返回的内容被 gist API 截断了，取消合并到本地',
  'sync.reason.authFailed': '认证失败',

  'sync.connectionName': 'WebDAV 名称',
  'sync.connectionUrl': 'WebDAV URL',
  'sync.username': 'WebDAV 用户名',
  'sync.password': 'WebDAV 密码',
  'sync.addConfig': '新增配置',
  'sync.tip.connectionName': '用于区分多个 webDAV 的配置名称',
}

export type LocaleKey = keyof typeof zhCN;

export default zhCN;