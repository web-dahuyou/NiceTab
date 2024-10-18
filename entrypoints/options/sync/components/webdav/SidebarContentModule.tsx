import { useCallback, forwardRef, useImperativeHandle } from 'react';
import { message, Flex, Divider, Drawer, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { syncWebDAVUtils } from '~/entrypoints/common/storage';
import type {
  SyncTargetType,
  SyncType,
  SyncConfigItemWebDAVProps,
  SyncConfigWebDAVProps,
} from '~/entrypoints/types';
import { StyledCard } from '../../Sync.styled';
import SidebarBaseCardItem from '../SidebarBaseCardItem';
import SyncConfigForm from './SyncConfigForm';

type SideBarContentProps = {
  targetType?: SyncTargetType;
  selectedKey?: string;
  onSelect?: (tselectedKey: string) => void;
  onConfigChange?: (config: SyncConfigWebDAVProps) => void;
  onAction?: (
    targetType: SyncTargetType,
    option: SyncConfigItemWebDAVProps,
    actionType: string
  ) => void;
};

export default forwardRef(
  (
    { targetType, selectedKey, onSelect, onConfigChange, onAction }: SideBarContentProps,
    ref
  ) => {
    const { $fmt } = useIntlUtls();
    const [messageApi, contextHolder] = message.useMessage();
    const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
    const [syncConfig, setSyncConfig] = useState<SyncConfigWebDAVProps>(
      syncWebDAVUtils.config
    );
    const [actionTime, setActionTime] = useState<string>(
      dayjs().format('YYYY-MM-DD_HH:mm:ss')
    );

    const configList = useMemo(() => {
      return syncConfig.configList?.filter((item) => !!item.webdavConnectionUrl);
    }, [syncConfig]);

    const getSyncInfo = async () => {
      const config = await syncWebDAVUtils.getConfig();
      setSyncConfig(config);
    };

    const validator = useCallback((config: SyncConfigItemWebDAVProps): boolean => {
      const { webdavConnectionUrl } = config || {};
      if (!webdavConnectionUrl) {
        messageApi.warning($fmt('sync.noWebdavConnectionUrl'));
        return false;
      }
      return true;
    }, []);

    const onSyncConfigChange = (config: SyncConfigWebDAVProps) => {
      setDrawerVisible(false);
      setSyncConfig(config);
      onConfigChange?.(config);
      messageApi.success(
        $fmt({ id: 'common.actionSuccess', values: { action: $fmt('common.save') } })
      );
    };

    const handleAction = useCallback(
      async (option: SyncConfigItemWebDAVProps, actionType: string) => {
        onSelect?.(option.key);
        if (actionType === 'select') {
          onSelect?.(option.key);
        } else if (actionType === 'setting') {
          setDrawerVisible(true);
        } else {
          setActionTime(dayjs().format('YYYY-MM-DD_HH:mm:ss'));
          await syncWebDAVUtils.setSyncStatus(option.key, 'syncing');
          await getSyncInfo();
          await syncWebDAVUtils.syncStart(option, actionType as SyncType);
          syncWebDAVUtils.setSyncStatus(option.key, 'idle');
          await getSyncInfo();
          onAction?.('webdav', option, actionType);
        }
      },
      []
    );

    useEffect(() => {
      getSyncInfo();
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
            <Typography.Text strong>WebDAV</Typography.Text>
          </Divider>
          <Flex vertical gap={12}>
            {configList?.map((option) => (
              <StyledCard key={`${option.key}_${actionTime}`}>
                <SidebarBaseCardItem<SyncConfigItemWebDAVProps>
                  option={option}
                  isActive={targetType === 'webdav' && selectedKey === option.key}
                  syncStatus={option.syncStatus || 'idle'}
                  syncResult={option.syncResult || []}
                  onAction={handleAction}
                  validator={validator}
                ></SidebarBaseCardItem>
              </StyledCard>
            ))}
            <Flex justify="center">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setDrawerVisible(true)}
              >
                {$fmt('sync.addConfig')}
              </Button>
            </Flex>
          </Flex>
        </Flex>

        {drawerVisible && (
          <Drawer
            title={`WebDAV ${$fmt('sync.settings')}`}
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
