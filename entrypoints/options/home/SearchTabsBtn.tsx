import { useState, useCallback, useRef, useContext } from 'react';
import { Button, Drawer } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { eventEmitter, useIntlUtls } from '~/entrypoints/common/hooks/global';
import type { TreeDataNodeUnion } from './types';
import { HomeContext } from './hooks/treeData';
import GlobalSearchBox, {
  type ActionCallbackFn,
} from '~/entrypoints/common/components/BaseGlobalSearch';

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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [listHeight, setListHeight] = useState<number>(500);
  const searchListRef = useRef<HTMLDivElement>(null);
  const virtualListBoxRef = useRef<HTMLDivElement>(null);

  const onAction: ActionCallbackFn = useCallback(
    (type, option) => {
      const { tagId, groupId, tabId } = option || {};
      let params: Partial<TreeDataNodeUnion & { tabId: string }> = {};
      if (type === 'open') return;

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

      eventEmitter.emit('home:set-tree-searchValue', {
        value: '',
        callback: () => selectedKeyChange(params),
      });
    },
    [selectedKeyChange]
  );

  const openDrawer = () => {
    setDrawerVisible(true);
    setTimeout(() => {
      setListHeight((searchListRef.current?.offsetHeight || 500) - 60);
      virtualListBoxRef.current?.focus();
    }, 0);
  };

  return (
    <>
      <Drawer
        title={$fmt('home.searchTabAndUrl')}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={700}
      >
        <StyledTabsSearchList ref={searchListRef}>
          <GlobalSearchBox
            ref={virtualListBoxRef}
            tagList={tagList}
            inputWidth="100%"
            listWidth={true}
            listHeight={listHeight}
            open
            onAction={onAction}
          ></GlobalSearchBox>
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
