import {
  createContext,
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  theme,
  Select,
  Input,
  Checkbox,
  Space,
  Switch,
  Modal,
  type InputRef,
  type RefSelectProps,
  type SelectProps,
} from 'antd';
import styled from 'styled-components';
import VirtualList from 'rc-virtual-list';
import {
  TagOutlined,
  ProductOutlined,
  DeleteOutlined,
  ExportOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { debounce, groupBy } from 'lodash-es';

import { tabTarget, type OpenMode } from '~/entrypoints/common/openUtils';
import { pick, sendRuntimeMessage } from '~/entrypoints/common/utils';
import { ENUM_COLORS, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls, eventEmitter } from '~/entrypoints/common/hooks/global';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';
import { ContentGlobalContext } from '~/entrypoints/content/context';
import {
  StyledEllipsis,
  StyledActionIconBtn,
} from '~/entrypoints/common/style/Common.styled';
import type {
  PageContextType,
  TagItem,
  GroupItem,
  TabItem,
  SendTabMsgEventProps,
} from '~/entrypoints/types';
import { eventEmitter as homeEventEmitter } from '~/entrypoints/options/home/hooks/homeCustomEvent';
import MoveToModal from '~/entrypoints/options/home/MoveToModal';

import { OpenModeMenu, useOpenSavedTabs } from './OpenModeMenu';
import ActionIconBtn from './ActionIconBtn.tsx';

const { GLOBAL_SEARCH_DELETE_AFTER_OPEN, DISCARD_WHEN_OPEN_TABS, OPENING_TABS_ORDER } =
  ENUM_SETTINGS_PROPS;

export type SearchListItemProps = Pick<TagItem, 'tagId' | 'tagName' | 'static'> &
  Pick<GroupItem, 'groupId' | 'groupName' | 'isLocked'> &
  Pick<TabItem, 'tabId' | 'title' | 'url'>;

function toSearchListItem(
  tag: TagItem,
  group: GroupItem,
  tab: TabItem,
): SearchListItemProps {
  return {
    ...pick(tag, ['tagId', 'tagName', 'static']),
    ...pick(group, ['groupId', 'groupName']),
    isLocked: tag.isLocked || group.isLocked,
    ...pick(tab, ['tabId', 'title', 'url']),
  };
}

export type ActionMode = 'goto' | 'select';
export type BatchActionType = 'remove' | 'open' | 'moveTo';

export type ActionCallbackFn = (
  type: 'tag' | 'tabGroup' | 'tab' | 'open' | 'select',
  option?: SearchListItemProps,
) => void;

export type BatchActionCallbackFn = (
  type: BatchActionType,
  selectedItems?: SearchListItemProps[],
) => void;

export const StyledListItem = styled.div`
  display: flex;
  align-items: center;
  .checkbox-wrapper {
    flex: 0 0 auto;
    padding: 8px 16px 8px 0;
  }
  .item-content-box {
    width: 0;
    position: relative;
    flex: 1;
  }
  .item-content {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .tag-name,
  .group-name {
    max-width: 25%;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .text {
      ${StyledEllipsis};
    }
  }
  .divider {
    display: inline-flex;
    flex: 0 0 auto;
    margin: 0 8px;
  }
  .tab-title {
    flex: 1 0 auto;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    .text {
      flex: 1;
      width: 0;
      ${StyledEllipsis};
    }
    .icon-open {
      flex: 0 0 auto;
      margin-left: 8px;
    }
  }
  .tab-url {
    width: 100%;
    color: ${props => props.theme.colorTextTertiary || '#999'};
    ${StyledEllipsis};
  }
`;

const SearchModalContext = createContext(false);

export function SearchListItem({
  option,
  actionMode = 'goto',
  selectedTabIds = [],
  onAction,
}: {
  option: SearchListItemProps;
  actionMode?: ActionMode;
  selectedTabIds?: string[];
  onAction?: ActionCallbackFn;
}) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  const selected = useMemo(() => {
    return selectedTabIds.includes(option.tabId);
  }, [selectedTabIds, option.tabId]);

  const inSearchModal = useContext(SearchModalContext);
  const openSaved = useOpenSavedTabs();
  const open = async (mode?: OpenMode) => {
    const result = await openSaved([tabTarget(option, { active: true })], mode);
    if (result.processedIds.length) onAction?.('open', option);
  };
  return (
    <StyledListItem
      className="search-list-item"
      // onClick={() => onAction?.('tab', option)}
    >
      {actionMode === 'select' && (
        <div className="checkbox-wrapper">
          <Checkbox checked={selected}></Checkbox>
        </div>
      )}
      <div className="item-content-box">
        <div className="item-content">
          <div
            className="tag-name"
            title={option.tagName}
            // onClick={() => onAction?.('tag', option)}
          >
            <TagOutlined />
            {/* {option.tagName} */}
            <span className="text">
              {option.static ? $fmt('home.stagingArea') : option.tagName}
            </span>
          </div>
          <div className="divider">{'>'}</div>
          <div
            className="group-name"
            title={option.groupName}
            // onClick={() => onAction?.('tabGroup', option)}
          >
            <ProductOutlined />
            <span className="text">{option.groupName}</span>
          </div>
          <div className="divider">{'>'}</div>
          <div
            className="tab-title"
            title={option.title}
            // onClick={() => onAction?.('tab', option)}
          >
            <span className="text">{option.title}</span>
            {!inSearchModal && (
              <StyledActionIconBtn
                as="a"
                className="icon-open"
                title={$fmt('common.open')}
                $hoverColor={token.colorPrimary}
                href={option.url}
                target="_blank"
                onClick={e => {
                  e.stopPropagation();
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
                    onAction?.('open', option);
                  else {
                    e.preventDefault();
                    open();
                  }
                }}
              >
                <ExportOutlined />
              </StyledActionIconBtn>
            )}
            <OpenModeMenu onOpen={open}>
              {inSearchModal && (
                <StyledActionIconBtn
                  className="icon-open"
                  title={$fmt('common.open')}
                  $hoverColor={token.colorPrimary}
                >
                  <ExportOutlined />
                </StyledActionIconBtn>
              )}
            </OpenModeMenu>
          </div>
        </div>
        <div className="tab-url" title={option.url}>
          {option.url}
        </div>
      </div>
    </StyledListItem>
  );
}

export function useSearchAction({
  list,
  actionMode,
  onAction,
}: {
  list?: TagItem[];
  actionMode?: ActionMode;
  onAction?: ActionCallbackFn;
}) {
  const [tagList, setTagList] = useState<TagItem[]>([]);
  const [value, setValue] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [selectedItems, setSelectedItems] = useState<SearchListItemProps[]>([]);

  const selectedTabIds = useMemo(() => {
    return selectedItems.map(v => v.tabId);
  }, [selectedItems]);

  const handleSelectChange = useCallback(
    (option: SearchListItemProps) => {
      const index = selectedItems.findIndex(v => v.tabId === option.tabId);
      if (index >= 0) {
        setSelectedItems(selectedItems.filter(item => item.tabId !== option.tabId));
      } else {
        setSelectedItems([...selectedItems, option]);
      }
    },
    [selectedItems],
  );

  const handleAction: ActionCallbackFn = useCallback(
    (type, option) => {
      if (type === 'select') {
        option && handleSelectChange(option);
        return;
      }
      onAction?.(type, option);
    },
    [handleSelectChange, onAction],
  );

  const filterList = useMemo(() => {
    const result: SearchListItemProps[] = [];
    for (const tag of tagList) {
      for (const group of tag?.groupList || []) {
        for (const tab of group?.tabList || []) {
          if (
            !searchText ||
            tab?.title?.toLowerCase().includes(searchText) ||
            tab?.url?.toLowerCase().includes(searchText)
          ) {
            result.push(toSearchListItem(tag, group, tab));
          }
        }
      }
    }
    return result;
  }, [tagList, searchText]);

  const options = useMemo(() => {
    return filterList.map(item => ({
      ...item,
      value: item.tabId,
      label: (
        <SearchListItem
          option={item}
          selectedTabIds={selectedTabIds}
          actionMode={actionMode}
          onAction={handleAction}
        />
      ),
    }));
  }, [filterList, selectedTabIds, actionMode, handleAction]);

  const debounceSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchText(value?.trim()?.toLowerCase() || '');
      }, 600),
    [],
  );

  const handleSearch = useCallback(
    (value: string) => {
      debounceSearch(value);
    },
    [debounceSearch],
  );

  const onChange = useCallback(
    (value: string, option?: SearchListItemProps | SearchListItemProps[]) => {
      const _option = Array.isArray(option) ? option[0] : option;

      if (actionMode === 'select') {
        handleAction('select', _option);
      } else {
        handleAction('tab', _option);
      }
      setValue(value || '');
      // setSearchValue(value);
    },
    [actionMode, handleAction],
  );
  const onSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSearch(value);
    },
    [handleSearch],
  );

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target?.value);
      handleSearch?.(e.target?.value);
    },
    [handleSearch],
  );

  useEffect(() => {
    return () => debounceSearch.cancel();
  }, [debounceSearch]);

  const updateTagList = useCallback((nextTagList: TagItem[]) => {
    setTagList(nextTagList);
    setSelectedItems(items => {
      if (!items.length) return items;
      return items.flatMap(item => {
        const tag = nextTagList.find(tag => tag.tagId === item.tagId);
        const group = tag?.groupList?.find(group => group.groupId === item.groupId);
        const tab = group?.tabList?.find(tab => tab.tabId === item.tabId);
        return tag && group && tab ? [toSearchListItem(tag, group, tab)] : [];
      });
    });
  }, []);

  const refreshData = useCallback(async () => {
    updateTagList(await tabListUtils.getTagList());
  }, [updateTagList]);

  const initData = useCallback(async () => {
    if (list?.length) {
      updateTagList(list);
    } else {
      await refreshData();
    }
  }, [list, refreshData, updateTagList]);

  useEffect(() => {
    initData();
  }, [initData]);

  return {
    options,
    value,
    searchValue,
    selectedItems,
    setSelectedItems,
    onSearch,
    onChange,
    onSearchTextChange,
    refreshData,
  };
}

/* 搜索模块 */
export type VirtualListItemprops = SearchListItemProps & {
  value: string;
  label: React.ReactNode;
};

const StyledTabsSearchList = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  .virtual-list-box {
    flex: 1;
    margin-top: 12px;
  }
  .rc-virtual-list {
    padding-right: 16px;
    .list-item {
      margin-bottom: 8px;
    }
  }
`;

export function GlobalSearchList({
  tagList,
  inputWidth = 240,
  listHeight = 500,
  onAction,
}: {
  tagList?: TagItem[];
  inputWidth?: number | string;
  listHeight?: number;
  onAction?: ActionCallbackFn;
}) {
  const { $fmt } = useIntlUtls();
  const inputRef = useRef<InputRef>(null);
  const virtualListBoxRef = useRef<HTMLDivElement>(null);

  const { options, onSearch, onSearchTextChange } = useSearchAction({
    list: tagList,
    onAction,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <StyledTabsSearchList>
      <Input.Search
        ref={inputRef}
        style={{ width: inputWidth, marginBottom: 8 }}
        placeholder={$fmt('home.searchTabAndUrl')}
        allowClear
        onChange={onSearchTextChange}
        onSearch={onSearch}
      />
      <div className="virtual-list-box" ref={virtualListBoxRef}>
        <VirtualList
          data={options || []}
          height={listHeight}
          itemHeight={50}
          itemKey="value"
        >
          {(item: VirtualListItemprops) => <div className="list-item">{item.label}</div>}
        </VirtualList>
      </div>
    </StyledTabsSearchList>
  );
}

/* 搜索模块-select */
const StyledSearchList = styled.div`
  position: relative;
  width: 100%;
`;
const StyledBatchActionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 0 12px;
  box-sizing: border-box;
  gap: 24px;
`;

export interface GlobalSearchBoxHandle {
  focus: () => void;
  refreshData: () => void;
  moveToOpen: boolean;
}

export const GlobalSearchBox = forwardRef(
  (
    {
      tagList,
      inputWidth = 240,
      listWidth = 600,
      listHeight = 500,
      defaultOpen = true,
      open,
      placement = 'bottomLeft',
      onAction,
      onBatchAction,
      onDestinationCreated,
    }: {
      tagList?: TagItem[];
      inputWidth?: number | string;
      listWidth?: number | boolean;
      listHeight?: number;
      defaultOpen?: boolean;
      placement?: SelectProps['placement'];
      open?: boolean;
      onAction?: ActionCallbackFn;
      onBatchAction?: BatchActionCallbackFn;
      onDestinationCreated?: () => void;
    },
    ref,
  ) => {
    const { $fmt } = useIntlUtls();
    const openSaved = useOpenSavedTabs();
    const inSearchModal = useContext(SearchModalContext);
    const selectRef = useRef<RefSelectProps>(null);
    const searchListRef = useRef<HTMLDivElement>(null);
    const [selectSwitch, setSelectSwitch] = useState(false);
    // 批量移动到标签组弹窗
    const [moveToTabs, setMoveToTabs] = useState<SearchListItemProps[] | null>(null);

    const {
      options,
      searchValue,
      selectedItems,
      setSelectedItems,
      onSearch,
      onChange,
      refreshData,
    } = useSearchAction({
      list: tagList,
      actionMode: selectSwitch ? 'select' : 'goto',
      onAction,
    });

    const handleBatchAction = useCallback(
      async (batchActionType: BatchActionType, mode?: OpenMode) => {
        if (batchActionType === 'remove') {
          const groupByList = groupBy(selectedItems, 'groupId');
          for (const [groupId, items] of Object.entries(groupByList)) {
            if (!items[0]?.isLocked) {
              await tabListUtils.removeTabs(
                groupId,
                items.map(item => pick(item, ['tabId', 'title', 'url'])),
              );
            }
          }
          setSelectedItems([]);
          await refreshData();
        } else if (batchActionType === 'open') {
          const settings = await settingsUtils.getSettings();
          const autoDelete = settings?.[GLOBAL_SEARCH_DELETE_AFTER_OPEN];
          const discard = settings?.[DISCARD_WHEN_OPEN_TABS];
          const openTabsOrder = settings?.[OPENING_TABS_ORDER];
          const groupByList = groupBy(selectedItems, 'groupId');
          const targets = Object.values(groupByList).flatMap(items =>
            (openTabsOrder === 'reverse' ? [...items].reverse() : items).map(item =>
              tabTarget(item, { discard }),
            ),
          );
          const result = await openSaved(targets, mode, true);
          const opened = new Set(result.processedIds);
          if (autoDelete && opened.size) {
            for (const [groupId, items] of Object.entries(groupByList)) {
              const removable = items.filter(
                item => !item.isLocked && opened.has(item.tabId),
              );
              if (removable.length)
                await tabListUtils.removeTabs(groupId, removable, { skipLocked: true });
            }
            await refreshData();
            setSelectedItems(items => items.filter(item => !opened.has(item.tabId)));
          }
          if (result.failed) return;
        }

        onBatchAction?.(batchActionType);
      },
      [selectedItems, setSelectedItems, refreshData, onBatchAction, openSaved],
    );

    // 可移动的标签页（锁定分类、锁定标签组中的标签页不参与）
    const movableItems = useMemo(
      () => selectedItems.filter(item => !item.isLocked),
      [selectedItems],
    );

    const handleOpenMoveTo = useCallback(() => {
      if (!movableItems.length) return;
      setMoveToTabs(movableItems);
    }, [movableItems]);

    const handleMoveToProcessed = useCallback(
      (ids: string[]) => {
        const processedIds = new Set(ids);
        setSelectedItems(items => items.filter(item => !processedIds.has(item.tabId)));
      },
      [setSelectedItems],
    );

    const handleMoveToOk = useCallback(() => {
      setMoveToTabs(null);
      refreshData();
      onBatchAction?.('moveTo');
    }, [refreshData, onBatchAction]);

    useImperativeHandle(ref, () => ({
      moveToOpen: !!moveToTabs,
      focus: () => {
        selectRef.current?.focus();
      },
      refreshData: () => {
        refreshData();
      },
    }));

    useEffect(() => {
      if (moveToTabs) return;
      const timer = setTimeout(() => {
        selectRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }, [moveToTabs]);

    return (
      <>
        <StyledBatchActionHeader>
          <Switch
            checked={selectSwitch}
            checkedChildren={$fmt('common.multiSelection')}
            unCheckedChildren={$fmt('common.multiSelection')}
            onChange={setSelectSwitch}
          ></Switch>
          {selectSwitch && (
            <>
              <span
                className="selected-count-text"
                style={{ color: ENUM_COLORS.volcano }}
              >
                {$fmt({
                  id: 'common.selectedTabCount',
                  values: { count: selectedItems.length || 0 },
                })}
              </span>
              {selectedItems.length > 0 && (
                <Space>
                  <ActionIconBtn
                    className="action-btn btn-remove"
                    label={$fmt('common.remove')}
                    btnStyle="icon"
                    size={16}
                    hoverColor={ENUM_COLORS.red}
                    onClick={() => handleBatchAction('remove')}
                  >
                    <DeleteOutlined />
                  </ActionIconBtn>
                  {!inSearchModal && (
                    <ActionIconBtn
                      className="action-btn btn-open"
                      label={$fmt('common.open')}
                      btnStyle="icon"
                      size={16}
                      onClick={() => handleBatchAction('open')}
                    >
                      <ExportOutlined />
                    </ActionIconBtn>
                  )}
                  <OpenModeMenu onOpen={mode => handleBatchAction('open', mode)}>
                    {inSearchModal && (
                      <ActionIconBtn
                        className="action-btn btn-open"
                        label={$fmt('common.open')}
                        btnStyle="icon"
                        size={16}
                      >
                        <ExportOutlined />
                      </ActionIconBtn>
                    )}
                  </OpenModeMenu>
                  <ActionIconBtn
                    className="action-btn btn-move-to"
                    label={$fmt('common.moveTo')}
                    btnStyle="icon"
                    size={16}
                    disabled={!movableItems.length}
                    onClick={handleOpenMoveTo}
                  >
                    <SendOutlined />
                  </ActionIconBtn>
                </Space>
              )}
            </>
          )}
        </StyledBatchActionHeader>
        <StyledSearchList ref={searchListRef}>
          <Select
            ref={selectRef}
            options={options}
            listHeight={listHeight}
            filterOption={false}
            searchValue={searchValue}
            value={null}
            autoFocus
            showSearch
            defaultOpen={defaultOpen}
            open={open}
            getPopupContainer={() => searchListRef.current || document.body}
            popupMatchSelectWidth={listWidth}
            onChange={onChange}
            onSearch={onSearch}
            placement={placement}
            placeholder={$fmt('home.searchTabAndUrl')}
            style={{ width: inputWidth }}
          ></Select>
        </StyledSearchList>
        {moveToTabs && (
          <MoveToModal
            visible
            moveData={{
              selectedTabs: moveToTabs.map(item => ({
                tabId: item.tabId,
                title: item.title,
                url: item.url,
                groupId: item.groupId,
              })),
            }}
            onOk={handleMoveToOk}
            onProcessed={handleMoveToProcessed}
            onCancel={() => setMoveToTabs(null)}
            onDestinationCreated={onDestinationCreated}
          />
        )}
      </>
    );
  },
);

/* 全局搜索面板 */
const StyledGlobalSearchBox = styled.div<{ height: number }>`
  position: relative;
  width: 100%;
  height: ${props => props.height}px;
`;

const modalStyles = {
  header: {},
  body: {},
  mask: {},
  footer: {},
  content: {
    padding: 12,
  },
};

export const GlobalSearchPanel = forwardRef(
  (
    {
      pageContext = 'optionsPage',
      tagList,
      onAction,
    }: {
      pageContext?: PageContextType;
      tagList?: TagItem[];
      onAction?: ActionCallbackFn;
    },
    ref,
  ) => {
    const { $fmt } = useIntlUtls();
    const contentContext = useContext(ContentGlobalContext);
    const [visible, setVisible] = useState<boolean>(false);
    const searchBoxRef = useRef<GlobalSearchBoxHandle>(null);
    const [listHeight, setListHeight] = useState<number>(window.innerHeight * 0.5);

    const handleAction: ActionCallbackFn = useCallback(
      async (type, option) => {
        setVisible(false);

        const { tagId, groupId, isLocked, tabId, title, url } = option || {};

        if (type === 'open') {
          const settings = await settingsUtils.getSettings();
          if (!isLocked && settings?.[GLOBAL_SEARCH_DELETE_AFTER_OPEN]) {
            await tabListUtils.removeTabs(groupId!, [{ tabId: tabId!, title, url }], {
              skipLocked: true,
            });
            if (pageContext === 'optionsPage') {
              updateAdminPageUrlDebounced();
            } else {
              sendRuntimeMessage({
                msgType: 'reloadAllAdminPage',
                data: {},
                targetPageContexts: ['optionsPage'],
              });
            }
          }

          // 如果是打开标签页，则不再执行后续的 “打开管理后台页面并定位当前标签页” 的操作了
          return;
        }

        onAction?.(type, option);

        setTimeout(() => {
          sendRuntimeMessage({
            msgType: 'openAdminRoutePage',
            data: {
              path: `/home`,
              query: {
                tagId: tagId!,
                groupId: groupId!,
                tabId: tabId!,
              },
            },
            targetPageContexts: ['background'],
          });
        }, 200);
      },
      [onAction],
    );

    const refreshAdminPage = useCallback(() => {
      if (pageContext === 'optionsPage') {
        homeEventEmitter.emit('home:treeDataHook', {
          action: 'init',
          params: [],
        });
      } else {
        sendRuntimeMessage({
          msgType: 'reloadAllAdminPage',
          data: {},
          targetPageContexts: ['optionsPage'],
        });
      }
    }, [pageContext]);

    const handleBatchAction: BatchActionCallbackFn = useCallback(
      type => {
        refreshAdminPage();
        if (type === 'open') {
          setVisible(false);
        }
      },
      [refreshAdminPage],
    );

    const handleClose = useCallback(() => {
      if (searchBoxRef.current?.moveToOpen) return false;
      setVisible(false);
      return true;
    }, []);

    const debounceResize = useMemo(
      () =>
        debounce(() => {
          setListHeight(window.innerHeight * 0.5);
        }, 300),
      [],
    );

    const handleResize = useCallback(() => {
      debounceResize();
    }, [debounceResize]);

    // 按ESC键关闭搜索面板
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && visible && handleClose()) {
          event.stopPropagation(); // 阻止事件冒泡
        }
      },
      [visible, handleClose],
    );

    const messageListener = useCallback(
      async (msg: unknown) => {
        // console.log('browser.runtime.onMessage--globalSearch', msg);
        const { msgType } = (msg || {}) as SendTabMsgEventProps;

        if (msgType === 'action:open-global-search-modal') {
          setVisible(true);
        } else if (msgType === 'action:refresh-global-search-modal') {
          if (visible) {
            searchBoxRef.current?.refreshData();
          }
        }
      },
      [visible],
    );

    const eventEmitterListener = useCallback(async () => {
      setVisible(true);
    }, []);

    useEffect(() => {
      browser.runtime.onMessage.addListener(messageListener);
      return () => {
        browser.runtime.onMessage.removeListener(messageListener);
      };
    }, [messageListener]);

    // 监听按键
    useEffect(() => {
      if (visible) {
        window.addEventListener('keydown', handleKeyDown, true); // 使用 capture 模式
      } else {
        window.removeEventListener('keydown', handleKeyDown, true); // 移除 capture 模式监听器
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true); // 移除 capture 模式监听器
      };
    }, [visible, handleKeyDown]);

    useEffect(() => {
      window.addEventListener('resize', handleResize);
      eventEmitter.on('global:open-global-search-modal', eventEmitterListener);
      return () => {
        window.removeEventListener('resize', handleResize);
        eventEmitter.off('global:open-global-search-modal', eventEmitterListener);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
      },
      close: () => {
        setVisible(false);
      },
    }));

    return (
      <Modal
        title={$fmt('common.globalSearch')}
        className="global-search-modal"
        width="70%"
        destroyOnClose
        maskClosable
        centered
        getContainer={() => contentContext.rootWrapper}
        closeIcon={null}
        footer={null}
        open={visible}
        style={{ maxWidth: '1000px' }}
        styles={modalStyles}
        onCancel={handleClose}
      >
        <StyledGlobalSearchBox className="global-search-panel" height={listHeight + 90}>
          <SearchModalContext.Provider value={true}>
            <GlobalSearchBox
              ref={searchBoxRef}
              tagList={tagList}
              inputWidth="100%"
              listWidth={true}
              listHeight={listHeight || 450}
              open
              onAction={handleAction}
              onBatchAction={handleBatchAction}
              onDestinationCreated={refreshAdminPage}
            ></GlobalSearchBox>
          </SearchModalContext.Provider>
        </StyledGlobalSearchBox>
      </Modal>
    );
  },
);

export default GlobalSearchPanel;
