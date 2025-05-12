import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  theme,
  Select,
  Input,
  Modal,
  type InputRef,
  type RefSelectProps,
  type SelectProps,
} from 'antd';
import styled from 'styled-components';
import VirtualList from 'rc-virtual-list';
import { TagOutlined, ProductOutlined, ExportOutlined } from '@ant-design/icons';
import { debounce } from 'lodash-es';
import { pick, sendRuntimeMessage } from '~/entrypoints/common/utils';
import { ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import { useIntlUtls, eventEmitter } from '~/entrypoints/common/hooks/global';
import { settingsUtils } from '~/entrypoints/common/storage';
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
import { tabListUtils } from '../storage';

const { GLOBAL_SEARCH_DELETE_AFTER_OPEN } = ENUM_SETTINGS_PROPS;

export type SearchListItemProps = Pick<TagItem, 'tagId' | 'tagName' | 'static'> &
  Pick<GroupItem, 'groupId' | 'groupName' | 'isLocked'> &
  Pick<TabItem, 'tabId' | 'title' | 'url'>;

export type ActionCallbackFn = (
  type: 'tag' | 'tabGroup' | 'tab' | 'open',
  option?: SearchListItemProps
) => void;

export const StyledListItem = styled.div`
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
    color: ${(props) => props.theme.colorTextTertiary || '#999'};
    ${StyledEllipsis};
  }
`;

export function SearchListItem({
  option,
  onAction,
}: {
  option: SearchListItemProps;
  onAction?: ActionCallbackFn;
}) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();

  return (
    <StyledListItem
      className="search-list-item"
      // onClick={() => onAction?.('tab', option)}
    >
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
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('open', option);
            }}
          >
            <ExportOutlined />
          </StyledActionIconBtn>
        </div>
      </div>
      <div className="tab-url" title={option.url}>
        {option.url}
      </div>
    </StyledListItem>
  );
}

export function useSearchAction({
  list,
  onAction,
}: {
  list?: TagItem[];
  onAction?: ActionCallbackFn;
}) {
  const [tagList, setTagList] = useState<TagItem[]>([]);
  const [value, setValue] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterList, setFilterList] = useState<SearchListItemProps[]>([]);

  const options = useMemo(() => {
    return filterList.map((item) => ({
      ...item,
      value: item.tabId,
      label: <SearchListItem option={item} onAction={onAction} />,
    }));
  }, [filterList, onAction]);

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
    [tagList]
  );

  const debounceSearch = useMemo(
    () =>
      debounce((value: string) => {
        const text = value?.trim()?.toLowerCase() || '';
        const filterList = getFilterList(text);
        setFilterList(filterList || []);
      }, 600),
    [getFilterList]
  );

  const handleSearch = useCallback(
    (value: string) => {
      debounceSearch(value);
    },
    [debounceSearch]
  );

  const onChange = useCallback(
    (value: string, option?: SearchListItemProps | SearchListItemProps[]) => {
      onAction?.('tab', Array.isArray(option) ? option[0] : option);
      setValue(value || '');
      // setSearchValue(value);
    },
    [onAction]
  );
  const onSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      handleSearch(value);
    },
    [handleSearch]
  );

  const onSearchTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target?.value);
      handleSearch?.(e.target?.value);
    },
    [handleSearch]
  );

  useEffect(() => {
    const _filterList = getFilterList('');
    setFilterList(_filterList || []);
  }, [getFilterList]);

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
    onSearch,
    onChange,
    onSearchTextChange,
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
    }: {
      tagList?: TagItem[];
      inputWidth?: number | string;
      listWidth?: number | boolean;
      listHeight?: number;
      defaultOpen?: boolean;
      placement?: SelectProps['placement'];
      open?: boolean;
      onAction?: ActionCallbackFn;
    },
    ref
  ) => {
    const { $fmt } = useIntlUtls();
    const selectRef = useRef<RefSelectProps>(null);
    const searchListRef = useRef<HTMLDivElement>(null);

    const { options, searchValue, onSearch, onChange } = useSearchAction({
      list: tagList,
      onAction,
    });

    useImperativeHandle(ref, () => ({
      focus: () => {
        selectRef.current?.focus();
      },
    }));

    useEffect(() => {
      setTimeout(() => {
        selectRef.current?.focus();
      }, 500);
    }, []);

    return (
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
    );
  }
);

/* 全局搜索面板 */
const StyledGlobalSearchBox = styled.div<{ height: number }>`
  position: relative;
  width: 100%;
  height: ${(props) => props.height}px;
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
    ref
  ) => {
    const { $fmt } = useIntlUtls();
    const contentContext = useContext(ContentGlobalContext);
    const [visible, setVisible] = useState<boolean>(false);
    const searchBoxRef = useRef<HTMLDivElement>(null);
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
      [onAction]
    );

    const handleClose = useCallback(() => {
      setVisible(false);
    }, []);

    const debounceResize = useMemo(
      () =>
        debounce(() => {
          setListHeight(window.innerHeight * 0.6);
        }, 300),
      []
    );

    const handleResize = useCallback(() => {
      debounceResize();
    }, [debounceResize]);

    const messageListener = async (msg: unknown) => {
      // console.log('browser.runtime.onMessage--globalSearch', msg);
      const { msgType } = (msg || {}) as SendTabMsgEventProps;

      if (msgType === 'action:open-global-search-modal') {
        setVisible(true);
      }
    };

    const eventEmitterListener = useCallback(async () => {
      setVisible(true);
    }, []);

    useEffect(() => {
      window.addEventListener('resize', handleResize);
      browser.runtime.onMessage.addListener(messageListener);
      eventEmitter.on('global:open-global-search-modal', eventEmitterListener);
      return () => {
        window.removeEventListener('resize', handleResize);
        browser.runtime.onMessage.removeListener(messageListener);
        eventEmitter.off('global:open-global-search-modal', eventEmitterListener);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
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
        <StyledGlobalSearchBox className="global-search-panel" height={listHeight + 50}>
          <GlobalSearchBox
            ref={searchBoxRef}
            tagList={tagList}
            inputWidth="100%"
            listWidth={true}
            listHeight={listHeight || 450}
            open
            onAction={handleAction}
          ></GlobalSearchBox>
        </StyledGlobalSearchBox>
      </Modal>
    );
  }
);

export default GlobalSearchPanel;
