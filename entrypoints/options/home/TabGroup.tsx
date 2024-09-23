import { useEffect, useRef, useState, useMemo, memo } from 'react';
import {
  theme,
  message,
  Skeleton,
  Modal,
  Space,
  Divider,
  Checkbox,
} from 'antd';
import type { CheckboxProps } from 'antd';
import {
  LockOutlined,
  StarOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { GroupItem, TabItem } from '~/entrypoints/types';
import { StyledActionIconBtn } from '~/entrypoints/common/style/Common.styled';
import { ENUM_COLORS, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import { useIntlUtls } from '~/entrypoints/common/hooks/global';
import { tabListUtils } from '@/entrypoints/common/storage';
import DndComponent from '@/entrypoints/common/components/DndComponent';
import DropComponent from '@/entrypoints/common/components/DropComponent';

import { HomeContext } from './hooks/treeData';
import EditInput from '../components/EditInput';
import TabListItem from './TabListItem';
import {
  StyledGroupWrapper,
  StyledGroupHeader,
  StyledTabActions,
  StyledTabListWrapper,
} from './TabGroup.styled';
import type {
  DndTabItemProps,
  DndTabItemOnDropCallback,
  MoveToCallbackProps,
} from './types';
import { dndKeys } from './constants';
import MoveToModal from './MoveToModal';
import useMoveTo from './hooks/moveTo';

const dndKey = dndKeys.tabItem;

type TabGroupProps = GroupItem & {
  refreshKey?: string;
  canDrag?: boolean;
  canDrop?: boolean;
  allowGroupActions?: string[];
  allowTabActions?: string[];
  selected?: boolean;
  onChange?: (data: Partial<GroupItem>) => void;
  onRemove?: () => void;
  onRestore?: () => void;
  onStarredChange?: (isStarred: boolean) => void;
  onDedup?: () => void;
  onRecover?: () => void;
  onDrop?: DndTabItemOnDropCallback;
  onTabChange?: (data: TabItem) => void;
  onTabRemove?: (groupId: string, tabs: TabItem[]) => void;
  onMoveTo?: ({ moveData, targetData, selected }: MoveToCallbackProps) => void;
};

const defaultGroupActions = [
  'remove',
  'rename',
  'restore',
  'lock',
  'star',
  'dedup',
  'moveTo',
  'copyLinks',
];
const defaultTabActions = ['remove', 'moveTo'];

function TabGroup({
  // refreshKey,
  groupId,
  groupName,
  createTime,
  tabList,
  isLocked,
  isStarred,
  selected,
  allowGroupActions = defaultGroupActions,
  allowTabActions = defaultTabActions,
  canDrag = true,
  canDrop = true,
  onChange,
  onRemove,
  onRestore,
  onStarredChange,
  onDedup,
  onRecover,
  onDrop,
  onTabChange,
  onTabRemove,
  onMoveTo,
}: TabGroupProps) {
  const { token } = theme.useToken();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { $fmt } = useIntlUtls();
  const groupRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [dedupModalVisible, setDedupModalVisible] = useState(false);
  const [recoverModalVisible, setRecoverModalVisible] = useState(false);

  const {
    modalVisible: moveToModalVisible,
    openModal: openMoveToModal,
    onConfirm: onMoveToConfirm,
    onClose: onMoveToClose,
    moveData,
  } = useMoveTo();
  const { treeDataHook } = useContext(HomeContext);

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
  const handleTabGroupDedup = () => {
    setDedupModalVisible(false);
    onDedup?.();
  };
  const handleTabGroupRecover = () => {
    setRecoverModalVisible(false);
    onRecover?.();
  };

  const tabLinks = useMemo(() => {
    return tabListUtils.copyLinks(tabList);
  }, [tabList]);

  // 复制到剪切板
  const handleCopy = (text: string, result: boolean) => {
    if (result) {
      messageApi.success($fmt('common.CopySuccess'));
    } else {
      messageApi.error($fmt('common.CopyFailed'));
    }
  };

  useEffect(() => {
    setRendering(false);
  }, []);

  function TabListMarkup({ tab, index }: { tab: TabItem; index: number }) {
    return (
      <DndComponent<DndTabItemProps>
        canDrag={canDrag && !isLocked && selectedTabIds.length === 0}
        key={tab.tabId || index}
        data={{ ...tab, index, groupId, dndKey }}
        dndKey={dndKey}
        onDrop={onDrop}
      >
        <TabListItem
          key={tab.tabId || index}
          group={{ groupId, isLocked, isStarred }}
          tab={tab}
          onRemove={async () => {
            await onTabRemove?.(groupId, [tab]);
            setSelectedTabIds(selectedTabIds.filter((id) => id !== tab.tabId));
          }}
          onChange={onTabChange}
        />
      </DndComponent>
    );
  }

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
              maxLength={20}
              maxWidth={240}
              fontSize={20}
              iconSize={16}
              onValueChange={(value) => onChange?.({ groupName: value || UNNAMED_GROUP })}
            ></EditInput>
          </div>
          <div className="group-header-right-part">
            <div className="group-info">
              <span className="tab-count" style={{ color: ENUM_COLORS.volcano }}>
                {$fmt({ id: 'home.tab.count', values: { count: tabList?.length || 0 } })}
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
              {allowGroupActions.includes('restore') && (
                <span className="action-btn" onClick={() => onRestore?.()}>
                  {$fmt('home.tabGroup.open')}
                </span>
              )}
              {allowGroupActions.includes('lock') && (
                <span
                  className="action-btn"
                  onClick={() => onChange?.({ isLocked: !isLocked })}
                >
                  {$fmt(isLocked ? 'home.tabGroup.unlock' : 'home.tabGroup.lock')}
                </span>
              )}
              {allowGroupActions.includes('star') && (
                <span
                  className="action-btn"
                  onClick={() => onStarredChange?.(!isStarred)}
                >
                  {$fmt(isStarred ? 'home.tabGroup.unstar' : 'home.tabGroup.star')}
                </span>
              )}
              {allowGroupActions.includes('moveTo') && (
                <span
                  className="action-btn"
                  onClick={() => openMoveToModal?.({ groupId })}
                >
                  {$fmt('common.moveTo')}
                </span>
              )}
              {allowGroupActions.includes('copyLinks') && (
                <CopyToClipboard text={tabLinks} onCopy={handleCopy}>
                  <span className="action-btn">{$fmt('home.copyLinks')}</span>
                </CopyToClipboard>
              )}
              {allowGroupActions.includes('dedup') && (
                <span className="action-btn" onClick={() => setDedupModalVisible(true)}>
                  {$fmt('common.dedup')}
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
                      onTabRemove?.(groupId, selectedTabs);
                    }}
                  >
                    {$fmt('common.remove')}
                  </span>
                )}
                {allowTabActions.includes('moveTo') && (
                  <span
                    className="action-btn"
                    onClick={() => openMoveToModal?.({ groupId, tabs: selectedTabs })}
                  >
                    {$fmt('common.moveTo')}
                  </span>
                )}
              </Space>
            )}
          </StyledTabActions>
        )}

        {/* tab 列表 */}
        <DropComponent
          data={{ index: 0, groupId, allowKeys: tabList?.length > 0 ? [] : [dndKey] }}
          canDrop={canDrop}
          onDrop={onDrop}
        >
          <StyledTabListWrapper className="tab-list-wrapper">
            <Checkbox.Group
              className="tab-list-checkbox-group"
              value={selectedTabIds}
              onChange={setSelectedTabIds}
            >
              {tabList.map((tab, index) => (
                <TabListMarkup key={tab.tabId} tab={tab} index={index}></TabListMarkup>
              ))}
            </Checkbox.Group>
          </StyledTabListWrapper>
        </DropComponent>
      </StyledGroupWrapper>

      {messageContextHolder}
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
      {/* 标签组去重确认弹窗 */}
      {dedupModalVisible && (
        <Modal
          title={$fmt('home.dedupTitle')}
          width={400}
          open={dedupModalVisible}
          onOk={handleTabGroupDedup}
          onCancel={() => setDedupModalVisible(false)}
        >
          <div>{$fmt('home.dedupDesc')}</div>
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
      {/* 移动到弹窗 */}
      {moveToModalVisible && (
        <MoveToModal
          visible={moveToModalVisible}
          listData={treeDataHook.tagList}
          moveData={moveData}
          onOk={(targetData) => {
            onMoveToConfirm(() => {
              onMoveTo?.({ moveData, targetData, selected: !!selected });
              setSelectedTabIds([]);
            });
          }}
          onCancel={onMoveToClose}
        />
      )}
    </>
  );
}

export default memo(TabGroup)