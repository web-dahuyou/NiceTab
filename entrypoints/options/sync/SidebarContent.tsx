import { useCallback, useMemo } from 'react';
import { theme, Flex, Card, Tooltip, Typography, Tag } from 'antd';
import {
  SettingOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import type {
  SyncRemoteType,
  SyncConfigItemProps,
  SyncConfigProps,
  SyncStatus,
  SyncStatusProps,
  SyncResultItemProps,
  SyncResultProps,
} from '~/entrypoints/types';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { RemoteOptionProps } from './types';
import { remoteOptions } from './constants';
import { StyledLabel } from './Sync.styled';
import { useSyncResult } from './hooks';

type CardItemProps = {
  option: RemoteOptionProps;
  isActive?: boolean;
  syncConfig: SyncConfigItemProps;
  syncStatus: SyncStatus;
  syncResult: SyncResultItemProps[];
  onAction?: (option: RemoteOptionProps, actionType: string) => void;
};

function CardItemMarkup({
  option,
  isActive,
  syncConfig,
  syncStatus,
  syncResult,
  onAction,
}: CardItemProps) {
  const { $fmt } = useIntlUtls();
  const lastSyncInfo = useMemo(() => {
    return syncResult?.[0] || {};
  }, [syncResult]);

  const { syncTypeText, syncTypeTipText, variantInfo } = useSyncResult(lastSyncInfo);

  return (
    <Card
      className={classNames('card-item', isActive && 'active')}
      hoverable
      classNames={{
        actions: 'card-actions',
      }}
      onClick={() => onAction?.(option, 'select')}
      actions={[
        <Tooltip
          color="#fff"
          destroyTooltipOnHide
          title={<Typography.Text>{$fmt('common.settings')}</Typography.Text>}
        >
          <div className="icon-btn-wrapper" onClick={() => onAction?.(option, 'setting')}>
            <SettingOutlined key="setting" />
          </div>
        </Tooltip>,
        <Tooltip
          color="#fff"
          destroyTooltipOnHide
          title={<Typography.Text>{$fmt('sync.tip.manualPushMerge')}</Typography.Text>}
        >
          <div
            className="icon-btn-wrapper"
            onClick={() => onAction?.(option, 'manual-push-merge')}
          >
            <SyncOutlined key="manual-push-merge" />
          </div>
        </Tooltip>,
        <Tooltip
          color="#fff"
          destroyTooltipOnHide
          title={<Typography.Text>{$fmt('sync.tip.manualPushForce')}</Typography.Text>}
        >
          <div
            className="icon-btn-wrapper"
            onClick={() => onAction?.(option, 'manual-push-force')}
          >
            <CloudUploadOutlined key="manual-push-force" />
          </div>
        </Tooltip>,
      ]}
    >
      <Card.Meta
        title={option.label}
        description={
          <Flex vertical gap={6}>
            {syncConfig?.accessToken ? (
              syncStatus === 'syncing' ? (
                <Tag icon={<SyncOutlined spin />} color="processing">
                  {$fmt('sync.syncing')}
                </Tag>
              ) : null
            ) : (
              <Tag icon={<ExclamationCircleOutlined />} color="warning">
                {$fmt('sync.noAccessToken')}
              </Tag>
            )}
            <Typography.Text type="secondary">
              <StyledLabel>{$fmt('sync.lastSyncTime')}: </StyledLabel>
              {lastSyncInfo?.syncTime || $fmt('common.noData')}
            </Typography.Text>
            {lastSyncInfo?.syncTime && lastSyncInfo?.syncType && (
              <>
                <Typography.Text type="secondary">
                  <StyledLabel>{$fmt('sync.lastSyncType')}: </StyledLabel>
                  <Tooltip
                    color="#fff"
                    destroyTooltipOnHide
                    title={<Typography.Text>{syncTypeTipText}</Typography.Text>}
                  >
                    <Tag color="blue">{syncTypeText}</Tag>
                  </Tooltip>
                </Typography.Text>
                <Typography.Text type="secondary">
                  <StyledLabel>{$fmt('sync.lastSyncResult')}: </StyledLabel>
                  <Tag color={variantInfo.variant}>{variantInfo.text}</Tag>
                </Typography.Text>
                { lastSyncInfo.reason && (
                  <Typography.Text type="danger">
                    <StyledLabel>{$fmt('common.failedReason')}: </StyledLabel>
                    { lastSyncInfo.reason }
                  </Typography.Text>
                ) }
              </>
            )}
          </Flex>
        }
      />
    </Card>
  );
}

const StyledCard = styled.div<{ $primaryColor: string }>`
  .card-item {
    &.active {
      border-color: ${(props) => props.$primaryColor};
    }
    .icon-btn-wrapper {
      padding: 4px;
    }
  }
`;

type SideBarContentProps = {
  selectedKey?: string;
  syncConfig: SyncConfigProps;
  syncStatus: SyncStatusProps;
  syncResult: SyncResultProps;
  onAction?: (option: RemoteOptionProps, actionType: string) => void;
};
export default function SidebarContent({
  selectedKey,
  syncConfig,
  syncStatus,
  syncResult,
  onAction,
}: SideBarContentProps) {
  const { token } = theme.useToken();

  const handleAction = useCallback(
    (option: RemoteOptionProps, actionType: string) => {
      onAction?.(option, actionType);
    },
    [onAction]
  );

  return (
    <Flex vertical gap={12}>
      {remoteOptions.map((option) => (
        <StyledCard key={option.key} $primaryColor={token.colorPrimary}>
          <CardItemMarkup
            option={option}
            isActive={selectedKey === option.key}
            syncConfig={syncConfig?.[option.key] || {}}
            syncStatus={syncStatus?.[option.key] || {}}
            syncResult={syncResult?.[option.key] || []}
            onAction={handleAction}
          ></CardItemMarkup>
        </StyledCard>
      ))}
    </Flex>
  );
}
