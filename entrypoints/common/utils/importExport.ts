import type { TagItem, TabItem } from '~/entrypoints/types';
import { tabListUtils } from '~/entrypoints/common/storage';
import type {
  ExtContentImporterProps,
  ExtContentExporterProps,
} from '~/entrypoints/types';
import { getRandomId, newCreateTime } from '~/entrypoints/common/utils';

// 解析 NiceTab、OneTab等 插件的导入内容
export const extContentImporter: ExtContentImporterProps = {
  oneTab(content: string): TagItem[] {
    const groupList = [];
    let tabList: TabItem[] = [];
    for (let line of content.split('\n')) {
      if (!line.trim()) {
        if (tabList?.length > 0) {
          const newGroupItem = tabListUtils.getInitialTabGroup();
          groupList.push({
            ...newGroupItem,
            groupName: `oneTab-${getRandomId()}`,
            tabList: [...tabList],
          });
          tabList = [];
        }
        continue;
      }

      let [url, title] = line?.trim()?.split(' | ');
      tabList.push({ url, title, tabId: getRandomId() });
    }

    if (tabList?.length > 0) {
      const newGroupItem = tabListUtils.getInitialTabGroup();
      groupList.push({
        ...newGroupItem,
        groupName: `oneTab-${getRandomId()}`,
        tabList: [...tabList],
      });
      tabList = [];
    }

    const newTag = tabListUtils.getInitialTag();
    newTag.tagName = 'OneTab';
    newTag.groupList = groupList || [];
    return [newTag];
  },
  niceTab(content: string): TagItem[] {
    const tagList = JSON.parse(content || '[]') as TagItem[];
    const createTime = newCreateTime();
    tagList.forEach((tag) => {
      tag.tagId = tag.static ? '0' : getRandomId();
      tag.createTime = createTime;
      tag?.groupList?.forEach((group) => {
        group.groupId = getRandomId();
        group.createTime = createTime;
        group?.tabList?.forEach((tab) => {
          const { favIconUrl } = tab;
          tab.tabId = getRandomId();
          tab.favIconUrl = favIconUrl?.startsWith('data:image/') ? '' : favIconUrl;
        });
      });
    });
    return tagList;
  },
};

// 将内容导出为 NiceTab、OneTab 等格式
export const extContentExporter: ExtContentExporterProps = {
  oneTab(tagList): string {
    let resultList: string[] = [];
    try {
      tagList.forEach((tag) => {
        tag?.groupList?.forEach((group) => {
          group?.tabList?.forEach((tab) => {
            resultList.push(`${tab.url} | ${tab.title}\n`);
          });
          resultList.push('\n');
        });
      });
      return resultList.join('');
    } catch {
      return '';
    }
  },
  niceTab(tagList): string {
    try {
      return JSON.stringify(tagList || []);
    } catch {
      return '';
    }
  },
};

export default {
  extContentImporter,
  extContentExporter,
};
