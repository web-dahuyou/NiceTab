import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOSInfo, getKeysByOS } from '../os';

describe('getOSInfo', () => {
  function setUserAgent(ua: string) {
    vi.stubGlobal('navigator', { userAgent: ua });
  }

  it('detects Windows', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    const info = getOSInfo();
    expect(info.isWin).toBe(true);
    expect(info.isMac).toBe(false);
  });

  it('detects macOS', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    const info = getOSInfo();
    expect(info.isMac).toBe(true);
    expect(info.isWin).toBe(false);
  });

  it('detects Linux', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    const info = getOSInfo();
    expect(info.isLinux).toBe(true);
    expect(info.isWin).toBe(false);
    expect(info.isMac).toBe(false);
  });

  it('detects Unix', () => {
    setUserAgent('Mozilla/5.0 (X11; Unix; rv:100.0)');
    const info = getOSInfo();
    expect(info.isUnix).toBe(true);
  });
});

describe('getKeysByOS', () => {
  function setUserAgent(ua: string) {
    vi.stubGlobal('navigator', { userAgent: ua });
  }

  it('returns Mac symbols on macOS', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    const keys = getKeysByOS();
    expect(keys.command.symbol).toBe('⌘');
    expect(keys.option.symbol).toBe('⌥');
    expect(keys.control.symbol).toBe('⌃');
  });

  it('returns Windows symbols on non-Mac', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    const keys = getKeysByOS();
    expect(keys.command.symbol).toBe('Ctrl');
    expect(keys.alt.symbol).toBe('Alt');
  });

  it('always returns arrow symbols', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0)');
    const keys = getKeysByOS();
    expect(keys.up.symbol).toBe('↑');
    expect(keys.down.symbol).toBe('↓');
    expect(keys.left.symbol).toBe('←');
    expect(keys.right.symbol).toBe('→');
  });

  it('returns platform-specific shift symbol', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0)');
    const keys = getKeysByOS();
    expect(keys.shift.symbol).toBe('Shift');

    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    const macKeys = getKeysByOS();
    expect(macKeys.shift.symbol).toBe('⇧');
  });
});
