import { useEffect, useState, useCallback, useContext } from 'react';
import { theme, Modal, Button, Tag, Spin } from 'antd';
import { PlusOutlined, TagOutlined } from '@ant-design/icons';
import { ThemeProvider } from 'styled-components';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import type { TabItem } from '~/entrypoints/types';
import { getRandomId, pick, sendRuntimeMessage } from '~/entrypoints/common/utils';
import { initFaviconApiData } from '~/entrypoints/common/utils/favicon';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { openAdminRoutePage } from '~/entrypoints/common/tabs';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { GlobalStyle } from '~/entrypoints/common/style/Common.styled';
import { GlobalSearchPanel } from '~/entrypoints/common/components/BaseGlobalSearch';
import { useGlobalSearchPanel } from '~/entrypoints/common/hooks/globalSearch';
import EditInput from '~/entrypoints/options/components/EditInput';
import TabItemEditModal from '~/entrypoints/options/home/TabItemEditModal';

import { StyledNewTabContainer, StyledGroupHeader, StyledAddTabBtn } from './App.styled';
import TabListItem from './TabListItem';
import SearchEngine from './SearchEngine';

initFaviconApiData();

const { CONFIRM_BEFORE_DELETING_TABS } = ENUM_SETTINGS_PROPS;

interface UnionGroupItem {
  tagId: string;
  tagName: string;
  tagStatic?: boolean;
  groupId: string;
  groupName: string;
  tabList: TabItem[];
}

type editTabDataItem = TabItem & {
  groupId: string;
};

const resetEditTabData = () => {
  return {
    tabId: '',
    groupId: '',
    title: '',
    url: '',
  };
};

export default function App() {
  const { token } = theme.useToken();
  const NiceGlobalContext = useContext(GlobalContext);
  const { themeTypeConfig } = NiceGlobalContext;
  const { $fmt } = useIntlUtls();

  const { globalSearchPanelRef } = useGlobalSearchPanel();

  const [groups, setGroups] = useState<UnionGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});

  const [tabModalVisible, setTabModalVisible] = useState(false);
  const [editTabData, setEditTabData] = useState<editTabDataItem>(resetEditTabData());

  const [removeModal, removeContextHolder] = Modal.useModal();

  const initData = useCallback(async () => {
    try {
      const _settings = await settingsUtils.getSettings();
      setSettings(_settings);
      const tagList = await tabListUtils.getTagList();
      const result: UnionGroupItem[] = [];
      for (let i = 0; i < tagList.length; i++) {
        const tag = tagList[i];
        for (let j = 0; j < tag.groupList.length; j++) {
          const g = tag.groupList[j];
          if (g.isStarred) {
            result.push({
              tagId: tag.tagId,
              tagName: tag.tagName,
              tagStatic: tag.static,
              groupId: g.groupId,
              groupName: g.groupName,
              tabList: [...g.tabList],
            });
          }
        }
      }
      setGroups(result);
    } catch (err) {
      console.error('Failed to load new tab data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
    const tabListUnwatch = storage.watch(tabListUtils.storageKey, () => {
      initData();
    });

    const settingsUnwatch = storage.watch(settingsUtils.storageKey, () => {
      initData();
    });
    return () => {
      tabListUnwatch();
      settingsUnwatch();
    };
  }, [initData]);

  // 通知所有管理后台刷新数据
  const reloadAdminPage = useCallback(() => {
    sendRuntimeMessage({
      msgType: 'reloadAllAdminPage',
      data: {},
      targetPageContexts: ['optionsPage'],
    });
  }, []);

  // ---- Tab CRUD ----
  const handleTabRemove = useCallback(
    async (gid: string, tab: TabItem) => {
      if (!settings[CONFIRM_BEFORE_DELETING_TABS]) {
        await tabListUtils.removeTabs(gid, [tab]);
        await initData();
        reloadAdminPage();
        return;
      }
      const removeDesc = $fmt({
        id: 'home.removeDesc',
        values: {
          type: `${$fmt(
            'home.tab',
          )}${` <div style="display: inline-flex; align-items: center; font-weight: bold;">
          [<strong style="display: inline-block; max-width: 280px" class="ellipsis">
            ${tab.title}</strong>
          ]</div>
        `}`,
        },
      });
      const confirmed = await removeModal.confirm({
        title: $fmt('home.removeTitle'),
        content: <div dangerouslySetInnerHTML={{ __html: removeDesc }}></div>,
      });
      console.log('tab-remove-confirmed', confirmed);
      if (confirmed) {
        await tabListUtils.removeTabs(gid, [tab]);
        await initData();
        reloadAdminPage();
      }
    },
    [settings, removeModal, $fmt, initData],
  );

  const handleTabEdit = useCallback((tab: TabItem) => {
    setEditTabData(prev => ({ ...prev, ...tab }));
    setTabModalVisible(true);
  }, []);

  const handleAddTabStart = useCallback((groupId: string) => {
    setEditTabData({ groupId, tabId: '', title: '', url: '' });
    setTabModalVisible(true);
  }, []);

  const handleTabModalConfirm = useCallback(
    async (newData: TabItem) => {
      if (newData.tabId) {
        // 编辑标签页
        const grp = groups.find(g => g.tabList.some(t => t.tabId === newData.tabId));
        if (grp) {
          await tabListUtils.updateTab({
            groupId: grp.groupId,
            data: pick(newData, ['tabId', 'title', 'url']),
          });
          await initData();
          reloadAdminPage();
        }
      } else {
        // 添加标签页
        await tabListUtils.addTabItem(editTabData.groupId, {
          tabId: getRandomId(),
          title: newData.title || '',
          url: newData.url,
        });
        await initData();
        reloadAdminPage();
      }
      setTabModalVisible(false);
      setEditTabData(resetEditTabData());
    },
    [groups, editTabData, initData],
  );

  const handleTabModalCancel = useCallback(() => {
    setTabModalVisible(false);
    setEditTabData(resetEditTabData());
  }, []);

  // 编辑标签组名称
  const handleGroupNameChange = useCallback(
    async (item: UnionGroupItem, newName: string) => {
      await tabListUtils.updateTabGroup({
        tagId: item.tagId,
        groupId: item.groupId,
        data: { groupName: newName },
      });
      await initData();
      reloadAdminPage();
    },
    [groups, initData],
  );

  if (loading) {
    return (
      <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
        <StyledNewTabContainer className="newtab-container">
          <GlobalStyle />
          <div className="newtab-loading">
            <Spin spinning={loading} size="large"></Spin>
          </div>
        </StyledNewTabContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={{ ...themeTypeConfig, ...token }}>
      <GlobalStyle />
      <GlobalSearchPanel
        ref={globalSearchPanelRef}
        pageContext="newtabPage"
      ></GlobalSearchPanel>

      <StyledNewTabContainer className="newtab-container">
        {/* 搜索引擎（吸顶） */}
        <SearchEngine />

        {!groups.length ? (
          <div className="newtab-empty">
            <p className="newtab-empty-title">{$fmt('newtab.noGroups')}</p>
            <p className="newtab-empty-desc">{$fmt('newtab.noGroupsDesc')}</p>
            <Button type="primary" onClick={() => openAdminRoutePage({ path: '/home' })}>
              {$fmt('common.openAdminTab')}
            </Button>
          </div>
        ) : (
          <>
            <div className="newtab-groups">
              {groups.map(group => (
                <div key={group.groupId} className="newtab-group-section">
                  <StyledGroupHeader>
                    {group.tagName ? (
                      <Tag icon={<TagOutlined />} color={token.colorPrimary}>
                        {group.tagStatic ? $fmt('home.stagingArea') : group.tagName}
                      </Tag>
                    ) : null}
                    <EditInput
                      value={group.groupName}
                      maxWidth={200}
                      onValueChange={val => val && handleGroupNameChange(group, val)}
                    />
                    <span className="newtab-group-count">
                      {$fmt({
                        id: 'home.tab.count',
                        values: { count: group.tabList?.length || 0 },
                      })}
                    </span>
                  </StyledGroupHeader>
                  <div className="newtab-grid">
                    {group.tabList.map(tab => (
                      <TabListItem
                        key={tab.tabId}
                        tab={tab}
                        groupId={group.groupId}
                        onDelete={handleTabRemove}
                        onEdit={handleTabEdit}
                      />
                    ))}
                    <StyledAddTabBtn onClick={() => handleAddTabStart(group.groupId)}>
                      <div className="add-icon-wrapper">
                        <PlusOutlined className="add-icon-plus" />
                      </div>
                      <span className="add-label">{$fmt('newtab.addTab')}</span>
                    </StyledAddTabBtn>
                  </div>
                </div>
              ))}
            </div>

            {/* 编辑标签页弹窗 */}
            {tabModalVisible && editTabData && (
              <TabItemEditModal
                data={editTabData}
                visible={tabModalVisible}
                type={editTabData.tabId ? 'edit' : 'add'}
                onOk={handleTabModalConfirm}
                onCancel={handleTabModalCancel}
              />
            )}
          </>
        )}

        {removeContextHolder}
      </StyledNewTabContainer>
    </ThemeProvider>
  );
}
