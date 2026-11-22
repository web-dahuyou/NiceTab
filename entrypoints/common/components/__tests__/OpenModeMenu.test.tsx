// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, expect, it, vi } from 'vitest';
import { OpenModeMenu } from '../OpenModeMenu';

const messages = {
  'common.open': 'Open',
  'home.treeNodeBatch.open.current': 'Current window',
  'home.treeNodeBatch.open.newWindow': 'New window',
  'home.treeNodeBatch.open.incognito': 'Incognito window',
};

afterEach(cleanup);

it.each([
  ['Current window', 'current'],
  ['New window', 'newWindow'],
  ['Incognito window', 'incognito'],
])('点击 %s 只触发对应打开方式，不冒泡选择所在行', async (label, mode) => {
  const open = vi.fn();
  const selectRow = vi.fn();
  render(
    <IntlProvider locale="en-US" messages={messages}>
      <div onClick={selectRow}>
        <OpenModeMenu onOpen={open}>Icon</OpenModeMenu>
      </div>
    </IntlProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: label }));

  expect(open).toHaveBeenCalledTimes(1);
  expect(open).toHaveBeenCalledWith(mode);
  expect(selectRow).not.toHaveBeenCalled();
});

it('禁用时无法发起打开操作', () => {
  const open = vi.fn();
  render(
    <IntlProvider locale="en-US" messages={messages}>
      <OpenModeMenu onOpen={open} disabled>
        Icon
      </OpenModeMenu>
    </IntlProvider>,
  );
  const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Open' });
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(screen.queryByRole('menuitem')).toBeNull();
  expect(open).not.toHaveBeenCalled();
});
