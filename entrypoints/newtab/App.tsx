import React, { useEffect, useState, useCallback, useRef } from 'react';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import type { TabItem, LanguageTypes, SettingsProps, TagItem } from '~/entrypoints/types';
import modules from '~/entrypoints/common/locale/modules';
import { getRandomId } from '~/entrypoints/common/utils';

const SEARCH_GROUP_NAME = 'searchengine';

interface SelectedGroup {
  tagId: string; tagName: string; groupId: string; groupName: string; tabList: TabItem[];
}
interface DragState { groupId: string; index: number; }
interface SearchEngine { id: string; name: string; url: string; }

const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=%s' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
];

function getFaviconUrl(url: string, favIconUrl?: string) {
  if (favIconUrl) return favIconUrl;
  try { 
    var u = new URL(url); 
    return 'https://www.google.com/s2/favicons?domain=' + u.hostname + '&sz=64'; 
  } catch (e) { 
    return ''; 
  }
}

function ThreeDotsMenu({ onEdit, onDelete, t }) {
  var [open, setOpen] = useState(false);
  var ref = useRef<HTMLDivElement>(null);
  
  useEffect(function() {
    var f = function(e: MouseEvent) { 
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); 
    };
    document.addEventListener('mousedown', f);
    return function() { document.removeEventListener('mousedown', f); };
  }, []);

  return (
    <div className="three-dots-menu" ref={ref}>
      <button 
        className="three-dots-btn" 
        onClick={function(e) { e.stopPropagation(); setOpen(!open); }} 
        title={t('newtab.edit')}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx={12} cy={5} r={1.5} />
          <circle cx={12} cy={12} r={1.5} />
          <circle cx={12} cy={19} r={1.5} />
        </svg>
      </button>
      {open && (
        <div className="three-dots-dropdown">
          <button onClick={function(e) { e.stopPropagation(); setOpen(false); onEdit(); }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t('newtab.edit')}
          </button>
          <button 
            onClick={function(e) { e.stopPropagation(); setOpen(false); onDelete(); }} 
            className="danger"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {t('newtab.delete')}
          </button>
        </div>
      )}
    </div>
  );
}

function TabCard({ tab, index, groupId, onDragStart, onDragOver, onDrop, onDragEnd, onDelete, onEdit, isDragged, openInNewWindow, t }) {
  var favicon = getFaviconUrl(tab.url, tab.favIconUrl);
  var [imgError, setImgError] = useState(false);
  var displayTitle = tab.title || tab.url || 'Untitled';
  
  var handleClick = function() { 
    if (!tab.url) return; 
    if (openInNewWindow) { window.open(tab.url, '_blank'); } else { window.location.href = tab.url; } 
  };
  
  var handleMiddleClick = function(e: React.MouseEvent) { 
    if (e.button === 1 && tab.url) { e.preventDefault(); window.open(tab.url, '_blank'); } 
  };

  return (
    <div 
      className={'tab-card' + (isDragged ? ' dragging' : '')} 
      draggable={true}
      onDragStart={function(e) { 
        e.dataTransfer.effectAllowed = 'move'; 
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'tab', groupId, index })); 
        onDragStart(groupId, index); 
      }}
      onDragOver={function(e) { onDragOver(e, index); }} 
      onDrop={function(e) { onDrop(e, index, groupId); }}
      onDragEnd={onDragEnd} 
      onClick={handleClick} 
      onMouseDown={handleMiddleClick} 
      title={displayTitle}
    >
      <ThreeDotsMenu onEdit={function() { onEdit(tab); }} onDelete={function() { onDelete(groupId, tab.tabId); }} t={t} />
      <div className="tab-card-ios-icon">
        {favicon && !imgError ? (
          <img src={favicon} alt="" onError={function() { setImgError(true); }} draggable={false} />
        ) : (
          <div className="tab-card-icon-fallback">{(displayTitle[0] || '?').toUpperCase()}</div>
        )}
      </div>
      <div className="tab-card-title">
        <span>{displayTitle}</span>
      </div>
    </div>
  );
}

function EditableGroupName({ name, onSave }) {
  var [editing, setEditing] = useState(false);
  var [value, setValue] = useState(name);
  var ref = useRef<HTMLInputElement>(null);
  
  useEffect(function() { 
    if (editing && ref.current) { ref.current.focus(); ref.current.select(); } 
  }, [editing]);
  
  var handleSave = function() { 
    if (value.trim() && value.trim() !== name) onSave(value.trim()); 
    setEditing(false); 
    setValue(name); 
  };

  if (editing) {
    return (
      <input 
        ref={ref} 
        className="group-name-input" 
        value={value} 
        onChange={function(e) { setValue(e.target.value); }} 
        onBlur={handleSave}
        onKeyDown={function(e) { 
          if (e.key === 'Enter') handleSave(); 
          if (e.key === 'Escape') { setValue(name); setEditing(false); } 
        }} 
        onClick={function(e) { e.stopPropagation(); }} 
      />
    );
  }

  return (
    <span 
      className="group-name-text" 
      onClick={function(e) { e.stopPropagation(); setEditing(true); setValue(name); }} 
      title="Click to edit"
    >
      {name}
    </span>
  );
}

function findGroupPosition(tagList, groupId) {
  for (var i = 0; i < tagList.length; i++) { 
    var tag = tagList[i];
    for (var j = 0; j < tag.groupList.length; j++) { 
      if (tag.groupList[j].groupId === groupId) return { tagId: tag.tagId, index: j }; 
    }
  }
  return null;
}

export default function App() {
  var [groups, setGroups] = useState<any[]>([]);
  var [searchQuery, setSearchQuery] = useState('');
  var [loading, setLoading] = useState(true);
  var [dragState, setDragState] = useState<DragState | null>(null);
  var [settings, setSettings] = useState<any>({});
  var [searchEngines, setSearchEngines] = useState<SearchEngine[]>(DEFAULT_SEARCH_ENGINES);
  var [editingTab, setEditingTab] = useState<any>(null);
  var [creatingGroupId, setCreatingGroupId] = useState<string | null>(null);
  var [editTitle, setEditTitle] = useState('');
  var [editUrl, setEditUrl] = useState('');
  var [showTabModal, setShowTabModal] = useState(false);
  var [showEngineModal, setShowEngineModal] = useState(false);
  var [engineName, setEngineName] = useState('');
  var [engineUrl, setEngineUrl] = useState('');
  var [editEngineIdx, setEditEngineIdx] = useState<number | null>(null);
  var [engineDragIdx, setEngineDragIdx] = useState<number | null>(null);
  var [engineOverIdx, setEngineOverIdx] = useState<number | null>(null);
  var [enginesNeedSave, setEnginesNeedSave] = useState(false);
  var [hasSearchGroup, setHasSearchGroup] = useState(false);
  var [groupDragSourceId, setGroupDragSourceId] = useState<string | null>(null);
  var [groupDragTargetId, setGroupDragTargetId] = useState<string | null>(null);
  var [theme, setTheme] = useState('light');
  var [lang, setLang] = useState('en-US');
  
  var isCreating = creatingGroupId !== null;
  var defaultEngine = searchEngines[0];

  var t = useCallback(function(key: string) {
    // @ts-ignore
    return modules[lang]?.[key] || modules['en-US']?.[key] || key;
  }, [lang]);

  async function ensureSearchGroup() {
    var tagList = await tabListUtils.getTagList();
    var stagTag = tagList.find(function(t) { return t.static || t.tagId === '0'; });
    if (!stagTag) return null;
    var group = stagTag.groupList.find(function(g) { return g.groupName === SEARCH_GROUP_NAME; });
    if (!group) {
      await tabListUtils.createTabGroup(stagTag.tagId, { groupName: SEARCH_GROUP_NAME, createTime: new Date().toISOString(), tabList: [], isLocked: true });
      var newTagList = await tabListUtils.getTagList();
      var newStag = newTagList.find(function(t) { return t.static || t.tagId === '0'; });
      group = newStag ? newStag.groupList.find(function(g) { return g.groupName === SEARCH_GROUP_NAME; }) : null;
      return group ? { tag: newStag, group: group } : null;
    }
    if (!group.isLocked) await tabListUtils.updateTabGroup({ tagId: stagTag.tagId, groupId: group.groupId, data: { isLocked: true } });
    return { tag: stagTag, group: group };
  }

  async function saveSearchEnginesToGroup(engines) {
    var result = await ensureSearchGroup();
    if (!result) return;
    var oldTabIds = result.group.tabList.map(function(t) { return t.tabId; });
    for (var i = 0; i < engines.length; i++) await tabListUtils.addTabItem(result.group.groupId, { tabId: getRandomId(), title: engines[i].name, url: engines[i].url });
    for (var j = 0; j < oldTabIds.length; j++) try { await tabListUtils.removeTabs(result.group.groupId, [{ tabId: oldTabIds[j] }]); } catch (e) {}
  }

  async function loadSearchEnginesFromTagList() {
    var tagList = await tabListUtils.getTagList();
    var stagTag = tagList.find(function(t) { return t.static || t.tagId === '0'; });
    var group = stagTag ? stagTag.groupList.find(function(g) { return g.groupName === SEARCH_GROUP_NAME; }) : null;
    if (group && group.tabList.length > 0) {
      setSearchEngines(group.tabList.map(function(t) { return { id: t.tabId, name: t.title || 'Unnamed', url: t.url || '' }; }));
      setHasSearchGroup(true);
    } else { setSearchEngines(DEFAULT_SEARCH_ENGINES); setHasSearchGroup(false); }
  }

  var loadData = useCallback(async function() {
    try {
      var s = await settingsUtils.getSettings();
      setSettings(s); setLang(s.language || 'en-US');
      if (s.themeType === 'dark' || (s.themeType === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark'); setTheme('dark');
      } else { document.documentElement.removeAttribute('data-theme'); setTheme('light'); }
      var tagList = await tabListUtils.getTagList();
      var result: any[] = [];
      for (var i = 0; i < tagList.length; i++) {
        var tag = tagList[i];
        for (var j = 0; j < tag.groupList.length; j++) {
          var g = tag.groupList[j];
          if (g.isStarred && g.groupName !== SEARCH_GROUP_NAME) result.push({ tagId: tag.tagId, tagName: tag.tagName, groupId: g.groupId, groupName: g.groupName, tabList: [...g.tabList] });
        }
      }
      setGroups(result);
      await loadSearchEnginesFromTagList();
    } catch (err) { console.error('Failed to load new tab data:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(function() {
    loadData();
    // 假设全局变量 storage 存在于运行环境中
    // @ts-ignore
    var uw1 = storage.watch('local:tabList', function() { loadData(); });
    // @ts-ignore
    var uw2 = storage.watch('local:settings', function() { loadData(); });
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var ht = function() { settingsUtils.getSettings().then(function(s) { if (s.themeType === 'auto') { var d = window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light'); setTheme(d ? 'dark' : 'light'); } }); };
    mq.addEventListener('change', ht);
    return function() { uw1(); uw2(); mq.removeEventListener('change', ht); };
  }, [loadData]);

  var handleSearchSubmit = function(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      var query = searchQuery.trim();
      if (query.indexOf('.') > -1 && query.indexOf(' ') === -1) {
        window.location.href = query.indexOf('http') === 0 ? query : 'https://' + query;
      } else {
        var searchUrl = defaultEngine.url.replace('%s', encodeURIComponent(query));
        if (settings.restoreInNewWindow) { window.open(searchUrl, '_blank'); }
        else { window.location.href = searchUrl; }
      }
    }
  };

  var handleDeleteTab = async function(gid: string, tid: string) {
    if (settings.confirmBeforeDeletingTabs !== false) { if (!confirm(t('newtab.confirmDelete'))) return; }
    await tabListUtils.removeTabs(gid, [{ tabId: tid }]); await loadData();
  };

  var handleEditTab = function(tab) { setCreatingGroupId(null); setEditingTab(tab); setEditTitle(tab.title || ''); setEditUrl(tab.url || ''); setShowTabModal(true); };
  var handleStartAddTab = function(gid) { setEditingTab(null); setCreatingGroupId(gid); setEditTitle(''); setEditUrl(''); setShowTabModal(true); };
  var handleCloseTabModal = function() { setShowTabModal(false); setEditingTab(null); setCreatingGroupId(null); setEditTitle(''); setEditUrl(''); };

  var handleSaveTabModal = async function() {
    if (isCreating && creatingGroupId) {
      var nt = { tabId: getRandomId(), title: editTitle || undefined, url: editUrl || undefined };
      if (nt.url) { await tabListUtils.addTabItem(creatingGroupId, nt); await loadData(); }
    } else if (editingTab) {
      var grp = groups.find(function(g) { return g.tabList.some(function(t) { return t.tabId === editingTab.tabId; }); });
      if (grp) { await tabListUtils.updateTab({ groupId: grp.groupId, data: { tabId: editingTab.tabId, title: editTitle, url: editUrl } }); await loadData(); }
    }
    handleCloseTabModal();
  };

  var handleSaveGroupName = async function(gid, nn) {
    for (var i = 0; i < groups.length; i++) { if (groups[i].groupId === gid) { await tabListUtils.updateTabGroup({ tagId: groups[i].tagId, groupId: gid, data: { groupName: nn } }); break; } }
    await loadData();
  };

  var handleOpenEngineModal = function() { if (!hasSearchGroup) setSearchEngines(DEFAULT_SEARCH_ENGINES); setShowEngineModal(true); };
  var handleEngineDragStart = function(idx) { setEngineDragIdx(idx); };
  var handleEngineDragOver = function(e: React.DragEvent, idx) { e.preventDefault(); setEngineOverIdx(idx); };

  var handleEngineDragEnd = function() {
    if (engineDragIdx !== null && engineOverIdx !== null && engineDragIdx !== engineOverIdx) {
      var nl = [...searchEngines]; var m = nl.splice(engineDragIdx, 1)[0]; nl.splice(engineOverIdx, 0, m);
      setSearchEngines(nl); setEnginesNeedSave(true);
    }
    setEngineDragIdx(null); setEngineOverIdx(null);
  };

  var handleEngineEdit = function(idx) { setEditEngineIdx(idx); setEngineName(searchEngines[idx].name); setEngineUrl(searchEngines[idx].url); };

  var handleEngineSaveEdit = function() {
    if (editEngineIdx !== null) {
      var nl = [...searchEngines]; nl[editEngineIdx] = { ...nl[editEngineIdx], name: engineName.trim(), url: engineUrl.trim() };
      setSearchEngines(nl); setEnginesNeedSave(true);
    } else {
      setSearchEngines([...searchEngines, { id: 'custom_' + Date.now(), name: engineName.trim(), url: engineUrl.trim() }]); setEnginesNeedSave(true);
    }
    setEditEngineIdx(null); setEngineName(''); setEngineUrl('');
  };

  var handleEngineDelete = function(idx) {
    if (searchEngines.length <= 1) return;
    if (!confirm(t('newtab.deleteEngine'))) return;
    var nl = searchEngines.filter(function(_, i) { return i !== idx; });
    setSearchEngines(nl); setEnginesNeedSave(true);
    if (editEngineIdx === idx) { setEditEngineIdx(null); setEngineName(''); setEngineUrl(''); }
  };

  var handleSaveEngines = async function() {
    if (searchEngines.length > 0) { await saveSearchEnginesToGroup(searchEngines); setHasSearchGroup(true); setEnginesNeedSave(false); }
    setShowEngineModal(false); setEditEngineIdx(null); setEngineName(''); setEngineUrl('');
  };

  var handleCancelEngines = function() {
    if (!hasSearchGroup) { setSearchEngines(DEFAULT_SEARCH_ENGINES); } else { loadSearchEnginesFromTagList(); }
    setShowEngineModal(false); setEditEngineIdx(null); setEngineName(''); setEngineUrl(''); setEnginesNeedSave(false);
  };

  var handleGroupDragStart = useCallback(function(gid, idx) { setDragState({ groupId: gid, index: idx }); }, []);
  var handleGroupDrop = useCallback(async function(e: React.DragEvent, ti, tg) {
    e.preventDefault();
    var sg = dragState ? dragState.groupId : undefined;
    var si = dragState ? dragState.index : undefined;
    if (sg === undefined || si === undefined) { setDragState(null); return; }
    if (sg === tg && si === ti) { setDragState(null); return; }
    await tabListUtils.onTabDrop(sg, tg, si, ti); setDragState(null); await loadData();
  }, [dragState, loadData]);
  var handleGroupDragOver = useCallback(function(e: React.DragEvent) { e.preventDefault(); }, []);
  var handleDragEnd = useCallback(function() { setDragState(null); }, []);

  var handleGroupSectionDragStart = useCallback(function(e: React.DragEvent, gid) {
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'group', groupId: gid })); setGroupDragSourceId(gid);
  }, []);
  var handleGroupSectionDragOver = useCallback(function(e: React.DragEvent, gid) {
    if (!groupDragSourceId || groupDragSourceId === gid) return; e.preventDefault(); setGroupDragTargetId(gid);
  }, [groupDragSourceId]);
  var handleGroupSectionDragLeave = useCallback(function() { setGroupDragTargetId(null); }, []);
  var handleGroupSectionDrop = useCallback(async function(e: React.DragEvent) {
    e.preventDefault(); var sg = groupDragSourceId; var tg = groupDragTargetId;
    setGroupDragSourceId(null); setGroupDragTargetId(null);
    if (!sg || !tg || sg === tg) return;
    var tl = await tabListUtils.getTagList();
    var sp = findGroupPosition(tl, sg); var tp = findGroupPosition(tl, tg);
    if (sp && tp) await tabListUtils.onTabGroupDrop(sp.tagId, tp.tagId, sp.index, tp.index);
    await loadData();
  }, [groupDragSourceId, groupDragTargetId, loadData]);
  var handleGroupSectionDragEnd = useCallback(function() { setGroupDragSourceId(null); setGroupDragTargetId(null); }, []);

  // —— Sub-render components moved to JSX blocks ——
  if (loading) {
    return (
      <div className="newtab-container">
        <div className="newtab-loading">
          <div className="newtab-loading-spinner" />
        </div>
      </div>
    );
  }

  var searchIconUrl = defaultEngine ? getFaviconUrl(defaultEngine.url.replace('%s', 'test')) : '';
  var searchForm = (
    <div className="newtab-search-wrapper">
      <form className="newtab-search" onSubmit={handleSearchSubmit}>
        <button 
          type="button" 
          className="newtab-search-icon-btn" 
          onClick={handleOpenEngineModal} 
          title={defaultEngine ? defaultEngine.name : ''}
        >
          <img src={searchIconUrl} alt={defaultEngine ? defaultEngine.name : ''} className="newtab-search-brand-icon" />
        </button>
        <input 
          type="text" 
          className="newtab-search-input" 
          placeholder={t('newtab.searchPlaceholder')} 
          value={searchQuery} 
          onChange={function(e) { setSearchQuery(e.target.value); }} 
          autoFocus={true} 
        />
      </form>
    </div>
  );

  function renderEngineModal() {
    return (
      <div className="newtab-modal-overlay" onClick={handleCancelEngines}>
        <div className="newtab-modal engine-modal" onClick={function(e) { e.stopPropagation(); }}>
          <h3 className="newtab-modal-title">{t('newtab.manageEngines')}</h3>
          <p className="engine-modal-hint">{t('newtab.dragHint')}</p>
          <div className="engine-list">
            {searchEngines.map(function(engine, idx) {
              return (
                <div 
                  key={engine.id}
                  className={'engine-item' + (engineDragIdx === idx ? ' dragging' : '') + (engineOverIdx === idx && engineDragIdx !== idx ? ' drag-over' : '')}
                  draggable={true} 
                  onDragStart={function() { handleEngineDragStart(idx); }}
                  onDragOver={function(e) { handleEngineDragOver(e, idx); }} 
                  onDragEnd={handleEngineDragEnd}
                >
                  <span className="engine-item-order">{idx === 0 ? '\u2B50' : '' + (idx + 1)}</span>
                  <img src={getFaviconUrl(engine.url.replace('%s', 'test'))} alt="" className="engine-item-icon" draggable={false} />
                  <div className="engine-item-info">
                    <span className="engine-item-name">{engine.name}</span>
                    <span className="engine-item-url">
                      {function() { try { return new URL(engine.url.replace('%s', 'test')).hostname; } catch { return ''; } }()}
                    </span>
                  </div>
                  {idx === 0 ? <span className="engine-item-default">{t('newtab.defaultEngine')}</span> : null}
                  <button className="engine-item-edit" onClick={function() { handleEngineEdit(idx); }} title={t('newtab.edit')}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  {searchEngines.length > 1 ? (
                    <button className="engine-item-del" onClick={function() { handleEngineDelete(idx); }} title={t('newtab.delete')}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="engine-form">
            <input type="text" className="engine-form-input" placeholder={t('newtab.engineName')} value={engineName} onChange={function(e) { setEngineName(e.target.value); }} />
            <input type="text" className="engine-form-input" placeholder={t('newtab.engineUrl')} value={engineUrl} onChange={function(e) { setEngineUrl(e.target.value); }} />
            <button className="engine-form-btn" disabled={!engineName.trim() || !engineUrl.trim()} onClick={handleEngineSaveEdit}>
              {editEngineIdx !== null ? t('newtab.save') : t('newtab.addEngine')}
            </button>
          </div>
          <div className="newtab-modal-actions">
            <button className="newtab-modal-btn primary" onClick={handleSaveEngines}>{t('newtab.save')}</button>
            <button className="newtab-modal-btn cancel" onClick={handleCancelEngines}>{t('newtab.cancel')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="newtab-container">
        {searchForm}
        <div className="newtab-empty">
          <p className="newtab-empty-title">{t('newtab.noGroups')}</p>
          <p className="newtab-empty-desc">{t('newtab.noGroupsDesc')}</p>
          {/* 假设全局变量 browser 存在 */}
          {/* @ts-ignore */}
          <button className="newtab-open-admin-btn" onClick={function() { window.open(browser.runtime.getURL('/options.html'), '_blank'); }}>
            {t('newtab.openAdmin')}
          </button>
        </div>
        {showEngineModal ? renderEngineModal() : null}
      </div>
    );
  }

  return (
    <div className="newtab-container">
      {searchForm}
      <div className="newtab-groups">
        {groups.map(function(group) {
          return (
            <div 
              key={group.groupId}
              className={'newtab-group-section' + (groupDragTargetId === group.groupId ? ' drag-over' : '')}
              onDragOver={function(e) { handleGroupSectionDragOver(e, group.groupId); }}
              onDragLeave={handleGroupSectionDragLeave} 
              onDrop={handleGroupSectionDrop}
            >
              <div 
                className={'newtab-group-header drag-handle' + (groupDragSourceId === group.groupId ? ' dragging' : '')}
                draggable={true} 
                onDragStart={function(e) { handleGroupSectionDragStart(e, group.groupId); }} 
                onDragEnd={handleGroupSectionDragEnd}
              >
                {group.tagName && group.tagId === '0' ? (
                  <span className="staging-drag-icon" title={group.tagName}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <line x1={4} y1={6} x2={20} y2={6} />
                      <line x1={4} y1={12} x2={20} y2={12} />
                      <line x1={4} y1={18} x2={20} y2={18} />
                    </svg>
                  </span>
                ) : group.tagName ? (
                  <span className="newtab-group-tag">{group.tagName}</span>
                ) : null}
                <EditableGroupName name={group.groupName} onSave={function(nn) { handleSaveGroupName(group.groupId, nn); }} />
                <span className="newtab-group-count">{group.tabList.length} {' '} {t('newtab.tabs')}</span>
              </div>
              <div className="newtab-grid">
                {group.tabList.map(function(tab, idx) {
                  return (
                    <TabCard 
                      key={tab.tabId} 
                      tab={tab} 
                      index={idx} 
                      groupId={group.groupId}
                      onDragStart={handleGroupDragStart} 
                      onDragOver={handleGroupDragOver} 
                      onDrop={handleGroupDrop}
                      onDragEnd={handleDragEnd} 
                      onDelete={handleDeleteTab} 
                      onEdit={handleEditTab}
                      isDragged={dragState && dragState.groupId === group.groupId && dragState.index === idx}
                      openInNewWindow={settings.restoreInNewWindow} 
                      t={t} 
                    />
                  );
                })}
                <button className="newtab-add-tab-btn" onClick={function() { handleStartAddTab(group.groupId); }} title={t('newtab.add')}>
                  <div className="add-icon-wrapper">
                    <svg className="add-icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1={12} y1={5} x2={12} y2={19} />
                      <line x1={5} y1={12} x2={19} y2={12} />
                    </svg>
                  </div>
                  <span className="add-label">{t('newtab.add')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {showTabModal && (
        <div className="newtab-modal-overlay" onClick={handleCloseTabModal}>
          <div className="newtab-modal" onClick={function(e) { e.stopPropagation(); }}>
            <h3 className="newtab-modal-title">{isCreating ? t('newtab.addUrl') : t('newtab.edit')}</h3>
            <div className="newtab-modal-field">
              <label>{isCreating ? t('newtab.addUrlTitle') : t('newtab.editTitle')}</label>
              <input type="text" value={editTitle} onChange={function(e) { setEditTitle(e.target.value); }} placeholder={isCreating ? t('newtab.addUrlTitle') : t('newtab.editTitle')} />
            </div>
            <div className="newtab-modal-field">
              <label>{t('newtab.editUrl')}</label>
              <input type="text" value={editUrl} onChange={function(e) { setEditUrl(e.target.value); }} placeholder={t('newtab.editUrl')} />
            </div>
            <div className="newtab-modal-actions">
              <button className="newtab-modal-btn cancel" onClick={handleCloseTabModal}>{t('newtab.cancel')}</button>
              <button className="newtab-modal-btn primary" onClick={handleSaveTabModal} disabled={isCreating && !editUrl.trim()}>{t('newtab.save')}</button>
            </div>
          </div>
        </div>
      )}
      
      {showEngineModal ? renderEngineModal() : null}
    </div>
  );
}