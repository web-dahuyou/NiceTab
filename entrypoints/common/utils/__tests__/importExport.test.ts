import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock tabListUtils before importing the module under test
vi.mock('~/entrypoints/common/storage', () => ({
  tabListUtils: {
    getInitialTabGroup: () => ({
      groupId: '',
      groupName: '',
      createTime: '',
      isStarred: false,
      isLocked: false,
      isExpanded: true,
      tabList: [],
    }),
    getInitialTag: () => ({
      tagId: '',
      tagName: '',
      createTime: '',
      isLocked: false,
      isExpanded: true,
      groupList: [],
    }),
  },
}));

import {
  extContentFormatCheck,
  extContentImporter,
  html2niceTab,
  isNiceTabDataV2,
  niceTab2html,
} from '../importExport';
import mockTabListJson from '~/mock/mock_tabList.json';

// 基于 v1 mock 数据补充 v2 外层结构
const mockTabListV2 = {
  version: 2,
  dataSource: 'nicetab',
  lastSyncTime: '1793333935032',
  data: mockTabListJson,
};
const mockTabListV2Content = JSON.stringify(mockTabListV2);

describe('isNiceTabDataV2', () => {
  it('accepts v2 data with dataSource nicetab', () => {
    expect(isNiceTabDataV2(mockTabListV2)).toBe(true);
  });

  it('rejects objects missing version, dataSource or data', () => {
    expect(isNiceTabDataV2(null)).toBe(false);
    expect(isNiceTabDataV2([])).toBe(false);
    expect(isNiceTabDataV2({ version: 2, data: [] })).toBe(false);
    expect(isNiceTabDataV2({ version: 2, dataSource: 'other', data: [] })).toBe(false);
    expect(isNiceTabDataV2({ version: 2, dataSource: 'nicetab' })).toBe(false);
    expect(isNiceTabDataV2({ version: 1, dataSource: 'nicetab', data: [] })).toBe(false);
  });
});

describe('extContentFormatCheck', () => {
  it('detects niceTab format (array with tagName)', () => {
    const content = JSON.stringify([{ tagName: 'Test', groupList: [] }]);
    expect(extContentFormatCheck(content)).toBe('niceTab');
  });

  it('detects kepTab format (array with tabs array)', () => {
    const content = JSON.stringify([{ title: 'Group', tabs: [] }]);
    expect(extContentFormatCheck(content)).toBe('kepTab');
  });

  it('detects toby format (object with lists)', () => {
    const content = JSON.stringify({ lists: [] });
    expect(extContentFormatCheck(content)).toBe('toby');
  });

  it('detects sessionBuddy format (object with collections)', () => {
    const content = JSON.stringify({ collections: [] });
    expect(extContentFormatCheck(content)).toBe('sessionBuddy');
  });

  it('defaults to oneTab for non-JSON content', () => {
    expect(extContentFormatCheck('https://example.com | Example\n')).toBe('oneTab');
  });

  it('defaults to niceTab for unknown JSON array', () => {
    const content = JSON.stringify([{ unknown: 'data' }]);
    expect(extContentFormatCheck(content)).toBe('niceTab');
  });

  it('detects v2 sync data structure', () => {
    expect(extContentFormatCheck(mockTabListV2Content)).toBe('niceTab');
  });
});

describe('extContentImporter.niceTab', () => {
  const v2Content = mockTabListV2Content;

  it('parses v2 structure and regenerates ids', () => {
    const result = extContentImporter.niceTab(v2Content);
    const allGroups = result.flatMap(tag => tag.groupList);
    const allTabs = allGroups.flatMap(group => group.tabList);

    expect(result).toHaveLength(mockTabListJson.length);
    // 中转站固定为 '0'，其余节点重新生成 ID
    expect(result[0].tagId).toBe('0');
    expect(result[1].tagId).toBeTruthy();
    expect(allGroups.every(group => !!group.groupId)).toBe(true);
    expect(allTabs.every(tab => !!tab.tabId)).toBe(true);
    // 数据内容保持与 mock 文件一致
    expect(result[1].tagName).toBe(mockTabListJson[1].tagName);
    expect(result[1].groupList[0].groupName).toBe(
      mockTabListJson[1].groupList[0].groupName,
    );
  });

  it('parses v1 array and generates ids', () => {
    const result = extContentImporter.niceTab(
      JSON.stringify([
        {
          tagName: 'Category',
          groupList: [{ groupName: 'Group', tabList: [{ url: 'https://example.com' }] }],
        },
      ]),
    );

    expect(result[0].tagId).toBeTruthy();
    expect(result[0].groupList[0].groupId).toBeTruthy();
    expect(result[0].groupList[0].tabList[0].tabId).toBeTruthy();
  });

  it('returns an empty list for unexpected content instead of throwing', () => {
    expect(extContentImporter.niceTab('')).toEqual([]);
    expect(extContentImporter.niceTab('{"version":2}')).toEqual([]);
    expect(extContentImporter.niceTab('{"foo":"bar"}')).toEqual([]);
    // 缺少 dataSource 标识时不按 v2 数据结构解析
    expect(
      extContentImporter.niceTab(JSON.stringify({ version: 2, data: mockTabListJson })),
    ).toEqual([]);
  });
});

describe('niceTab2html', () => {
  it('generates valid Netscape bookmark HTML', () => {
    const tagList = [
      {
        tagId: '1',
        tagName: 'Category',
        createTime: '2024-01-01 00:00:00',
        groupList: [
          {
            groupId: 'g1',
            groupName: 'Group',
            createTime: '2024-01-01 00:00:00',
            isStarred: false,
            isLocked: false,
            isExpanded: true,
            tabList: [{ tabId: 't1', title: 'Example', url: 'https://example.com' }],
          },
        ],
      },
    ];

    const html = niceTab2html(tagList);

    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('Category');
    expect(html).toContain('Group');
    expect(html).toContain('https://example.com');
    expect(html).toContain('Example');
  });

  it('escapes HTML special characters', () => {
    const tagList = [
      {
        tagId: '1',
        tagName: '<script>alert("xss")</script>',
        groupList: [
          {
            groupId: 'g1',
            groupName: 'A & B',
            createTime: '2024-01-01 00:00:00',
            isStarred: false,
            isLocked: false,
            isExpanded: true,
            tabList: [
              { tabId: 't1', title: 'Quote "test"', url: 'https://example.com?a=1&b=2' },
            ],
          },
        ],
      },
    ];

    const html = niceTab2html(tagList);

    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).not.toContain('<script>');
  });

  it('handles empty tagList', () => {
    const html = niceTab2html([]);
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('</DL><p>');
  });

  it('handles tag with no groups', () => {
    const tagList = [{ tagId: '1', tagName: 'Empty', groupList: [] }];
    const html = niceTab2html(tagList);
    expect(html).toContain('Empty');
  });
});

describe('html2niceTab', () => {
  it('parses simple Netscape bookmark HTML', () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1704067200" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Bar</H3>
    <DL><p>
        <DT><H3>My Category</H3>
        <DL><p>
            <DT><H3>My Group</H3>
            <DL><p>
                <DT><A HREF="https://example.com">Example Site</A>
                <DT><A HREF="https://test.com">Test Site</A>
            </DL><p>
        </DL><p>
    </DL><p>
</DL><p>`;

    const result = html2niceTab(html);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const tag = result.find(t => t.tagName === 'My Category');
    expect(tag).toBeDefined();
    expect(tag!.groupList.length).toBeGreaterThanOrEqual(1);
    const group = tag!.groupList.find(g => g.groupName === 'My Group');
    expect(group).toBeDefined();
    expect(group!.tabList).toHaveLength(2);
    expect(group!.tabList[0].url).toBe('https://example.com');
    expect(group!.tabList[0].title).toBe('Example Site');
    expect(group!.tabList[1].url).toBe('https://test.com');
  });

  it('handles PERSONAL_TOOLBAR_FOLDER correctly', () => {
    const html = `<DL><p>
    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">Toolbar</H3>
    <DL><p>
        <DT><H3>Category</H3>
        <DL><p>
            <DT><A HREF="https://example.com">Link</A>
        </DL><p>
    </DL><p>
</DL><p>`;

    const result = html2niceTab(html);
    const tag = result.find(t => t.tagName === 'Category');
    expect(tag).toBeDefined();
  });

  it('handles root-level loose links', () => {
    const html = `<DL><p>
    <DT><A HREF="https://loose.com">Loose Link</A>
</DL><p>`;

    const result = html2niceTab(html);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const allTabs = result.flatMap(t => t.groupList.flatMap(g => g.tabList));
    expect(allTabs.some(t => t.url === 'https://loose.com')).toBe(true);
  });

  it('handles empty HTML', () => {
    const result = html2niceTab('');
    expect(result).toEqual([]);
  });

  it('unescape HTML entities in titles', () => {
    const html = `<DL><p>
    <DT><H3>Test</H3>
    <DL><p>
        <DT><A HREF="https://example.com">A &amp; B &lt; C</A>
    </DL><p>
</DL><p>`;

    const result = html2niceTab(html);
    const tag = result.find(t => t.tagName === 'Test');
    expect(tag).toBeDefined();
    expect(tag!.groupList[0].tabList[0].title).toBe('A & B < C');
  });
});
