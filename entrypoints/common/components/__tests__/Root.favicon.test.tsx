// @vitest-environment happy-dom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import type { Runtime } from 'wxt/browser';
import type { RuntimeMessageEventProps } from '~/entrypoints/types';
import { getFavicon } from '~/entrypoints/common/utils/faviconDb';
import Favicon from '../Favicon';
import Root from '../Root';

vi.mock('~/entrypoints/common/utils/faviconDb', async importOriginal => ({
  ...(await importOriginal<typeof import('~/entrypoints/common/utils/faviconDb')>()),
  getFavicon: vi.fn(),
  getOriginsWithFailedIcons: async () => new Set(),
  pruneFavicons: vi.fn(),
}));
vi.mock('~/entrypoints/common/tabs', () => ({ updateAdminPageUrlDebounced: vi.fn() }));
vi.mock('~/entrypoints/common/storage', () => ({
  settingsUtils: {
    initialSettings: {},
    getSettings: async () => ({}),
    setSettings: vi.fn(),
  },
  themeUtils: { getThemeData: async () => ({}) },
  initThemeStorageListener: () => () => {},
  initSettingsStorageListener: () => () => {},
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('已打开的新标签页通过 Root 接收管理页的广播，下次挂载显示替代图', async () => {
  vi.spyOn(browser.runtime, 'getManifest').mockReturnValue({
    manifest_version: 3,
    name: 'NiceTab',
    version: '1.0.0',
  });
  const origin = 'https://root-route.test';
  const supplied = origin + '/original.png';
  const fallback = origin + '/fallback.png';
  const page = (key: number) => (
    <Root pageContext="newtabPage">
      <Favicon key={key} pageUrl={origin} favIconUrl={supplied} />
    </Root>
  );
  const view = render(page(0));
  const expectImage = (url: string) =>
    waitFor(() =>
      expect(view.container.querySelector('.img-favicon')?.getAttribute('src')).toBe(url),
    );
  await expectImage(supplied);

  const now = Date.now();
  vi.mocked(getFavicon).mockResolvedValue({
    origin,
    url: fallback,
    source: 'ico',
    timestamp: now,
    failedIcons: [[supplied, now + 60_000]],
  });
  const notification = {
    msgType: 'faviconFailuresChanged',
    data: { origin },
  } satisfies RuntimeMessageEventProps;
  const sender: Runtime.MessageSender = { url: browser.runtime.getURL('/options.html') };
  await fakeBrowser.runtime.onMessage.trigger(
    { ...notification, targetPageContext: 'popupPage' },
    sender,
  );
  view.rerender(page(1));
  await expectImage(supplied);
  expect(getFavicon).not.toHaveBeenCalled();

  await fakeBrowser.runtime.onMessage.trigger(notification, sender);
  view.rerender(page(2));
  await expectImage(fallback);
});

export default {};
