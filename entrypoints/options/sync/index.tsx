import { useEffect, useState } from 'react';
import { theme, Drawer } from 'antd';
import dayjs from 'dayjs';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { syncUtils } from '~/entrypoints/common/storage';
import type { SyncRemoteType, SyncConfigProps, SyncStatusProps, SyncResultProps, SyncType } from '~/entrypoints/types';
import type { RemoteOptionProps } from './types';
import { StyledContainer, StyledSidebarWrapper } from './Sync.styled';
import ToggleSidebarBtn from '../components/ToggleSidebarBtn';
import SyncConfigForm from './SyncConfigForm';
import SidebarContent from './SidebarContent';
import SyncResultList from './SyncResultList';

export default function SyncPage() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<SyncRemoteType>('github');
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [syncConfig, setSyncConfig] = useState<SyncConfigProps>(syncUtils.config);
  const [syncStatus, setSyncStatus] = useState<SyncStatusProps>(syncUtils.syncStatus);
  const [syncResult, setSyncResult] = useState<SyncResultProps>(syncUtils.syncResult);
  const [actionTime, setActionTime] = useState<string>(dayjs().format('YYYY-MM-DD_HH:mm:ss'));

  const onSyncConfigChange = (config: SyncConfigProps) => {
    setDrawerVisible(false);
    setSyncConfig(config);
  };

  const handleAction = async (option: RemoteOptionProps, actionType: string) => {
    setSelectedKey(option.key);
    setActionTime(dayjs().format('YYYY-MM-DD_HH:mm:ss'));
    if (actionType === 'select') {
      setSelectedKey(option.key);
    } else if (actionType === 'setting') {
      setDrawerVisible(true);
    } else {
      syncUtils.setSyncStatus(option.key, 'syncing');
      setSyncStatus(syncUtils.getSyncStatus());
      await syncUtils.syncStart(option.key, actionType as SyncType);
      syncUtils.setSyncStatus(option.key, 'idle');
      getSyncInfo();
    }
  };

  const getSyncInfo = async () => {
    syncUtils.getSyncStatus();
    setSyncStatus(syncUtils.syncStatus);

    await syncUtils.getConfig();
    setSyncConfig(syncUtils.config);

    await syncUtils.getSyncResult();
    setSyncResult(syncUtils.syncResult);
  }

  useEffect(() => {
    getSyncInfo();
  }, []);

  return (
    <>
      <StyledContainer
        className={classNames('sync-wrapper', sidebarCollapsed && 'collapsed')}
        $collapsed={sidebarCollapsed}
      >
        <StyledSidebarWrapper
          className="sidebar"
          $primaryColor={token.colorPrimary}
          $collapsed={sidebarCollapsed}
        >
          <div
            className={classNames('sidebar-inner-box', sidebarCollapsed && 'collapsed')}
          >
            {/* <div className="sidebar-action-box">
              <ToggleSidebarBtn onCollapseChange={setSidebarCollapsed}></ToggleSidebarBtn>
            </div> */}
            <div className="sidebar-inner-content">
              <SidebarContent
                selectedKey={selectedKey}
                syncConfig={syncConfig}
                syncStatus={syncStatus}
                syncResult={syncResult}
                onAction={handleAction}
              ></SidebarContent>
            </div>
          </div>
        </StyledSidebarWrapper>
        <div className="content">
          <SyncResultList resultList={syncResult[selectedKey] || []}></SyncResultList>
        </div>
      </StyledContainer>

      { drawerVisible && (
        <Drawer
          title={$fmt('sync.settings')}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          width={500}
        >
          <SyncConfigForm onChange={onSyncConfigChange}></SyncConfigForm>
        </Drawer>
      )}
    </>
  );
}
