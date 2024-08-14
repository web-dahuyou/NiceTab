import type {
  SyncRemoteType,
  SyncConfigItemProps,
  SyncConfigProps,
  SyncStatus,
  SyncStatusProps,
  SyncResultItemProps,
  SyncResultProps,
} from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { SUCCESS_KEY } from '~/entrypoints/common/constants';
import { syncTypeMap } from './constants';

export function useSyncResult(resultData?: SyncResultItemProps) {
  const { $fmt } = useIntlUtls();

  const syncTypeTextMap = {
    [syncTypeMap.AUTO]: $fmt('sync.syncType.auto'),
    [syncTypeMap.MANUAL_PUSH_MERGE]: $fmt('sync.syncType.manualPushMerge'),
    [syncTypeMap.MANUAL_PUSH_FORCE]: $fmt('sync.syncType.manualPushForce'),
  };

  const syncTypeTipMap = {
    [syncTypeMap.AUTO]: $fmt('sync.tip.auto'),
    [syncTypeMap.MANUAL_PUSH_MERGE]: $fmt('sync.tip.manualPushMerge'),
    [syncTypeMap.MANUAL_PUSH_FORCE]: $fmt('sync.tip.manualPushForce'),
  };

  const syncTypeText = resultData
    ? syncTypeTextMap[resultData.syncType]
    : $fmt('common.noData');

  const syncTypeTipText = resultData
    ? syncTypeTipMap[resultData.syncType]
    : $fmt('common.noData');

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

  return {
    syncTypeTextMap,
    syncTypeTipMap,
    syncTypeText,
    syncTypeTipText,
    variantInfo,
    successInfo,
    failedInfo,
    emptyInfo,
  };
}
