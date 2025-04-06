import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { theme, Skeleton, Modal, Space, Divider, Checkbox } from 'antd';
import type { CheckboxProps } from 'antd';
import { LockOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';

import EditInput from '../components/EditInput';
import TabListItem from './TabListItem';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabActions,
  StyledTabListWrapper,
} from './TabGroup.styled';

type TabGroupProps = GroupItem & {
  canDrag?: boolean;
  canDrop?: boolean;
  allowGroupActions?: string[];
  allowTabActions?: string[];
  selected?: boolean;
  onRemove?: () => void;
  onRecover?: () => void;
  onTabChange?: (data: TabItem) => void;
  onTabRemove?: (groupId: string, tabs: TabItem[]) => void;
};

const defaultGroupActions = ['remove', 'recover'];
const defaultTabActions = ['remove'];

function TabGroup({
  groupId,
  groupName,
  createTime,
  tabList,
  isLocked,
  isStarred,
  selected,
  allowGroupActions = defaultGroupActions,
  allowTabActions = defaultTabActions,
  onRemove,
  onRecover,
  onTabChange,
  onTabRemove,
}: TabGroupProps) {
  const { token } = theme.useToken();
  const { $fmt } = useIntlUtls();
  const groupRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);

  const group = useMemo(
    () => ({ groupId, groupName, createTime, isLocked, isStarred, selected }),
    [groupId, groupName, createTime, isLocked, isStarred, selected]
  );

  const tabListHeight = useMemo(() => {
    return tabList.length * 24 || 24;
  }, [tabList]);

  const removeDesc = useMemo(() => {
    const typeName = $fmt(`home.tabGroup`);
    return $fmt({
      id: 'home.removeDesc',
      values: {
        type: `${typeName}${` <strong>[${groupName}]</strong>`}`,
      },
    });
  }, [$fmt]);

  // 已选择的tabItem数组
  const selectedTabs = useMemo(() => {
    return tabList.filter((tab) => selectedTabIds.includes(tab.tabId));
  }, [selectedTabIds]);
  // 是否全选
  const isAllChecked = useMemo(() => {
    return tabList.length > 0 && selectedTabIds.length === tabList.length;
  }, [tabList, selectedTabIds]);

  // 全选框 indeterminate 状态
  const checkAllIndeterminate = useMemo(() => {
    return selectedTabIds.length > 0 && selectedTabIds.length < tabList.length;
  }, [tabList, selectedTabIds]);
  // 全选
  const handleSelectAll: CheckboxProps['onChange'] = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedTabIds(tabList.map((tab) => tab.tabId));
    } else {
      setSelectedTabIds([]);
    }
  };

  const handleTabGroupRemove = () => {
    setModalVisible(false);
    onRemove?.();
  };

  const handleTabGroupRecover = () => {
    setRecoverModalVisible(false);
    onRecover?.();
  };

  const handleTabRemove = useCallback((tabs: TabItem[]) => {
    setSelectedTabIds((selectedTabIds) =>
      selectedTabIds.filter((id) => !tabs.some((tab) => tab.tabId === id))
    );
    if (onTabRemove) {
      // 给回收站使用
      onTabRemove(group.groupId, tabs);
      return;
    }
  }, []);

  useEffect(() => {
    let timer = null;
    if (selected || tabList.length < 120) {
      setRendering(false);
      return;
    }

    timer = setTimeout(() => {
      setRendering(false);
    }, 10);
    return () => clearTimeout(timer);
  }, [selected, tabList.length]);
  // useEffect(() => {
  //   setRendering(false);
  // }, []);

  if (rendering) return <Skeleton />;

  return (
    <>
      <StyledGroupWrapper
        className="tab-group-wrapper"
        data-gid={groupId}
        $bgColor={selected ? token.colorPrimaryBg : token.colorBgContainer}
        ref={groupRef}
      >
        {/* 标签组 header 展示、操作区域 */}
        <StyledGroupHeader className="group-header select-none">
          {allowGroupActions.includes('remove') && !isLocked && (
            <StyledActionIconBtn
              className="btn-remove"
              $size="16"
              title={$fmt('common.remove')}
              $hoverColor={ENUM_COLORS.red}
              onClick={() => setModalVisible(true)}
            >
              <CloseOutlined />
            </StyledActionIconBtn>
          )}

          <div className="group-status-wrapper">
            {isLocked && (
              <LockOutlined
                style={{ fontSize: '22px', color: token.colorPrimaryHover }}
              />
            )}
            {isStarred && (
              <StarOutlined
                style={{ fontSize: '22px', color: token.colorPrimaryHover }}
              />
            )}
          </div>

          <div className="group-name-wrapper">
            <EditInput
              value={groupName || UNNAMED_GROUP}
              disabled={!allowGroupActions.includes('rename')}
              maxWidth={240}
              fontSize={20}
              iconSize={16}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-info">
              <span className="tab-count" style={{ color: ENUM_COLORS.volcano }}>
                {$fmt({
                  id: 'home.tab.count',
                  values: { count: tabList?.length || 0 },
                })}
              </span>
              <span className="group-create-time">{createTime}</span>
            </div>
            <Space
              className="group-action-btns"
              size={0}
              split={
                <Divider type="vertical" style={{ background: token.colorBorder }} />
              }
            >
              {allowGroupActions.includes('remove') && !isLocked && (
                <span className="action-btn" onClick={() => setModalVisible(true)}>
                  {$fmt('home.tabGroup.remove')}
                </span>
              )}
              {allowGroupActions.includes('recover') && (
                <span className="action-btn" onClick={() => setRecoverModalVisible(true)}>
                  {$fmt('home.tabGroup.recover')}
                </span>
              )}
            </Space>
          </div>
        </StyledGroupHeader>

        {/* tab 选择、操作区域 */}
        {tabList?.length > 0 && !isLocked && (
          <StyledTabActions>
            <div className="checkall-wrapper">
              <Checkbox
                checked={isAllChecked}
                indeterminate={checkAllIndeterminate}
                onChange={handleSelectAll}
              ></Checkbox>
              <span
                className="selected-count-text"
                style={{ color: ENUM_COLORS.volcano }}
              >
                {`${selectedTabIds.length} / ${tabList?.length}`}
              </span>
            </div>
            {selectedTabIds.length > 0 && (
              <Space
                className="tab-action-btns select-none"
                size={0}
                split={
                  <Divider type="vertical" style={{ background: token.colorBorder }} />
                }
              >
                {allowTabActions.includes('remove') && (
                  <span
                    className="action-btn"
                    onClick={() => {
                      setSelectedTabIds([]);
                      handleTabRemove(selectedTabs);
                    }}
                  >
                    {$fmt('common.remove')}
                  </span>
                )}
              </Space>
            )}
          </StyledTabActions>
        )}

        {/* tab 列表 */}
        <StyledTabListWrapper
          className="tab-list-wrapper"
          style={{ minHeight: `${tabListHeight}px` }}
        >
          <Checkbox.Group
            className="tab-list-checkbox-group"
            value={selectedTabIds}
            onChange={setSelectedTabIds}
          >
            {tabList.map((tab, index) => (
              <TabListItem
                key={tab.tabId || index}
                group={group}
                {...tab}
                onRemove={handleTabRemove}
                onChange={onTabChange}
              />
            ))}
          </Checkbox.Group>
        </StyledTabListWrapper>
      </StyledGroupWrapper>

      {/* 标签组删除确认弹窗 */}
      {modalVisible && (
        <Modal
          title={$fmt('home.removeTitle')}
          width={400}
          open={modalVisible}
          onOk={handleTabGroupRemove}
          onCancel={() => setModalVisible(false)}
        >
          <div dangerouslySetInnerHTML={{ __html: removeDesc }}>
            {/* {$fmt({ id: 'home.removeDesc', values: { type: $fmt(`home.tabGroup`) } })} */}
          </div>
        </Modal>
      )}
      {/* 还原确认弹窗 */}
      {recoverModalVisible && (
        <Modal
          title={$fmt('home.recoverTitle')}
          width={400}
          open={recoverModalVisible}
          onOk={handleTabGroupRecover}
          onCancel={() => setRecoverModalVisible(false)}
        >
          <div>
            {$fmt({ id: 'home.recoverDesc', values: { type: $fmt('home.tabGroup') } })}
          </div>
        </Modal>
      )}
    </>
  );
}

export default memo(TabGroup);
