import { useState, useCallback, useEffect, useMemo } from 'react';
import { Tooltip } from 'antd';
import { settingsUtils } from '~/entrypoints/common/storage';
import type { SearchEngine } from '~/entrypoints/types';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { openNewTab } from '~/entrypoints/common/tabs';
import {
  DEFAULT_SEARCH_ENGINES,
  ENUM_SETTINGS_PROPS,
} from '~/entrypoints/common/constants';
import Favicon from '~/entrypoints/common/components/Favicon';
import SearchEngineModal from './SearchEngineModal';
import { StyledSearchEngineBox } from './SearchEngine.styled';

const { SEARCH_ENGINES } = ENUM_SETTINGS_PROPS;

export default function SearchEngine() {
  const { $fmt } = useIntlUtls();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngines, setSearchEngines] =
    useState<SearchEngine[]>(DEFAULT_SEARCH_ENGINES);
  const [engineModalVisible, setEngineModalVisible] = useState(false);

  const defaultEngine = useMemo(() => {
    return searchEngines.find(engine => engine.default) || searchEngines[0];
  }, [searchEngines]);

  const initSearchEngine = useCallback(async () => {
    const settings = await settingsUtils.getSettings();
    setSearchEngines(settings[SEARCH_ENGINES] || DEFAULT_SEARCH_ENGINES);
  }, []);

  // 初始化搜索引擎
  useEffect(() => {
    initSearchEngine();
  }, []);

  // 搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    if (query.indexOf('.') > -1 && query.indexOf(' ') === -1) {
      openNewTab(query.indexOf('http') === 0 ? query : 'https://' + query, {
        active: true,
        openToNext: true,
      });
    } else {
      const searchUrl = defaultEngine.url.replace('%s', encodeURIComponent(query));
      openNewTab(searchUrl, { active: true, openToNext: true });
    }
  };

  // 打开引擎模态框
  const handleOpenEngineModal = useCallback(() => {
    setEngineModalVisible(true);
  }, []);

  const handleSaveEngines = useCallback(async (engines: SearchEngine[]) => {
    if (engines.length > 0) {
      const currentSettings = await settingsUtils.getSettings();
      await settingsUtils.setSettings({
        ...currentSettings,
        searchEngines: engines,
      });
      setSearchEngines(engines);
    }
    setEngineModalVisible(false);
  }, []);

  const handleCancelEngines = useCallback(() => {
    setEngineModalVisible(false);
  }, []);

  return (
    <>
      <StyledSearchEngineBox>
        <form className="newtab-search" onSubmit={handleSearchSubmit}>
          <Tooltip title={defaultEngine ? defaultEngine.name : ''}>
            <div className="newtab-search-icon-btn" onClick={handleOpenEngineModal}>
              <Favicon pageUrl={defaultEngine.url!} favIconUrl="" size={20}></Favicon>
            </div>
          </Tooltip>
          <input
            type="text"
            className="newtab-search-input"
            placeholder={$fmt('newtab.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus={true}
          />
        </form>
      </StyledSearchEngineBox>

      <SearchEngineModal
        visible={engineModalVisible}
        data={searchEngines}
        onOk={handleSaveEngines}
        onCancel={handleCancelEngines}
      />
    </>
  );
}
