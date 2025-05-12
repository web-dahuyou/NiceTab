import { useState, useEffect, useCallback, memo } from 'react';
import { theme, Space, Button, Modal, Empty, Alert } from 'antd';
import { Virtuoso } from 'react-virtuoso';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import useUrlParams from '~/entrypoints/common/hooks/urlParams';
import { TagItem, GroupItem, TabItem } from '~/entrypoints/types';
import { recycleUtils, initRecycleStorageListener } from '~/entrypoints/common/storage';
import { updateAdminPageUrlDebounced } from '~/entrypoints/common/tabs';
import { StyledEmptyBox, StyledRecycleBinWrapper } from './index.styled';
import { StickyBox } from '~/entrypoints/common/components/StickyBox';
import TagNodeMarkup from './TagNode';
import TabGroup from '../home/TabGroupRecycle';

export default function RecycleBin() {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const [tagList, setTagList] = useState<TagItem[]>([]);
  const [recoverModalVisible, setRecoverModalVisible] = useState<boolean>(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);

  // 获取回收站数据
  const getRecycleBinData = useCallback(async () => {
    const recycleList = await recycleUtils.getTagList();
    setTagList(recycleList || []);
  }, []);

  // 删除标签组
  const handleTabGroupRemove = useCallback(
    async (tag: TagItem, group: GroupItem) => {
      if (!tag?.tagId || !group?.groupId) return;
      await recycleUtils.removeTabGroup(tag.tagId, group.groupId);
      getRecycleBinData();
    },
    [getRecycleBinData]
  );

  // 恢复标签组 (从回收站恢复到列表页)
  const handleTabGroupRecover = useCallback(
    async (tag: TagItem, group: GroupItem) => {
      await recycleUtils.recoverTabGroups(tag, [group]);
      getRecycleBinData();
    },
    [getRecycleBinData]
  );
  // 删除标签页
  const handleTabItemRemove = useCallback(
    async (groupId: React.Key, tabs: TabItem[]) => {
      await recycleUtils.removeTabs(groupId, tabs, true);
      getRecycleBinData();
    },
    [getRecycleBinData]
  );
  // 修改标签页
  const handleTabItemChange = useCallback(
    async (tag: TagItem, group: GroupItem, tabData: TabItem) => {
      await recycleUtils.updateTab({
        tagId: tag.tagId,
        groupId: group.groupId,
        data: tabData,
      });
      getRecycleBinData();
    },
    [getRecycleBinData]
  );

  // 还原所有
  const handleRecoverConfirm = useCallback(async () => {
    await recycleUtils.recoverAll();
    setRecoverModalVisible(false);
    getRecycleBinData();
  }, []);
  // 清空回收站
  const handleClearConfirm = useCallback(async () => {
    await recycleUtils.setTagList([]);
    setConfirmModalVisible(false);
    getRecycleBinData();
  }, []);

  const { urlParams } = useUrlParams();

  useEffect(() => {
    getRecycleBinData();
  }, [urlParams]);

  useEffect(() => {
    getRecycleBinData();
    return initRecycleStorageListener(async (tabList) => {
      const currWindow = await browser.windows.getCurrent();
      if (!currWindow.focused) {
        updateAdminPageUrlDebounced();
      }
    });
  }, []);

  const [totalGroupList, setTotalGroupList] = useState<GroupItem[]>([]);
  const [index2Tag, setIndex2Tag] = useState<TagItem[]>([]);

  useEffect(() => {
    const _totalGroupList: GroupItem[] = [];
    const _index2Tag: TagItem[] = [];
    for (let tag of tagList) {
      for (let group of tag?.groupList || []) {
        _totalGroupList.push(group || {});
        _index2Tag.push(tag || {});
      }
    }
    setTotalGroupList(_totalGroupList);
    setIndex2Tag(_index2Tag);
  }, [tagList]);

  const ListItemMarkup = memo(({ index }: { index: number }) => {
    const tag = index2Tag[index] || {};
    const group = totalGroupList[index] || {};

    return (
      <>
        <TagNodeMarkup
          tag={tag}
          onRemove={getRecycleBinData}
          onRecover={getRecycleBinData}
        />
        <TabGroup
          key={group.groupId}
          {...group}
          canDrag={false}
          canDrop={false}
          allowGroupActions={['remove', 'recover']}
          allowTabActions={['open', 'remove', 'recover']}
          onRemove={() => handleTabGroupRemove(tag, group)}
          onRecover={() => handleTabGroupRecover(tag, group)}
          onTabChange={(tabItem: TabItem) => handleTabItemChange(tag, group, tabItem)}
          onTabRemove={handleTabItemRemove}
        />
      </>
    );
  });

  return (
    <StyledRecycleBinWrapper className="recycle-bin-wrapper">
      <StickyBox topGap={60} fullWidth bgColor={token.colorBgContainer}>
        <Space className="header-action-btns">
          <Button
            type="primary"
            disabled={!totalGroupList?.length}
            onClick={() => setRecoverModalVisible(true)}
          >
            {$fmt('home.recoverAll')}
          </Button>
          <Button
            type="primary"
            disabled={!totalGroupList?.length}
            onClick={() => setConfirmModalVisible(true)}
          >
            {$fmt('home.clearAll')}
          </Button>
          <Alert
            className="warning-tip"
            type="warning"
            showIcon
            message={$fmt('recycleBin.tip.autoClear')}
          />
        </Space>
      </StickyBox>

      {totalGroupList?.length > 0 ? (
        <Virtuoso
          useWindowScroll
          overscan={12}
          increaseViewportBy={{ top: 1000, bottom: 1000 }}
          data={totalGroupList}
          itemContent={(index) => <ListItemMarkup index={index} />}
        />
      ) : (
        <StyledEmptyBox className="no-data">
          <Empty description={$fmt('home.emptyTip')}></Empty>
        </StyledEmptyBox>
      )}

      {/* 清空全部提示 */}
      <Modal
        title={$fmt('home.recoverTitle')}
        width={400}
        centered
        open={recoverModalVisible}
        onOk={handleRecoverConfirm}
        onCancel={() => setRecoverModalVisible(false)}
      >
        <div>{$fmt('home.recoverAllDesc')}</div>
      </Modal>
      {/* 清空全部提示 */}
      <Modal
        title={$fmt('home.clearTitle')}
        width={400}
        centered
        open={confirmModalVisible}
        onOk={handleClearConfirm}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <div>{$fmt('home.clearDesc')}</div>
      </Modal>
    </StyledRecycleBinWrapper>
  );
}
