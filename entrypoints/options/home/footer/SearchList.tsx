import { useMemo, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { theme, Space, Select } from 'antd';
import type { RefSelectProps } from 'antd';
import { TagOutlined, ProductOutlined, ExportOutlined } from '@ant-design/icons';
import { debounce } from 'lodash-es';
import { pick } from '~/entrypoints/common/utils';
import { openNewTab } from '~/entrypoints/common/tabs';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import {
  StyledEllipsis,
  StyledActionIconBtn,
} from '@/entrypoints/common/style/Common.styled';
import type { TagItem, GroupItem, TabItem } from '@/entrypoints/types';
import type { TreeDataNodeUnion } from '../types';
import { HomeContext } from '../hooks/treeData';

type SearchListItemProps = Pick<TagItem, 'tagId' | 'tagName' | 'static'> &
  Pick<GroupItem, 'groupId' | 'groupName'> &
  Pick<TabItem, 'tabId' | 'title' | 'url'>;

type ActionCallbackFn = (
  type: 'tag' | 'tabGroup' | 'tab',
  option: SearchListItemProps
) => void;

const StyledSearchList = styled.div`
  position: relative;
`;

const StyledListItem = styled.div`
  .item-content {
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .tag-name,
  .group-name {
    flex: 0 0 auto;
    cursor: pointer;
    // &:hover {
    //   background: ${(props) => props.theme.colorInfoHover || '#e6f4ff'};
    // }
  }
  .divider {
    flex: 0 0 auto;
    margin: 0 8px;
  }
  .tab-title {
    flex: 1;
    display: flex;
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

function SearchListItem({
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
      onClick={() => onAction?.('tab', option)}
    >
      <div className="item-content">
        <div
          className="tag-name"
          title={option.tagName}
          // onClick={() => onAction?.('tag', option)}
        >
          <Space>
            <TagOutlined />
            {/* {option.tagName} */}
            {option.static ? $fmt('home.stagingArea') : option.tagName}
          </Space>
        </div>
        <div className="divider">{'>'}</div>
        <div
          className="group-name"
          title={option.groupName}
          // onClick={() => onAction?.('tabGroup', option)}
        >
          <Space>
            <ProductOutlined />
            {option.groupName}
          </Space>
        </div>
        <div className="divider">{'>'}</div>
        <div
          className="tab-title"
          title={option.title}
          // onClick={() => onAction?.('tab', option)}
        >
          <span className="text">{option.title}</span>
          <StyledActionIconBtn
            className="icon-open"
            title={$fmt('common.open')}
            $hoverColor={token.colorPrimary}
            onClick={(e) => {
              e.stopPropagation();
              openNewTab(option.url, { active: true, openToNext: true });
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

export default forwardRef((_, ref) => {
  const { $fmt } = useIntlUtls();
  const { treeDataHook } = useContext(HomeContext);
  const { tagList, selectedKeyChange } = treeDataHook;
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterList, setFilterList] = useState<SearchListItemProps[]>([]);
  const selectRef = useRef<RefSelectProps>(null);
  const searchListRef = useRef<HTMLDivElement>(null);

  const onAction: ActionCallbackFn = (type, option) => {
    const { tagId, groupId } = option;
    let params: Partial<TreeDataNodeUnion> = {};
    if (type === 'tag') {
      params = { type: 'tag', key: tagId };
    } else {
      params = {
        type: 'tabGroup',
        key: groupId,
        parentKey: tagId,
      };
    }
    setTimeout(() => {
      selectedKeyChange(params, () => {
        eventEmitter.emit('home:set-tree-searchValue', '');
      });
    }, 400);
  };

  const options = useMemo(() => {
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

  const onChange = (
    value: string,
    option: SearchListItemProps | SearchListItemProps[]
  ) => {
    onAction('tab', Array.isArray(option) ? option[0] : option);
    setSearchValue(value || '');
  };
  const onSearch = (value: string) => {
    setSearchValue(value);
    handleSearch(value);
  };

  useEffect(() => {
    const list = getFilterList('');
    setFilterList(list || []);
  }, [tagList]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      selectRef.current?.focus();
    }
  }))

  return (
    <StyledSearchList ref={searchListRef}>
      <Select
        ref={selectRef}
        options={options}
        listHeight={500}
        filterOption={false}
        searchValue={searchValue}
        value={null}
        showSearch
        getPopupContainer={() => searchListRef.current || document.body}
        popupMatchSelectWidth={600}
        onChange={onChange}
        onSearch={onSearch}
        placement="topRight"
        placeholder={$fmt('home.searchTabAndUrl')}
        style={{ width: 240 }}
      ></Select>
    </StyledSearchList>
  );
});
