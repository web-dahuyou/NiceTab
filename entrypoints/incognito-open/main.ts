import { requestTabGroupRemoval } from '~/entrypoints/common/storage/batchRemoval';
import type { GroupItem, TagItem } from '~/entrypoints/types';
import { ENUM_SETTINGS_PROPS, UNNAMED_GROUP } from '~/entrypoints/common/constants';
import {
  incognitoUtils,
  settingsUtils,
  tabListUtils,
} from '~/entrypoints/common/storage';
import { openNewGroup } from '~/entrypoints/common/tabs';
import { getLocaleMessages } from '~/entrypoints/common/utils';

const {
  DELETE_AFTER_RESTORE,
  DISCARD_WHEN_OPEN_TABS,
  NAMED_GROUP_RESTORE_AS_GROUP,
  UNNAMED_GROUP_RESTORE_AS_GROUP,
} = ENUM_SETTINGS_PROPS;

// 关闭当前辅助页（无痕窗口中唯一的初始标签页）
async function closeCurrentTab() {
  const tab = await browser.tabs.getCurrent();
  if (tab?.id !== undefined) {
    await browser.tabs.remove(tab.id).catch(() => {
      // 标签页可能已经被关闭，忽略错误
    });
  }
}

// 等待本次打开的标签页完成休眠，避免辅助页关闭后休眠监听失效
async function waitForDiscarded(windowId?: number) {
  if (windowId === undefined) return;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 12000) {
    const tabs = await browser.tabs.query({ windowId });
    const pending = tabs.filter(tab => !tab.active && !tab.discarded && tab.url);
    if (!pending.length) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

function getGroupsByIds(tagList: TagItem[], groupIds: string[]) {
  return tagList.reduce<Array<{ tag: TagItem; group: GroupItem }>>((result, tag) => {
    tag.groupList?.forEach(group => {
      if (
        groupIds.includes(group.groupId) &&
        group.tabList.some(tab => tab.url?.trim())
      ) {
        result.push({ tag, group });
      }
    });
    return result;
  }, []);
}

async function main() {
  const statusEl = document.getElementById('status');
  const taskId = decodeURIComponent(location.hash.slice(1));
  const currentWindow = await browser.windows.getCurrent();

  // 仅在无痕窗口中执行，避免普通窗口误触发
  const task = taskId ? await incognitoUtils.getTask(taskId) : null;
  if (!task || !currentWindow.incognito || currentWindow.id === undefined) {
    if (task) await incognitoUtils.removeTask(task.id);
    // 没有待处理任务时保留页面并提示，避免误开页面时静默关闭
    try {
      const messages = await getLocaleMessages();
      if (statusEl) {
        statusEl.textContent = messages['home.treeNodeBatch.helperNoTask'];
      }
    } catch (error) {
      console.warn('Unable to load incognito helper message', error);
    }
    return;
  }
  await incognitoUtils.removeTask(task.id);

  const processedIds: string[] = [];
  let failed = false;
  let discardEnabled = false;
  let deleteAfterRestore = false;

  try {
    const messages = await getLocaleMessages();
    if (statusEl) {
      statusEl.textContent = messages['home.treeNodeBatch.opening'];
    }

    const settings = await settingsUtils.getSettings();
    deleteAfterRestore = !!settings[DELETE_AFTER_RESTORE];
    discardEnabled = !!settings[DISCARD_WHEN_OPEN_TABS];
    const tagList = await tabListUtils.getTagList();
    const groups = getGroupsByIds(tagList, task.groupIds);

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
          windowId: currentWindow.id,
          asGroup,
          discard: discardEnabled,
        },
      );
      if (!opened) {
        failed = true;
        break;
      }

      processedIds.push(group.groupId);
    }
  } catch (error) {
    console.error('Incognito batch open failed', error);
    failed = true;
  }

  if (deleteAfterRestore && processedIds.length) {
    try {
      await requestTabGroupRemoval(processedIds);
    } catch (error) {
      // 删除未提交，管理页保留本次勾选。
      console.error('Incognito batch removal failed', error);
      processedIds.length = 0;
      failed = true;
    }
  }

  // 先回传结果，再等待休眠完成，避免主页面一直处于忙碌状态
  try {
    await incognitoUtils.setResult({
      id: task.id,
      processedIds,
      failed,
      finishedAt: Date.now(),
    });
  } catch (error) {
    console.error('Incognito batch open result failed', error);
  }

  if (discardEnabled) {
    await waitForDiscarded(currentWindow.id);
  }
  await closeCurrentTab();
}

main().catch(error => {
  console.error('Incognito open page failed', error);
});
