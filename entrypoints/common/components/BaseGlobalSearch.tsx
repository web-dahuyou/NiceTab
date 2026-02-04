import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
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
} from '@ant-design/icons';
import { debounce, groupBy } from 'lodash-es';
import { pick, sendRuntimeMessage } from '~/entrypoints/common/utils';
import { ENUM_COLORS, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls, eventEmitter } from '~/entrypoints/common/hooks/global';
import { settingsUtils } from '~/entrypoints/common/storage';
import { openNewTab, updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';
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
import { tabListUtils } from '../storage';
import ActionIconBtn from './ActionIconBtn.tsx';
import { eventEmitter as homeEventEmitter } from '~/entrypoints/options/home/hooks/homeCustomEvent';

const { GLOBAL_SEARCH_DELETE_AFTER_OPEN, DISCARD_WHEN_OPEN_TABS, OPENING_TABS_ORDER } =
  ENUM_SETTINGS_PROPS;

export type SearchListItemProps = Pick<TagItem, 'tagId' | 'tagName' | 'static'> &
  Pick<GroupItem, 'groupId' | 'groupName' | 'isLocked'> &
  Pick<TabItem, 'tabId' | 'title' | 'url'>;

export type ActionMode = 'goto' | 'select';
export type BatchActionType = 'remove' | 'open';

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

  const handleTabOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onAction?.('open', option);
    },
    [onAction, option],
  );

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
            <StyledActionIconBtn
              as="a"
              className="icon-open"
              title={$fmt('common.open')}
              $hoverColor={token.colorPrimary}
              href={option.url}
              target="_blank"
              onClick={handleTabOpen}
            >
              <ExportOutlined />
            </StyledActionIconBtn>
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
  const [filterList, setFilterList] = useState<SearchListItemProps[]>([]);
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
  }, [filterList, selectedTabIds, actionMode, onAction]);

  const getFilterList = useCallback(
    (searchText: string) => {
      const result: SearchListItemProps[] = [];
      for (const tag of tagList) {
        for (const group of tag?.groupList || []) {
          for (const tab of group?.tabList || []) {
            if (
              !searchText ||
              tab?.title?.toLowerCase().includes(searchText) ||
              tab?.url?.toLowerCase().includes(searchText)
            ) {
              result.push({
                ...pick(tag, ['tagId', 'tagName', 'static']),
                ...pick(group, ['groupId', 'groupName', 'isLocked']),
                ...pick(tab, ['tabId', 'title', 'url']),
              });
            }
          }
        }
      }
      return result;
    },
    [tagList],
  );

  const debounceSearch = useMemo(
    () =>
      debounce((value: string) => {
        const text = value?.trim()?.toLowerCase() || '';
        const filterList = getFilterList(text);
        setFilterList(filterList || []);
      }, 600),
    [getFilterList],
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
    const _filterList = getFilterList('');
    setFilterList(_filterList || []);
  }, [getFilterList]);

  const refreshData = useCallback(async () => {
    const _list = await tabListUtils.getTagList();
    setTagList(_list || []);
    setSelectedItems([]);
  }, []);

  const initData = useCallback(async () => {
    const _list = list?.length ? list : await tabListUtils.getTagList();
    setTagList(_list || []);
  }, [list]);

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
    },
    ref,
  ) => {
    const { $fmt } = useIntlUtls();
    const selectRef = useRef<RefSelectProps>(null);
    const searchListRef = useRef<HTMLDivElement>(null);
    const [selectSwitch, setSelectSwitch] = useState(false);

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
      async (batchActionType: BatchActionType) => {
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
          for (const [groupId, items] of Object.entries(groupByList)) {
            const _items = openTabsOrder === 'reverse' ? [...items].reverse() : items;
            _items.forEach(item => {
              item.url && openNewTab(item.url, { discard });
            });

            if (autoDelete && !items[0]?.isLocked) {
              await tabListUtils.removeTabs(
                groupId,
                items.map(item => pick(item, ['tabId', 'title', 'url'])),
              );
              setSelectedItems([]);
              await refreshData();
            }
          }
        }

        onBatchAction?.(batchActionType);
      },
      [selectedItems, setSelectedItems, refreshData, onBatchAction],
    );

    useImperativeHandle(ref, () => ({
      focus: () => {
        selectRef.current?.focus();
      },
      refreshData: () => {
        refreshData();
      },
    }));

    useEffect(() => {
      setTimeout(() => {
        selectRef.current?.focus();
      }, 500);
    }, []);

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
                    hoverColor={ENUM_COLORS.red}
                    onClick={() => handleBatchAction('remove')}
                  >
                    <DeleteOutlined />
                  </ActionIconBtn>
                  <ActionIconBtn
                    className="action-btn btn-open"
                    label={$fmt('common.open')}
                    btnStyle="icon"
                    onClick={() => handleBatchAction('open')}
                  >
                    <ExportOutlined />
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
            await tabListUtils.removeTabs(groupId!, [{ tabId: tabId!, title, url }]);
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

    const handleBatchAction: BatchActionCallbackFn = useCallback(
      async type => {
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

        if (type === 'open') {
          setVisible(false);
        }
      },
      [pageContext],
    );

    const handleClose = useCallback(() => {
      setVisible(false);
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
        if (event.key === 'Escape' && visible) {
          event.stopPropagation(); // 阻止事件冒泡
          handleClose();
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
          <GlobalSearchBox
            ref={searchBoxRef}
            tagList={tagList}
            inputWidth="100%"
            listWidth={true}
            listHeight={listHeight || 450}
            open
            onAction={handleAction}
            onBatchAction={handleBatchAction}
          ></GlobalSearchBox>
        </StyledGlobalSearchBox>
      </Modal>
    );
  },
);

export default GlobalSearchPanel;
