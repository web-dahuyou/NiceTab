import dayjs from 'dayjs';
import type {
  TagItem,
  TabItem,
  GroupItem,
  KepTabItem,
  KepTabGroup,
  TobyItem,
  TobyGroup,
  TobyData,
  SessionBuddyData,
} from '~/entrypoints/types';
import { tabListUtils } from '~/entrypoints/common/storage';
import type {
  ExtContentImporterProps,
  ExtContentExporterProps,
  ExtContentParserFuncName,
} from '~/entrypoints/types';
import { getRandomId, newCreateTime } from '~/entrypoints/common/utils';
import { UNNAMED_TAG, UNNAMED_GROUP } from '../constants';

// 识别内容格式
export const extContentFormatCheck = (content: string): ExtContentParserFuncName => {
  try {
    const contentValue = JSON.parse(content.trim());
    if (Array.isArray(contentValue)) {
      const firstItem = contentValue[0];
      if (firstItem?.tagName) {
        return 'niceTab';
      } else if (Array.isArray(firstItem?.tabs)) {
        return 'kepTab';
      }
    } else {
      if (Array.isArray(contentValue?.lists)) {
        return 'toby';
      } else if (Array.isArray(contentValue?.collections)) {
        return 'sessionBuddy';
      }
    }

    return 'niceTab';
  } catch (e) {
    return 'oneTab';
  }
};

// 解析 NiceTab、OneTab等 插件的导入内容
export const extContentImporter: ExtContentImporterProps = {
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
    tagList.forEach(tag => {
      tag.tagId = tag.static ? '0' : getRandomId();
      tag.createTime = tag.createTime || createTime;
      tag?.groupList?.forEach(group => {
        group.groupId = getRandomId();
        group.createTime = group.createTime || createTime;
        group?.tabList?.forEach(tab => {
          const { favIconUrl } = tab;
          tab.tabId = getRandomId();
          tab.favIconUrl = favIconUrl?.startsWith('data:image/') ? '' : favIconUrl;
        });
      });
    });
    return tagList;
  },
  kepTab(content: string): TagItem[] {
    const groupList: GroupItem[] = [];
    const keptabList = JSON.parse(content || '[]') as KepTabGroup[];
    for (let tabGroup of keptabList) {
      if (!tabGroup.tabs?.length) {
        continue;
      }
      if (!tabGroup?.title?.trim()) {
        tabGroup.title = `keptab-${getRandomId()}`;
      }
      let tabList: TabItem[] = [];
      for (let tabItem of tabGroup.tabs) {
        tabList.push({
          tabId: getRandomId(),
          title: tabItem.title,
          url: tabItem.url,
        });
      }
      const newGroupItem = tabListUtils.getInitialTabGroup();
      groupList.push({
        ...newGroupItem,
        groupName: tabGroup.title,
        tabList: [...tabList],
      });
    }
    const newTag = tabListUtils.getInitialTag();
    newTag.tagName = 'KepTab';
    newTag.groupList = groupList || [];
    return [newTag];
  },
  toby(content: string): TagItem[] {
    const groupList: GroupItem[] = [];
    const tobyData = JSON.parse(content || '{}') as TobyData;
    for (let tabGroup of tobyData.lists || []) {
      if (!tabGroup.cards?.length) {
        continue;
      }
      if (!tabGroup?.title?.trim()) {
        tabGroup.title = `toby-${getRandomId()}`;
      }
      const tabList = tabGroup.cards.map(tabItem => ({
        tabId: getRandomId(),
        title: tabItem.customTitle || tabItem.title,
        url: tabItem.url,
      }));
      const newGroupItem = tabListUtils.getInitialTabGroup();
      groupList.push({
        ...newGroupItem,
        groupName: tabGroup.title,
        tabList: [...tabList],
      });
    }
    const newTag = tabListUtils.getInitialTag();
    newTag.tagName = 'Toby';
    newTag.groupList = groupList || [];
    return [newTag];
  },
  sessionBuddy(content: string): TagItem[] {
    const sessionBuddyData = JSON.parse(content || '{}') as SessionBuddyData;
    const tagList = sessionBuddyData.collections || [];
    const createTime = newCreateTime();
    return tagList.map(tag => {
      return {
        tagId: getRandomId(),
        tagName: tag.title ? `SessionBuddy-${tag.title}` : 'SessionBuddy',
        createTime: tag.created ? newCreateTime(tag.created) : createTime,
        groupList: tag.folders?.map(group => {
          return {
            groupId: getRandomId(),
            groupName: group.title || `sessionBuddy-${getRandomId()}`,
            createTime: createTime,
            tabList: group.links?.map(tab => {
              return {
                tabId: getRandomId(),
                title: tab.title,
                url: tab.url,
                favIconUrl: tab.favIconUrl || '',
              };
            }),
          };
        }),
      };
    });
  },
};

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
  },
  kepTab(tagList): string {
    let resultList: KepTabGroup[] = [];
    try {
      (tagList as TagItem[]).forEach((tag, tagIdx) => {
        tag?.groupList?.forEach((group, grpIdx) => {
          const tabList: KepTabItem[] = [];
          const tabUrls: string[] = [];
          group?.tabList?.forEach(tab => {
            if (tab.url) {
              tabList.push({
                url: tab.url,
                title: tab.title || '',
                favIconUrl: tab.favIconUrl || '',
                pinned: false,
                muted: false,
              });

              tabUrls.push(tab.url);
            }
          });
          resultList.push({
            _id: new Date().getTime() - Number(String(tagIdx) + grpIdx),
            title: group.groupName,
            tabs: tabList,
            urls: tabUrls,
            tags: [],
            time: Date.now(),
            lock: false,
            star: false,
          });
        });
      });
      return JSON.stringify(resultList || []);
    } catch {
      return JSON.stringify([]);
    }
  },
  toby(tagList): string {
    const groupList: TobyGroup[] = [];
    try {
      (tagList as TagItem[]).forEach((tag, tagIdx) => {
        tag?.groupList?.forEach((group, grpIdx) => {
          const tabList: TobyItem[] = [];
          group?.tabList?.forEach(tab => {
            if (tab.url) {
              tabList.push({
                url: tab.url,
                title: tab.title || '',
                customTitle: '',
                customDescription: '',
              });
            }
          });
          groupList.push({
            title: group.groupName,
            cards: tabList,
            labels: [],
          });
        });
      });
      return JSON.stringify({
        version: 3,
        lists: groupList || [],
      });
    } catch {
      return JSON.stringify([]);
    }
  },
  sessionBuddy(): string {
    return '暂不适配';
  },
};

// 将 legacy Netscape HTML 转化为 tagList 格式
export function html2niceTab(html: string): TagItem[] {

  return [];
}

// 将 tagList 转化为 legacy Netscape HTML 书签格式
export function niceTab2html(tagList: Partial<TagItem>[]): string {
  function indent(level: number) {
    return ' '.repeat(level * 4);
  }

  function escapeHtml(text: string | undefined | null): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let html = [];
  html.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  html.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  html.push('<TITLE>Bookmarks</TITLE>');
  html.push('<H1>Bookmarks</H1>');
  html.push('<DL><p>');
  html.push(
    indent(1) +
      `<DT><H3 ADD_DATE="${dayjs().unix()}" PERSONAL_TOOLBAR_FOLDER="true">NiceTab</H3>`,
  );
  html.push(indent(1) + '<DL><p>');

  tagList?.forEach(tag => {
    const tagAddDate = tag.createTime ? dayjs(tag.createTime).unix() : '';
    const tagAddDateStr = tagAddDate ? ` ADD_DATE="${tagAddDate}"` : '';
    // 分类名为文件夹
    html.push(
      indent(2) +
        `<DT><H3${tagAddDateStr}>${escapeHtml(tag.tagName || UNNAMED_TAG)}</H3>`,
    );
    html.push(indent(2) + '<DL><p>');

    tag?.groupList?.forEach(group => {
      const groupAddDate = group.createTime ? dayjs(group.createTime).unix() : '';
      const groupAddDateStr = groupAddDate ? ` ADD_DATE="${groupAddDate}"` : '';
      // 分组名为子文件夹
      html.push(
        indent(3) +
          `<DT><H3${groupAddDateStr}>${escapeHtml(group.groupName || UNNAMED_GROUP)}</H3>`,
      );
      html.push(indent(3) + '<DL><p>');

      group?.tabList?.forEach(tab => {
        if (tab.url) {
          // 书签条目
          const tabAddDate = groupAddDate || tagAddDate;
          const tabAddDateStr = tabAddDate ? ` ADD_DATE="${tabAddDate}"` : '';
          const title = escapeHtml(tab.title || tab.url);
          const href = escapeHtml(tab.url);
          html.push(indent(4) + `<DT><A HREF="${href}"${tabAddDateStr}>${title}</A>`);
        }
      });
      html.push(indent(3) + '</DL><p>');
    });

    html.push(indent(2) + '</DL><p>');
  });

  html.push(indent(1) + '</DL><p>');
  html.push('</DL><p>');
  return html.join('\n');
}

export default {
  extContentImporter,
  extContentExporter,
  niceTab2html,
};
