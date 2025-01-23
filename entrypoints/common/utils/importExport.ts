import type { TagItem, TabItem, KepTabItem, KepTabGroup, GroupItem } from '~/entrypoints/types';
import { tabListUtils } from '~/entrypoints/common/storage';
import type {
  ExtContentImporterProps,
  ExtContentExporterProps,
} from '~/entrypoints/types';
import { getRandomId, newCreateTime } from '~/entrypoints/common/utils';

// 解析 NiceTab、OneTab等 插件的导入内容
export const extContentImporter: ExtContentImporterProps = {
  keptab(content: string): TagItem[] {
    const groupList = [] as GroupItem[];
    const keptabList = JSON.parse(content || '[]') as KepTabGroup[];
    for (let tabGroup of keptabList) {
      if (tabGroup.tabs.length === 0) {
        continue
      }
      if (tabGroup.title === "") {
        tabGroup.title = `keptab-${getRandomId()}`
      }
      let tabList: TabItem[] = [];
      for (let tabItem of tabGroup.tabs) {
        tabList.push({
          tabId: getRandomId(),
          title: tabItem.title,
          url: tabItem.url,
        } as TabItem)
      }
      const newGroupItem = tabListUtils.getInitialTabGroup();
      groupList.push({
        ...newGroupItem,
        groupName: tabGroup.title,
        tabList: [...tabList],
      } as GroupItem)
    }
    const newTag = tabListUtils.getInitialTag();
    newTag.tagName = 'KepTab';
    newTag.groupList = groupList || [];
    return [newTag];
  },
  oneTab(content: string): TagItem[] {
    const groupList = [] as GroupItem[];
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
      tag.createTime = tag.createTime || createTime;
      tag?.groupList?.forEach((group) => {
        group.groupId = getRandomId();
        group.createTime = group.createTime || createTime;
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
  keptab(tagList): string {
    let resultList: KepTabGroup[] = [];
    try {
      (tagList as TagItem[]).forEach((tag, tagIdx) => {
        tag?.groupList?.forEach((group, grpIdx) => {
          const tabList = [] as KepTabItem[];
          group?.tabList?.forEach((tab) => {
            tabList.push({
              url: tab.url,
              title: tab.title,
              favIconUrl: tab.favIconUrl,
              pinned: false,
              muted: false,
            } as KepTabItem);
          });
          resultList.push({
            _id: tagIdx + grpIdx + 1,
            title: group.groupName,
            tabs: tabList,
            urls: tabList.map(v => v.url),
            tags: [] as string[],
            time: Date.now(),
            lock: false,
            star: false,
          } as KepTabGroup);
        });
      });
      return JSON.stringify(resultList || []);
    } catch {
      return JSON.stringify([]);
    }
  },
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
