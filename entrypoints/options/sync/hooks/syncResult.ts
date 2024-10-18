import type { SyncType, SyncResultItemProps } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { SUCCESS_KEY, syncTypeMap } from '~/entrypoints/common/constants';

// 同步结果
export function useSyncResult(resultData?: SyncResultItemProps) {
  const { $fmt } = useIntlUtls();

  const syncTypeTextMap = {
    [syncTypeMap.AUTO]: $fmt('sync.syncType.auto'),
    [syncTypeMap.MANUAL_PULL_MERGE]: $fmt('sync.syncType.manualPullMerge'),
    [syncTypeMap.MANUAL_PULL_FORCE]: $fmt('sync.syncType.manualPullForce'),
    [syncTypeMap.MANUAL_PUSH_MERGE]: $fmt('sync.syncType.manualPushMerge'),
    [syncTypeMap.MANUAL_PUSH_FORCE]: $fmt('sync.syncType.manualPushForce'),
  };

  const syncTypeTipMap = {
    [syncTypeMap.AUTO]: $fmt('sync.tip.auto'),
    [syncTypeMap.MANUAL_PULL_MERGE]: $fmt('sync.tip.manualPullMerge'),
    [syncTypeMap.MANUAL_PULL_FORCE]: $fmt('sync.tip.manualPullForce'),
    [syncTypeMap.MANUAL_PUSH_MERGE]: $fmt('sync.tip.manualPushMerge'),
    [syncTypeMap.MANUAL_PUSH_FORCE]: $fmt('sync.tip.manualPushForce'),
  };

  const syncTypeText = resultData
    ? syncTypeTextMap[resultData.syncType]
    : $fmt('common.noData');

  const syncTypeTipText = resultData
    ? syncTypeTipMap[resultData.syncType]
    : $fmt('common.noData');

  const getSyncTypeText = (syncType: SyncType) => {
    return syncTypeTextMap[syncType];
  };

  const getSyncTipText = (syncType: SyncType) => {
    return syncTypeTextMap[syncType];
  };

  const successInfo = {
    variant: 'success',
    text: $fmt('common.success'),
  };
  const failedInfo = {
    variant: 'error',
    text: $fmt('common.failed'),
  };
  const emptyInfo = {
    variant: 'default',
    text: $fmt('common.noData'),
  };

  const variantInfo = resultData
    ? resultData.syncResult === SUCCESS_KEY
      ? successInfo
      : failedInfo
    : emptyInfo;

  const getVariantInfo = (syncResult?: string) => {
    if (!syncResult) return emptyInfo;
    return syncResult === SUCCESS_KEY ? successInfo : failedInfo;
  };

  return {
    syncTypeTextMap,
    syncTypeTipMap,
    syncTypeText,
    syncTypeTipText,
    getSyncTypeText,
    getSyncTipText,
    successInfo,
    failedInfo,
    emptyInfo,
    variantInfo,
    getVariantInfo,
  };
}
