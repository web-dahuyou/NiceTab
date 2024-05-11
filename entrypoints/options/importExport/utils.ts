import type { TagItem, GroupItem, TabItem } from '~/entrypoints/types';
import { tabListUtils } from '~/entrypoints/common/storage';
import type { ExtContentImporterProps, ExtContentExporterProps } from './types';
import { getRandomId, omit } from '~/entrypoints/common/utils';

// 解析 NiceTab、OneTab等 插件的导入内容
export const extContentImporter: ExtContentImporterProps = {
  oneTab(content: string): TagItem[] {
    const groupList = [];
    let tabList: TabItem[] = [];
    for (let line of content.split('\n')) {
      if (!line.trim()) {
        if (tabList?.length > 0) {
          const newGroupItem = tabListUtils.getInitialTabGroup();
          groupList.push({ ...newGroupItem, tabList: [...tabList] });
          tabList = [];
        }
        continue;
      }

      let [url, title] = line?.trim()?.split(' | ');
      tabList.push({ url, title });
    }

    if (tabList?.length > 0) {
      const newGroupItem = tabListUtils.getInitialTabGroup();
      groupList.push({ ...newGroupItem, tabList: [...tabList] });
      tabList = [];
    }

    const newTag = tabListUtils.getInitialTag();
    newTag.groupList = groupList || [];
    return [newTag];
  },
  niceTab(content: string): TagItem[] {
    const tagList = JSON.parse(content) as TagItem[];
    tagList.forEach(tag => {
      tag.tagId = getRandomId();
      tag?.groupList?.forEach(group => {
        group.groupId = getRandomId();
      });
    })
    return tagList;
  }
}

// 将内容导出为 NiceTab、OneTab 等格式
export const extContentExporter: ExtContentExporterProps = {
  oneTab(tagList): string {
    let resultList: string[] = [];
    try {
      tagList.forEach(tag => {
        tag?.groupList?.forEach(group => {
          group?.tabList?.forEach(tab => {
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
  }
}


export default {
  extContentImporter,
  extContentExporter
};


