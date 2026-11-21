import { useContext, useRef, useState } from 'react';
import styled from 'styled-components';
import { Checkbox, Dropdown, Space, Typography, Modal } from 'antd';
import { CloseOutlined, ExportOutlined, SendOutlined } from '@ant-design/icons';

import { requestTabGroupRemoval } from '~/entrypoints/common/storage/batchRemoval';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import { settingsUtils, tabListUtils } from '~/entrypoints/common/storage';
import { ENUM_COLORS, ENUM_SETTINGS_PROPS } from '~/entrypoints/common/constants';
import ActionIconBtn from '~/entrypoints/common/components/ActionIconBtn';
import { groupTarget, type OpenMode } from '~/entrypoints/common/openUtils';
import {
  openModeItems,
  useOpenSavedTabs,
} from '~/entrypoints/common/components/OpenModeMenu';
import { reloadOtherAdminPage } from '~/entrypoints/common/tabs';

import { HomeContext } from '../hooks/treeData';
import MoveToModal from '../MoveToModal';

const StyledGroupActionHeader = styled.div`
  margin-bottom: 4px;
  .group-action {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .group-action-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .group-action-btns {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const { CONFIRM_BEFORE_DELETING_GROUPS, DELETE_AFTER_RESTORE } = ENUM_SETTINGS_PROPS;

export default function TreeBatchActions({
  groupIds,
  total,
  onSelectAll,
  onProcessed,
  onBusyChange,
}: {
  groupIds: string[];
  total: number;
  onSelectAll: (checked: boolean) => void;
  onProcessed: (ids: string[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const openSaved = useOpenSavedTabs();
  const { $fmt } = useIntlUtls();
  const { $message } = useContext(GlobalContext);
  const { treeDataHook } = useContext(HomeContext);
  const [modal, contextHolder] = Modal.useModal();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [moveIds, setMoveIds] = useState<string[]>();
  const selected = treeDataHook.tagList.flatMap(tag =>
    tag.groupList
      .filter(group => groupIds.includes(group.groupId))
      .map(group => ({ tag, group })),
  );
  const movable = selected.filter(({ tag }) => !tag.isLocked);
  const removable = movable.filter(({ group }) => !group.isLocked);
  const lockedCount = selected.length - removable.length;
  const lockTip = $fmt({
    id: 'home.treeNodeBatch.lockedTip',
    values: { count: lockedCount, editable: removable.length },
  });

  const setWorking = (value: boolean) => {
    busyRef.current = value;
    setBusy(value);
    onBusyChange(value);
  };
  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    setWorking(true);
    try {
      await action();
    } catch (error) {
      console.error('Batch tab group action failed', error);
      $message.error($fmt('home.treeNodeBatch.failed'));
    } finally {
      treeDataHook.refreshTreeData();
      setWorking(false);
    }
  };

  const remove = () =>
    run(async () => {
      const ids = removable.map(({ group }) => group.groupId);
      const settings = await settingsUtils.getSettings();
      if (settings[CONFIRM_BEFORE_DELETING_GROUPS]) {
        const confirmed = await modal.confirm({
          title: $fmt('home.removeTitle'),
          content: $fmt({
            id: 'home.treeNodeBatch.removeConfirm',
            values: { count: ids.length, locked: lockedCount },
          }),
        });
        if (!confirmed) return;
      }
      // 一次读写完成批量删除（锁定分类、锁定标签组会被跳过）
      const removedIds = await requestTabGroupRemoval(ids);
      if (removedIds.length) {
        onProcessed(removedIds);
        // 数据已变化，通知其他窗口的管理页刷新
        await reloadOtherAdminPage().catch(error =>
          console.warn('Unable to notify other windows after batch removal', error),
        );
      }
    });

  const open = (mode: OpenMode) =>
    run(async () => {
      const tags = await tabListUtils.getTagList();
      const targets = tags
        .flatMap(tag => tag.groupList)
        .filter(
          group =>
            groupIds.includes(group.groupId) &&
            group.tabList.some(tab => tab.url?.trim()),
        )
        .map(group => groupTarget(group));
      const settings = await settingsUtils.getSettings();
      const { processedIds } = await openSaved(targets, mode);
      if (settings[DELETE_AFTER_RESTORE] && processedIds.length) {
        const removedIds = await requestTabGroupRemoval(processedIds);
        if (removedIds.length) await reloadOtherAdminPage();
      }
      onProcessed(processedIds);
    });

  return (
    <StyledGroupActionHeader>
      {contextHolder}
      <div className="group-action">
        <div className="group-action-status">
          <Checkbox
            checked={total > 0 && groupIds.length === total}
            indeterminate={groupIds.length > 0 && groupIds.length < total}
            disabled={!total || busy}
            aria-label={$fmt('home.treeNodeBatch.selectAll')}
            onChange={event => onSelectAll(event.target.checked)}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {$fmt('home.tabGroup')}
          </Typography.Text>
          <span style={{ color: ENUM_COLORS.volcano }}>
            {`${groupIds.length} / ${total}`}
          </span>
        </div>
        {groupIds.length > 0 && (
          <>
            <div className="group-action-btns">
              <ActionIconBtn
                className="action-btn"
                size={16}
                hoverColor={ENUM_COLORS.red}
                disabled={busy || !removable.length}
                label={$fmt('common.remove')}
                onClick={remove}
              >
                <CloseOutlined />
              </ActionIconBtn>
              <Dropdown
                trigger={['click']}
                disabled={
                  busy ||
                  !selected.some(({ group }) =>
                    group.tabList.some(tab => tab.url?.trim()),
                  )
                }
                menu={{
                  items: openModeItems($fmt, open),
                }}
              >
                <span className="action-btn">
                  <ActionIconBtn
                    size={16}
                    disabled={
                      busy ||
                      !selected.some(({ group }) =>
                        group.tabList.some(tab => tab.url?.trim()),
                      )
                    }
                    label={$fmt('common.open')}
                  >
                    <ExportOutlined />
                  </ActionIconBtn>
                </span>
              </Dropdown>
              <ActionIconBtn
                className="action-btn"
                size={16}
                disabled={busy || !movable.length}
                label={$fmt('common.moveTo')}
                onClick={() => {
                  setMoveIds(movable.map(({ group }) => group.groupId));
                  setWorking(true);
                }}
              >
                <SendOutlined />
              </ActionIconBtn>
            </div>
          </>
        )}
      </div>
      {groupIds.length > 0 && lockedCount > 0 && (
        <div className="group-lock-tip">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {lockTip}
          </Typography.Text>
        </div>
      )}
      {moveIds && (
        <MoveToModal
          visible
          moveData={{ groupIds: moveIds }}
          onProcessed={onProcessed}
          onOk={() => {
            setMoveIds(undefined);
            setWorking(false);
            treeDataHook.refreshTreeData();
          }}
          onCancel={() => {
            setMoveIds(undefined);
            setWorking(false);
            treeDataHook.refreshTreeData();
          }}
        />
      )}
    </StyledGroupActionHeader>
  );
}
