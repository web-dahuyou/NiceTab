import { useState, useCallback, useRef, useContext } from 'react';
import { Button, Drawer, Input, type InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import VirtualList from 'rc-virtual-list';
import { debounce } from 'lodash-es';
import { pick } from '~/entrypoints/common/utils';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TreeDataNodeUnion } from './types';
import { HomeContext } from './hooks/treeData';
import {
  type SearchListItemProps,
  type ActionCallbackFn,
  SearchListItem,
} from './footer/SearchList';

type VirtualListItemprops = SearchListItemProps & {
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

export default function SearchTabsBtn() {
  const { $fmt } = useIntlUtls();
  const { treeDataHook } = useContext(HomeContext);
  const { tagList, selectedKeyChange } = treeDataHook;
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterList, setFilterList] = useState<SearchListItemProps[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [listHeight, setListHeight] = useState<number>(500);
  const inputRef = useRef<InputRef>(null);
  const virtualListBoxRef = useRef<HTMLDivElement>(null);

  const onAction: ActionCallbackFn = (type, option) => {
    const { tagId, groupId, tabId } = option || {};
    let params: Partial<TreeDataNodeUnion & { tabId: string }> = {};
    if (type === 'tag') {
      params = { type: 'tag', key: tagId };
    } else {
      params = {
        type: 'tabGroup',
        key: groupId,
        parentKey: tagId,
        tabId,
      };
    }

    selectedKeyChange(params, () => {
      eventEmitter.emit('home:set-tree-searchValue', '');
    });
  };

  const options: VirtualListItemprops[] = useMemo(() => {
    return filterList.map((item) => ({
      ...item,
      value: item.tabId,
      label: <SearchListItem option={item} onAction={onAction} />,
    }));
  }, [filterList]);

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
                ...pick(group, ['groupId', 'groupName']),
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

  const handleSearch = debounce((value: string) => {
    const text = value?.trim?.()?.toLowerCase() || '';
    const filterList = getFilterList(text);
    setFilterList(filterList || []);
  }, 600);

  const onSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch?.(e.target?.value);
  };

  const onSearch = (value: string) => {
    handleSearch(value);
  };

  const openDrawer = () => {
    setDrawerVisible(true);
    setTimeout(() => {
      inputRef.current?.focus();
      setListHeight((virtualListBoxRef.current?.offsetHeight || 500) - 30);
    }, 0);
  };

  useEffect(() => {
    const list = getFilterList('');
    setFilterList(list || []);
  }, [tagList]);

  return (
    <>
      <Drawer
        title={$fmt('home.searchTabAndUrl')}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={600}
      >
        <StyledTabsSearchList>
          <Input.Search
            ref={inputRef}
            style={{ marginBottom: 8 }}
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
              {(item: VirtualListItemprops) => (
                <div className="list-item">{item.label}</div>
              )}
            </VirtualList>
          </div>
        </StyledTabsSearchList>
      </Drawer>
      <div
        className="action-icon"
        title={$fmt({
          id: 'home.searchTabAndUrl',
        })}
        onClick={openDrawer}
      >
        <Button icon={<SearchOutlined />}></Button>
      </div>
    </>
  );
}
