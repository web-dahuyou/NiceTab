import { useCallback, forwardRef, useImperativeHandle } from 'react';
import { message, Flex, Divider, Drawer, Typography, Button, Tag } from 'antd';
import { SyncOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { syncUtils } from '~/entrypoints/common/storage';
import type {
  SyncTargetType,
  SyncType,
  SyncConfigProps,
  SyncStatusProps,
  SyncResultProps,
  SyncStatusChangeEventProps,
  BrowserMessageProps,
} from '~/entrypoints/types';
import { syncTypeMap } from '~/entrypoints/common/constants';
import type { RemoteOptionProps, BaseCardItemProps } from '../../types';
import { remoteOptions } from '../../constants';
import { StyledCard, StyledCardTitle } from '../../Sync.styled';
import SidebarBaseCardItem from '../SidebarBaseCardItem';
import SyncConfigForm from './SyncConfigForm';

type SideBarContentProps = {
  targetType?: SyncTargetType;
  selectedKey?: string;
  onSelect?: (selectedKey: string) => void;
  onConfigChange?: (config: SyncConfigProps) => void;
  onAction?: (option: RemoteOptionProps, actionType?: string) => void;
};

function CardTitle({
  option,
  syncConfig,
  syncStatus,
}: Pick<BaseCardItemProps, 'option' | 'syncConfig' | 'syncStatus'>) {
  const { $fmt } = useIntlUtls();
  return (
    <StyledCardTitle>
      <div className="card-title">{option.label}</div>
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
    </StyledCardTitle>
  );
}

export default forwardRef(
  (
    { targetType, selectedKey, onSelect, onConfigChange, onAction }: SideBarContentProps,
    ref
  ) => {
    const { $fmt } = useIntlUtls();
    const [messageApi, contextHolder] = message.useMessage();
    const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
    const [syncConfig, setSyncConfig] = useState<SyncConfigProps>(syncUtils.config);
    const [syncStatus, setSyncStatus] = useState<SyncStatusProps>(syncUtils.syncStatus);
    const [syncResult, setSyncResult] = useState<SyncResultProps>(syncUtils.syncResult);
    const [actionTime, setActionTime] = useState<string>(
      dayjs().format('YYYY-MM-DD_HH:mm:ss')
    );

    const configList = useMemo(() => {
      return remoteOptions?.filter((item) => syncConfig?.[item.key]?.accessToken);
    }, [syncConfig]);

    const validator = useCallback(
      (option: RemoteOptionProps, showMessage = true): boolean => {
        const { github, gitee } = syncUtils.config || {};
        if (option.key === 'github' && !github?.accessToken) {
          showMessage && messageApi.warning($fmt('sync.noGithubToken'));
          return false;
        } else if (option.key === 'gitee' && !gitee?.accessToken) {
          showMessage && messageApi.warning($fmt('sync.noGiteeToken'));
          return false;
        }
        return true;
      },
      []
    );

    const onSyncConfigChange = (config: SyncConfigProps) => {
      setDrawerVisible(false);
      setSyncConfig(config);
      onConfigChange?.(config);
      messageApi.success(
        $fmt({ id: 'common.actionSuccess', values: { action: $fmt('common.save') } })
      );
    };

    const handleAction = useCallback(
      async (option: RemoteOptionProps, actionType: string) => {
        onSelect?.(option.key);
        if (actionType === 'select') {
          onSelect?.(option.key);
        } else if (actionType === 'setting') {
          setDrawerVisible(true);
        } else {
          setActionTime(dayjs().format('YYYY-MM-DD_HH:mm:ss'));
          await syncUtils.syncStart(option.key, actionType as SyncType);
          onAction?.(option, actionType);
        }
      },
      []
    );

    // 一键推送到所有远程存储
    const pushToAllRemotes = async () => {
      const config = await syncUtils.getConfig();
      const configList = remoteOptions?.filter((item) => config?.[item.key]?.accessToken);
      configList.forEach((option) => {
        handleAction(option, syncTypeMap.MANUAL_PUSH_FORCE);
      });
    };

    const getSyncInfo = async () => {
      const status = await syncUtils.getSyncStatus();
      setSyncStatus(status);

      await syncUtils.getConfig();
      setSyncConfig(syncUtils.config);

      await syncUtils.getSyncResult();
      setSyncResult(syncUtils.syncResult);
    };

    // 同步状态变化
    const onSyncStatusChange = async (data: SyncStatusChangeEventProps<'gist'>) => {
      await getSyncInfo();
      setActionTime(dayjs().format('YYYY-MM-DD_HH:mm:ss'));
      const { type } = data || {};
      const option = remoteOptions.find((item) => item.key === type);
      option && onAction?.(option);
    };

    // 监听同步状态变化message
    const onSyncStatusChangeMessage = async (message: unknown) => {
      const { msgType, data } = message as BrowserMessageProps;
      if (msgType === 'sync:sync-status-change--gist') {
        onSyncStatusChange(data);
      }
    };

    useEffect(() => {
      getSyncInfo();
      eventEmitter.on('sync:push-to-all-remotes', pushToAllRemotes);
      eventEmitter.on('sync:sync-status-change--gist', onSyncStatusChange);
      browser.runtime.onMessage.addListener(onSyncStatusChangeMessage);
      return () => {
        eventEmitter.off('sync:push-to-all-remotes', pushToAllRemotes);
        eventEmitter.off('sync:sync-status-change--gist', onSyncStatusChange);
        browser.runtime.onMessage.removeListener(onSyncStatusChangeMessage);
      };
    }, []);

    useImperativeHandle(
      ref,
      () => {
        return {
          getSyncInfo,
        };
      },
      []
    );

    return (
      <>
        {contextHolder}
        <Flex vertical>
          <Divider>
            <Typography.Text strong>Gists</Typography.Text>
          </Divider>
          <Flex vertical gap={12}>
            {configList.map((option) => (
              <StyledCard key={`${option.key}_${actionTime}`}>
                <SidebarBaseCardItem
                  option={option}
                  isActive={targetType === 'gist' && selectedKey === option.key}
                  syncConfig={syncConfig?.[option.key] || {}}
                  syncStatus={syncStatus?.[option.key] || 'idle'}
                  syncResult={syncResult?.[option.key] || []}
                  cardTitle={
                    <CardTitle
                      key={`${option.key}_${actionTime}`}
                      option={option}
                      syncConfig={syncConfig?.[option.key] || {}}
                      syncStatus={syncStatus?.[option.key] || 'idle'}
                    />
                  }
                  onAction={handleAction}
                  validator={validator}
                ></SidebarBaseCardItem>
              </StyledCard>
            ))}
            {configList.length < remoteOptions.length && (
              <Flex justify="center">
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setDrawerVisible(true)}
                >
                  {$fmt('sync.addConfig')}
                </Button>
              </Flex>
            )}
          </Flex>
        </Flex>

        {drawerVisible && (
          <Drawer
            title={`Gists ${$fmt('sync.settings')}`}
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            width={540}
          >
            <SyncConfigForm onChange={onSyncConfigChange}></SyncConfigForm>
          </Drawer>
        )}
      </>
    );
  }
);
