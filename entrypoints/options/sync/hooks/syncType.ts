import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { syncTypeMap } from '~/entrypoints/common/constants';

// 同步结果
export function useSyncType() {
  const { $fmt } = useIntlUtls();

  const autoSyncTimeUnitOptions = useMemo(() => {
    return [
      { type: 'm', label: $fmt('settings.autoSyncTimeUnit.m'), unit: 'minute', min: 5, max: 60, step: 5, },
      { type: 'h', label: $fmt('settings.autoSyncTimeUnit.h'), unit: 'hour', min: 1, max: 24, step: 1, },
    ];
  }, [$fmt]);

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
    autoSyncTimeUnitOptions,
    autoSyncTypeOptions,
    manualSyncTypeOptions,
  };
}
