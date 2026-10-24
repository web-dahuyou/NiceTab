// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import type { Runtime } from 'wxt/browser';
import SendTargetActionHolder from '../SendTargetActionHolder';
import { ContentGlobalContext } from '~/entrypoints/content/context';

vi.mock('~/entrypoints/options/home/SendTargetModal', () => ({
  default: () => null,
}));

vi.mock('~/entrypoints/common/utils', () => ({
  sendRuntimeMessage: vi.fn(),
}));

let rootWrapper: HTMLDivElement;

beforeEach(() => {
  fakeBrowser.reset();
  rootWrapper = document.createElement('div');
  document.body.appendChild(rootWrapper);
});

afterEach(() => {
  cleanup();
  rootWrapper.remove();
  document.querySelectorAll('[class*="ant-message"]').forEach(node => node.remove());
});

async function dispatchCallbackMessage(content: string) {
  await act(async () => {
    await fakeBrowser.runtime.onMessage.trigger(
      {
        msgType: 'action:callback-message',
        data: { type: 'success', content },
      },
      {} as Runtime.MessageSender,
    );
    // 等待 antd message 完成一次渲染
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('SendTargetActionHolder 消息提示挂载位置', () => {
  it('content script 中 action:callback-message 提示渲染在 shadow root 容器内', async () => {
    render(
      <ContentGlobalContext.Provider value={{ rootWrapper }}>
        <SendTargetActionHolder pageContext="contentScriptPage" />
      </ContentGlobalContext.Provider>,
    );

    await dispatchCallbackMessage('发送成功');

    const notice = rootWrapper.querySelector('[class*="message-notice"]');
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain('发送成功');
  });

  it('管理后台页面中 action:callback-message 提示仍渲染到 document.body', async () => {
    render(<SendTargetActionHolder pageContext="optionsPage" />);

    await dispatchCallbackMessage('发送成功');

    const notice = document.body.querySelector('[class*="message-notice"]');
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain('发送成功');
    expect(rootWrapper.querySelector('[class*="message-notice"]')).toBeNull();
  });
});
