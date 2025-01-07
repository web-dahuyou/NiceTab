import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { syncTypeMap } from '~/entrypoints/common/constants';

// 同步结果
export function useSyncType() {
  const { $fmt } = useIntlUtls();

  const autoSyncTypeOptions = useMemo(() => {
    return [
      // { type: [syncTypeMap.AUTO_PULL_MERGE], label: $fmt('settings.syncType.autoPullMerge') },
      { type: syncTypeMap.AUTO_PUSH_MERGE, label: $fmt('settings.syncType.autoPushMerge') },
      { type: syncTypeMap.AUTO_PULL_FORCE, label: $fmt('settings.syncType.autoPullForce') },
      { type: syncTypeMap.AUTO_PUSH_FORCE, label: $fmt('settings.syncType.autoPushForce') },
    ];
  }, [$fmt]);

  const manualSyncTypeOptions = useMemo(() => {
    return [
      // { type: [syncTypeMap.MANUAL_PULL_MERGE], label: $fmt('settings.syncType.manualPullMerge') },
      { type: syncTypeMap.MANUAL_PUSH_MERGE, label: $fmt('settings.syncType.manualPushMerge') },
      { type: syncTypeMap.MANUAL_PULL_FORCE, label: $fmt('settings.syncType.manualPullForce') },
      { type: syncTypeMap.MANUAL_PUSH_FORCE, label: $fmt('settings.syncType.manualPushForce') },
    ];
  }, [$fmt]);


  return {
    autoSyncTypeOptions,
    manualSyncTypeOptions,
  };
}
