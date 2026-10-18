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

import { extContentFormatCheck, html2niceTab, niceTab2html } from '../importExport';

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
