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
  const createTime = newCreateTime();

  function unescapeHtml(text: string | undefined | null): string {
    if (!text) return '';
    return String(text)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  function parseHref(attrs: string): string {
    const m = attrs.match(/\bHREF\s*=\s*"([^"]*)"/i);
    return m ? unescapeHtml(m[1]) : '';
  }

  function parseAddDateToCreateTime(attrs: string): string {
    const m = attrs.match(/\bADD_DATE\s*=\s*"(\d+)"/i);
    if (m) {
      const ts = Number(m[1]) * (m[1].length < 13 ? 1000 : 1);
      return newCreateTime(ts);
    }
    return createTime;
  }

  function hasPersonalToolbarFlag(attrs: string): boolean {
    return /\bPERSONAL_TOOLBAR_FOLDER\s*=\s*"true"/i.test(attrs);
  }

  // 解析 Netscape 书签为一个中间树结构，保留顺序及重名
  type Node = {
    type: 'folder' | 'link';
    title?: string;
    attrs?: string;
    children?: Node[];
  };
  function tokenize(input: string): string[] {
    // 仅保留有意义的标签行，分割为行级 token，避免复杂 HTML 解析
    const lines = input
      .replace(/\r\n?|\n/g, '\n')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return lines;
  }

  function parseTree(input: string): Node {
    const root: Node = { type: 'folder', title: 'ROOT', children: [] };
    const stack: Array<{ node: Node; isInsideDL: boolean }> = [
      { node: root, isInsideDL: true },
    ];
    const lines = tokenize(input);

    for (const line of lines) {
      if (/^<DL\b[^>]*>/i.test(line)) {
        // 进入一个层级目录
        stack.push({
          node: { type: 'folder', title: undefined, children: [] },
          isInsideDL: true,
        });
        continue;
      }
      if (/^<\/DL>/i.test(line)) {
        // 关闭当前 DL，将其 children 合并到上一个命名文件夹或根
        if (stack.length > 1) {
          const folderBlock = stack.pop()!.node;
          const parent = stack[stack.length - 1].node;
          // 如果上一个语义标签是 H3 则其对应一个命名的文件夹，children 应挂到它
          // 在遇到 <H3> 时已将命名 folder 节点压入 parent.children，
          // 这里需要把临时匿名 children 移动到最近的命名 folder（若存在）
          const lastChild = parent.children?.[parent.children.length - 1];
          if (lastChild && lastChild.type === 'folder' && lastChild.title) {
            lastChild.children = [
              ...(lastChild.children || []),
              ...(folderBlock.children || []),
            ];
          } else {
            parent.children = [
              ...(parent.children || []),
              ...(folderBlock.children || []),
            ];
          }
        }
        continue;
      }

      // <DT><H3 ...>Folder</H3>
      const h3Match = line.match(/^<DT>\s*<H3([^>]*)>(.*?)<\/H3>/i);
      if (h3Match) {
        const attrs = h3Match[1] || '';
        const title = unescapeHtml(h3Match[2] || '');
        const folderNode: Node = { type: 'folder', title, attrs, children: [] };
        const parent = stack[stack.length - 1].node;
        parent.children = parent.children || [];
        parent.children.push(folderNode);
        continue;
      }

      // <DT><A HREF="..." ...>Title</A>
      const aMatch = line.match(/^<DT>\s*<A([^>]*)>(.*?)<\/A>/i);
      if (aMatch) {
        const attrs = aMatch[1] || '';
        const title = unescapeHtml(aMatch[2] || '');
        const linkNode: Node = { type: 'link', title, attrs };
        const parent = stack[stack.length - 1].node;
        parent.children = parent.children || [];
        parent.children.push(linkNode);
        continue;
      }
    }

    return root;
  }

  function flattenBelowSecondLevel(node: Node): Node {
    // 第二层以下的所有链接，扁平到第二层的对应文件夹
    if (!node.children) return node;
    const result: Node = { ...node, children: [] };
    for (const child of node.children) {
      if (child.type === 'folder') {
        const childCopy: Node = { ...child, children: [] };
        const links: Node[] = [];
        const collectLinks = (n: Node) => {
          if (!n.children) return;
          for (const c of n.children) {
            if (c.type === 'link') links.push(c);
            if (c.type === 'folder') collectLinks(c);
          }
        };
        collectLinks(child);
        childCopy.children = links; // 保留顺序
        result.children!.push(childCopy);
      } else {
        result.children!.push(child);
      }
    }
    return result;
  }

  // 构建 nicetab 结构
  const tree = parseTree(html);

  // 处理根层：若有 PERSONAL_TOOLBAR_FOLDER="true" 的 H3，则忽略这一层
  // 在树的第一层 children 查找该标记
  const firstLevel = tree.children || [];
  let startNodes: Node[] = [];

  // 首先处理 PERSONAL_TOOLBAR_FOLDER="true" 的文件夹的子节点
  const toolbarNodes = firstLevel.filter(
    n => n.type === 'folder' && hasPersonalToolbarFlag(n.attrs || ''),
  );

  // 将工具栏层的下级添加到起始节点
  for (const toolbarNode of toolbarNodes) {
    startNodes.push(...(toolbarNode.children || []));
  }

  // 然后添加其他非工具栏的顶层节点
  const otherTopLevelNodes = firstLevel.filter(
    n => !(n.type === 'folder' && hasPersonalToolbarFlag(n.attrs || '')),
  );
  startNodes.push(...otherTopLevelNodes);

  // 根层中既可能有文件夹也可能有直连链接。直连链接需要归到一个默认分类下。
  // 先将第二层以下扁平化
  const flattenedStart: Node[] = startNodes.map(n =>
    n.type === 'folder' ? flattenBelowSecondLevel(n) : n,
  );

  const tagList: TagItem[] = [];
  const rootLooseLinks: Node[] = [];

  for (const node of flattenedStart) {
    if (node.type === 'folder') {
      const tagCreateTime = parseAddDateToCreateTime(node.attrs || '');
      const tagItem: TagItem = {
        tagId: getRandomId(),
        tagName: node.title || UNNAMED_TAG,
        createTime: tagCreateTime || createTime,
        groupList: [],
      };

      // 二级目录为 group
      for (const child of node.children || []) {
        if (child.type === 'folder') {
          const groupCreateTime = parseAddDateToCreateTime(child.attrs || '');
          const groupItem: GroupItem = {
            ...tabListUtils.getInitialTabGroup(),
            groupName: child.title || UNNAMED_GROUP,
            createTime: groupCreateTime || createTime,
            tabList: [],
          };

          for (const link of child.children || []) {
            if (link.type !== 'link') continue;
            const href = parseHref(link.attrs || '');
            if (!href) continue;
            groupItem.tabList.push({
              tabId: getRandomId(),
              title: link.title || href,
              url: href,
            });
          }

          tagItem.groupList.push(groupItem);
        } else if (child.type === 'link') {
          // 若第二层是直连链接，将其放到默认分组里
          const href = parseHref(child.attrs || '');
          if (!href) continue;
          let defaultGroup = tagItem.groupList[tagItem.groupList.length - 1];
          if (!defaultGroup || defaultGroup.groupName !== UNNAMED_GROUP) {
            defaultGroup = {
              ...tabListUtils.getInitialTabGroup(),
              groupName: UNNAMED_GROUP,
              createTime: tagItem.createTime,
              tabList: [],
            };
            tagItem.groupList.push(defaultGroup);
          }
          defaultGroup.tabList.push({
            tabId: getRandomId(),
            title: child.title || href,
            url: href,
          });
        }
      }

      tagList.push(tagItem);
    } else if (node.type === 'link') {
      rootLooseLinks.push(node);
    }
  }

  // 根层若存在直连链接，需创建一个默认分类聚合这些链接
  if (rootLooseLinks.length) {
    const tagItem: TagItem = {
      ...tabListUtils.getInitialTag(),
      tagName: UNNAMED_TAG,
      createTime,
      groupList: [],
    };
    const groupItem: GroupItem = {
      ...tabListUtils.getInitialTabGroup(),
      groupName: UNNAMED_GROUP,
      createTime,
      tabList: [],
    };
    for (const link of rootLooseLinks) {
      const href = parseHref(link.attrs || '');
      if (!href) continue;
      groupItem.tabList.push({
        tabId: getRandomId(),
        title: link.title || href,
        url: href,
      });
    }
    if (groupItem.tabList.length) {
      tagItem.groupList.push(groupItem);
      tagList.unshift(tagItem); // 放前面以便可见
    }
  }

  return tagList;
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
  html2niceTab,
  niceTab2html,
};
