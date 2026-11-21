import { requestTabGroupRemoval } from '~/entrypoints/common/storage/batchRemoval';
import { useContext, useRef, useState } from 'react';
import styled from 'styled-components';
import { Checkbox, Dropdown, Space, Typography, Modal } from 'antd';
import { CloseOutlined, ExportOutlined, SendOutlined } from '@ant-design/icons';
import { GlobalContext, useIntlUtls } from '~/entrypoints/common/hooks/global';
import {
  incognitoUtils,
  settingsUtils,
  tabListUtils,
} from '~/entrypoints/common/storage';
import { getRandomId } from '~/entrypoints/common/utils';
import {
  ENUM_COLORS,
  ENUM_SETTINGS_PROPS,
  UNNAMED_GROUP,
} from '~/entrypoints/common/constants';
import ActionIconBtn from '~/entrypoints/common/components/ActionIconBtn';
import {
  createNewWindowForOpen,
  openNewGroup,
  reloadOtherAdminPage,
  removeNewWindowBlankTabs,
} from '~/entrypoints/common/tabs';
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

const {
  CONFIRM_BEFORE_DELETING_GROUPS,
  DELETE_AFTER_RESTORE,
  DISCARD_WHEN_OPEN_TABS,
  NAMED_GROUP_RESTORE_AS_GROUP,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
} = ENUM_SETTINGS_PROPS;

type OpenMode = 'current' | 'newWindow' | 'incognito';

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

  const getGroupsToOpen = async () => {
    const tags = await tabListUtils.getTagList();
    return tags.flatMap(tag =>
      tag.groupList
        .filter(
          group =>
            groupIds.includes(group.groupId) &&
            group.tabList.some(tab => tab.url?.trim()),
        )
        .map(group => ({ tag, group })),
    );
  };

  const openInWindow = async (mode: 'current' | 'newWindow') => {
    const settings = await settingsUtils.getSettings();
    const groups = await getGroupsToOpen();
    if (!groups.length) return;
    const isNewWindow = mode === 'newWindow';
    // 新建窗口会自带一个空白标签页，打开完成后移除
    const { windowId, initialTabIds } = isNewWindow
      ? await createNewWindowForOpen()
      : { windowId: (await browser.windows.getCurrent()).id, initialTabIds: [] };
    if (windowId === undefined) {
      $message.error($fmt('home.treeNodeBatch.failed'));
      return;
    }
    let hasFailed = false;
    const openedIds: string[] = [];
    try {
      for (const { group } of groups) {
        const asGroup =
          settings[
            group.groupName === UNNAMED_GROUP
              ? UNNAMED_GROUP_RESTORE_AS_GROUP
              : NAMED_GROUP_RESTORE_AS_GROUP
          ];
        const opened = await openNewGroup(
          group.groupName,
          group.tabList.map(tab => tab.url),
          {
            windowId,
            asGroup,
            discard: settings[DISCARD_WHEN_OPEN_TABS],
          },
        );
        // 打开失败时停止处理，避免继续往无效窗口里打开
        if (!opened) {
          hasFailed = true;
          break;
        }
        openedIds.push(group.groupId);
      }
    } finally {
      if (isNewWindow) {
        await removeNewWindowBlankTabs(windowId, initialTabIds);
      }
      if (settings[DELETE_AFTER_RESTORE] && openedIds.length) {
        // 一次读写完成批量删除，并通知其他窗口刷新（中途失败时已打开的也要删除）
        const removedIds = await requestTabGroupRemoval(openedIds);
        if (removedIds.length) await reloadOtherAdminPage();
      }
      onProcessed(openedIds);
    }
    if (hasFailed) $message.error($fmt('home.treeNodeBatch.failed'));
  };

  // split 无痕模式下普通环境拿不到无痕窗口对象，由辅助页面在无痕环境中完成打开，
  // 再通过临时存储回传处理结果
  const openInIncognito = async () => {
    let allowed = true;
    try {
      allowed = (await browser.extension.isAllowedIncognitoAccess?.()) ?? true;
    } catch {
      allowed = true;
    }
    if (!allowed) {
      $message.warning($fmt('home.treeNodeBatch.incognitoPermission'));
      return;
    }
    const groups = await getGroupsToOpen();
    if (!groups.length) return;
    const settings = await settingsUtils.getSettings();
    const taskId = getRandomId();
    await incognitoUtils.setTask({
      id: taskId,
      groupIds: groups.map(({ group }) => group.groupId),
      createdAt: Date.now(),
    });
    try {
      await browser.windows.create({
        focused: true,
        incognito: true,
        url: `${browser.runtime.getURL('/incognito-open.html')}#${taskId}`,
      });
    } catch (error) {
      await incognitoUtils.removeTask(taskId);
      throw error;
    }

    const result = await incognitoUtils.waitResult(taskId);
    // 删除动作发生在无痕环境，本窗口内存中的列表已过期，重新读取后再刷新
    if (result) await tabListUtils.getTagList();
    if (result?.processedIds?.length) {
      onProcessed(result.processedIds);
      // 删除动作发生在无痕环境，其他窗口的管理页不会自动刷新
      if (settings[DELETE_AFTER_RESTORE]) await reloadOtherAdminPage();
    }
    if (!result) {
      // 无痕环境未回传结果，清理任务，避免遗留数据
      await incognitoUtils.removeTask(taskId);
      $message.error($fmt('home.treeNodeBatch.failed'));
      return;
    }
    if (result.failed) {
      $message.error($fmt('home.treeNodeBatch.failed'));
    }
    await incognitoUtils.removeResult(taskId);
  };

  const open = (mode: OpenMode) =>
    run(async () => {
      if (mode === 'incognito') {
        await openInIncognito();
      } else {
        await openInWindow(mode);
      }
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
                  items: (['current', 'newWindow', 'incognito'] as const).map(mode => ({
                    key: mode,
                    label: $fmt(`home.treeNodeBatch.open.${mode}`),
                    onClick: () => open(mode),
                  })),
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
