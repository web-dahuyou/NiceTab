import { useEffect, useState, useRef } from 'react';
import { theme, Flex, Button, Modal } from 'antd';
import { CloudUploadOutlined, ClearOutlined } from '@ant-design/icons';
import { classNames } from '~/entrypoints/common/utils';
import {
  eventEmitter,
  useIntlUtls,
  GlobalContext,
} from '~/entrypoints/common/hooks/global';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import {
  settingsUtils,
  syncUtils,
  syncWebDAVUtils,
  initSyncStorageListener,
} from '~/entrypoints/common/storage';
import type {
  SyncTargetType,
  SyncRemoteType,
  SyncResultProps,
  SyncConfigWebDAVProps,
} from '~/entrypoints/types';
import { updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';

import { StyledSidebarWrapper, StyledMainWrapper } from './Sync.styled';
// import ToggleSidebarBtn from '../components/ToggleSidebarBtn';
import SidebarContentModuleGist from './components/gist/SidebarContentModule';
import SidebarContentModuleWebDAV from './components/webdav/SidebarContentModule';
import SyncResultList from './SyncResultList';
import StickyFooter from '~/entrypoints/common/components/StickyFooter';
import Footer from './footer/index';

interface ChildComponentHandle {
  getSyncInfo: () => void;
}

export default function SyncPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  // const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const NiceGlobalContext = useContext(GlobalContext);
  const gistRef = useRef<ChildComponentHandle>(null);
  const webDAVRef = useRef<ChildComponentHandle>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedTargetType, setSelectedTargetType] = useState<SyncTargetType>('gist');
  const [selectedKey, setSelectedKey] = useState<string>('github');
  const [syncResult, setSyncResult] = useState<SyncResultProps>(syncUtils.syncResult);
  const [configWevDAV, setConfigWevDAV] = useState<SyncConfigWebDAVProps>(
    syncWebDAVUtils.config || {}
  );

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
  const onAction = useCallback((targetType: SyncTargetType, key: string) => {
    setSelectedTargetType(targetType);
    setSelectedKey(key);
    if (targetType === 'gist') {
      getSyncInfo();
    } else if (targetType === 'webdav') {
      getWebDavConfig();
    }

    NiceGlobalContext.setSettings(settingsUtils.settings);
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

  const pushToAllRemotes = async () => {
    const modalConfig = {
      title: $fmt('sync.actionTip'),
      content: $fmt('sync.actionTip.manualPushForce'),
    };
    const confirmed = await modal.confirm(modalConfig);
    if (!confirmed) return;

    eventEmitter.emit('sync:push-to-all-remotes');
  };

  const getSyncInfo = async () => {
    await syncUtils.getSyncResult();
    setSyncResult(syncUtils.syncResult);
    const config = await syncUtils.getConfig();
    return config || {};
  };

  const getWebDavConfig = async () => {
    const config = await syncWebDAVUtils.getConfig();
    setConfigWevDAV(config || {});
    return config || {};
  };

  const init = async () => {
    const { github, gitee } = await getSyncInfo();
    const { configList } = await getWebDavConfig();
    // 选中第一个配置
    if (github?.accessToken) {
      setSelectedTargetType('gist');
      setSelectedKey('github');
    } else if (gitee?.accessToken) {
      setSelectedTargetType('gist');
      setSelectedKey('gitee');
    } else {
      setSelectedTargetType('webdav');
      setSelectedKey(configList[0]?.key || '');
    }
  };

  const { urlParams } = useUrlParams();

  useEffect(() => {
    getSyncInfo();
    gistRef.current?.getSyncInfo();
    getWebDavConfig();
    webDAVRef.current?.getSyncInfo();
  }, [urlParams]);

  useEffect(() => {
    init();

    return initSyncStorageListener(async () => {
      const currWindow = await browser.windows.getCurrent();
      if (!currWindow.focused) {
        updateAdminPageUrlDebounced();
      }
    });
  }, []);

  return (
    <>
      {modalContextHolder}
      <StyledMainWrapper
        className={classNames('sync-wrapper', sidebarCollapsed && 'collapsed')}
        $collapsed={sidebarCollapsed}
        $sidebarWidth={400}
      >
        <StyledSidebarWrapper
          className="sidebar"
          $collapsed={sidebarCollapsed}
          $sidebarWidth={400}
        >
          <div
            className={classNames('sidebar-inner-box', sidebarCollapsed && 'collapsed')}
          >
            <div className="sidebar-action-box">
              {/* <ToggleSidebarBtn onCollapseChange={setSidebarCollapsed}></ToggleSidebarBtn> */}
              <div
                className="action-icon"
                title={$fmt('sync.pushToAllRemotes')}
                onClick={pushToAllRemotes}
              >
                <Button icon={<CloudUploadOutlined />}></Button>
              </div>
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
                  onAction={({ key }) => onAction?.('gist', key)}
                />

                <SidebarContentModuleWebDAV
                  ref={webDAVRef}
                  targetType={selectedTargetType}
                  selectedKey={selectedKey}
                  onSelect={(key) => onSelect('webdav', key)}
                  onAction={({ key }) => onAction?.('webdav', key)}
                />
              </Flex>
            </div>
          </div>
        </StyledSidebarWrapper>
        <div className="main-content-wrapper">
          <SyncResultList resultList={resultList}></SyncResultList>
        </div>
      </StyledMainWrapper>

      {/* 吸底footer */}
      <StickyFooter bottomGap={0} fullWidth>
        <Footer></Footer>
      </StickyFooter>
    </>
  );
}
