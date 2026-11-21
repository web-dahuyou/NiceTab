// @vitest-environment happy-dom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { getFaviconUrl, getInitialFaviconUrl } from '~/entrypoints/common/utils/favicon';
import Favicon from '../Favicon';

vi.mock('~/entrypoints/common/utils/favicon', async importOriginal => ({
  ...(await importOriginal<typeof import('~/entrypoints/common/utils/favicon')>()),
  getInitialFaviconUrl: vi.fn(),
  getFaviconUrl: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('已跳过的原图和随后失效的回退图都排除，换了新地址后重新展示原图', async () => {
  const page = 'https://site.test/page';
  const original = 'https://site.test/old.png';
  const cached = 'https://cdn.test/cached.png';
  const alternate = 'https://cdn.test/alternate.png';
  const updated = 'https://site.test/new.png';
  vi.mocked(getInitialFaviconUrl)
    .mockResolvedValueOnce(cached)
    .mockResolvedValueOnce(updated);
  vi.mocked(getFaviconUrl).mockResolvedValue(alternate);
  const view = render(<Favicon pageUrl={page} favIconUrl={original} />);
  const image = () => view.container.querySelector('img.img-favicon');
  await waitFor(() => expect(image()?.getAttribute('src')).toBe(cached));
  fireEvent.error(image()!);
  await waitFor(() => expect(image()?.getAttribute('src')).toBe(alternate));
  expect(getFaviconUrl).toHaveBeenCalledWith(page, 32, [original, cached], original);
  view.rerender(<Favicon pageUrl={page} favIconUrl={updated} />);
  await waitFor(() => expect(image()?.getAttribute('src')).toBe(updated));
  fireEvent.error(image()!);
  await waitFor(() => expect(image()?.getAttribute('src')).toBe(alternate));
  expect(getFaviconUrl).toHaveBeenLastCalledWith(page, 32, [updated], undefined);
});

it('探测返回的兜底图自身加载失败时结束加载，不再探测', async () => {
  const fallback = browser.runtime.getURL('/icon/favicon-default.png');
  vi.mocked(getFaviconUrl).mockResolvedValue(fallback);
  const { container } = render(<Favicon pageUrl="https://site.test/page" />);
  const image = await waitFor(() => {
    const element = container.querySelector('img.img-favicon');
    expect(element?.getAttribute('src')).toBe(fallback);
    return element!;
  });
  fireEvent.error(image);
  expect(getFaviconUrl).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.img-loading')).toBeNull();
});

export default {};
