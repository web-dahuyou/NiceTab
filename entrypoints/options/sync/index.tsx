import { useEffect, useState, useRef } from 'react';
import { theme, Flex, Button } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { syncUtils, syncWebDAVUtils } from '~/entrypoints/common/storage';
import type {
  SyncTargetType,
  SyncRemoteType,
  SyncResultProps,
  SyncConfigWebDAVProps,
} from '~/entrypoints/types';
import { StyledContainer, StyledSidebarWrapper } from './Sync.styled';
import ToggleSidebarBtn from '../components/ToggleSidebarBtn';
import SidebarContentModuleGist from './components/gist/SidebarContentModule';
import SidebarContentModuleWebDAV from './components/webdav/SidebarContentModule';
import SyncResultList from './SyncResultList';

interface ChildComponentHandle {
  getSyncInfo: () => void;
}

export default function SyncPage() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const gistRef = useRef<ChildComponentHandle>(null);
  const webDAVRef = useRef<ChildComponentHandle>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedTargetType, setSelectedTargetType] = useState<SyncTargetType>('gist');
  const [selectedKey, setSelectedKey] = useState<string>('github');
  const [syncResult, setSyncResult] = useState<SyncResultProps>(syncUtils.syncResult);
  const [configWevDAV, setConfigWevDAV] = useState<SyncConfigWebDAVProps>(syncWebDAVUtils.config || {});

  const resultList = useMemo(() => {
    if (selectedTargetType === 'gist') {
      return syncResult?.[selectedKey] || [];
    } else if (selectedTargetType === 'webdav') {
      const configItem = syncWebDAVUtils.getConfigItem(selectedKey);
      return configItem?.syncResult || [];
    } else {
      return [];
    }
  }, [selectedTargetType, selectedKey, syncResult, configWevDAV]);

  const onSelect = (targetType: SyncTargetType, key: string) => {
    setSelectedTargetType(targetType);
    setSelectedKey(key);
  };
  const onAction = useCallback((targetType: SyncTargetType) => {
    setSelectedTargetType(targetType);
    if (targetType === 'gist') {
      getSyncInfo();
    } else if (targetType === 'webdav') {
      getWebDavConfig();
    }
  }, []);

  const clearSyncResult = async () => {
    if (selectedTargetType === 'gist') {
      await syncUtils.clearSyncResult(selectedKey as SyncRemoteType);
      getSyncInfo();
      gistRef.current?.getSyncInfo();
    } else if (selectedTargetType === 'webdav') {
      await syncWebDAVUtils.clearSyncResult(selectedKey);
      getWebDavConfig();
      webDAVRef.current?.getSyncInfo();
    }

  };

  const getSyncInfo = async () => {
    await syncUtils.getSyncResult();
    setSyncResult(syncUtils.syncResult);
  };

  const getWebDavConfig = async () => {
    const config = await syncWebDAVUtils.getConfig();
    setConfigWevDAV(config || {});
  }

  useEffect(() => {
    getSyncInfo();
    getWebDavConfig();
  }, []);

  return (
    <StyledContainer
      className={classNames('sync-wrapper', sidebarCollapsed && 'collapsed')}
      $collapsed={sidebarCollapsed}
    >
      <StyledSidebarWrapper
        className="sidebar"
        $primaryColor={token.colorPrimary}
        $collapsed={sidebarCollapsed}
      >
        <div className={classNames('sidebar-inner-box', sidebarCollapsed && 'collapsed')}>
          <div className="sidebar-action-box">
            {/* <ToggleSidebarBtn onCollapseChange={setSidebarCollapsed}></ToggleSidebarBtn> */}
            <div
              className="action-icon"
              title={$fmt('sync.clearSyncHistory')}
              onClick={clearSyncResult}
            >
              <Button icon={<ClearOutlined />}></Button>
            </div>
          </div>
          <div className="sidebar-inner-content">
            <Flex vertical gap={12}>
              <SidebarContentModuleGist
                ref={gistRef}
                targetType={selectedTargetType}
                selectedKey={selectedKey}
                onSelect={(key) => onSelect('gist', key)}
                onAction={() => onAction?.('gist')}
              />

              <SidebarContentModuleWebDAV
                ref={webDAVRef}
                targetType={selectedTargetType}
                selectedKey={selectedKey}
                onSelect={(key) => onSelect('webdav', key)}
                onAction={() => onAction?.('webdav')}
              />
            </Flex>
          </div>
        </div>
      </StyledSidebarWrapper>
      <div className="content">
        <SyncResultList resultList={resultList}></SyncResultList>
      </div>
    </StyledContainer>
  );
}
