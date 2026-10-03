import { describe, it, expect } from 'vitest';
import {
  handleUrlWidthParams,
  getUrlParams,
  setUrlParams,
  objectToUrlParams,
  getOrigin,
  getBaseDomain,
  isDomainAllowed,
  isSameUrl,
  isContentMatched,
  isUrl,
} from '../url';

describe('handleUrlWidthParams', () => {
  it('appends params to URL without existing params', () => {
    const result = handleUrlWidthParams('https://example.com', { a: '1', b: '2' });
    expect(result).toContain('a=1');
    expect(result).toContain('b=2');
  });

  it('preserves existing params and appends new ones', () => {
    const result = handleUrlWidthParams('https://example.com?x=1', { a: '2' });
    const url = new URL(result);
    expect(url.searchParams.get('x')).toBe('1');
    expect(url.searchParams.get('a')).toBe('2');
  });

  it('does not overwrite existing params', () => {
    const result = handleUrlWidthParams('https://example.com?a=1', { a: '2' });
    const url = new URL(result);
    expect(url.searchParams.get('a')).toBe('1');
  });

  it('handles empty params', () => {
    const result = handleUrlWidthParams('https://example.com?x=1', {});
    expect(result).toBe('https://example.com/?x=1');
  });
});

describe('getUrlParams', () => {
  it('parses URL params', () => {
    expect(getUrlParams('https://example.com?a=1&b=2')).toEqual({ a: '1', b: '2' });
  });

  it('handles URL without params', () => {
    expect(getUrlParams('https://example.com')).toEqual({});
  });

  it('handles encoded values', () => {
    const params = getUrlParams('https://example.com?q=hello%20world');
    expect(params.q).toBe('hello world');
  });

  it('handles empty value', () => {
    const params = getUrlParams('https://example.com?key=');
    expect(params.key).toBe('');
  });
});

describe('setUrlParams', () => {
  it('sets params on URL', () => {
    const result = setUrlParams('https://example.com', { a: '1' });
    expect(result).toContain('a=1');
  });

  it('merges with existing params', () => {
    const result = setUrlParams('https://example.com?x=1', { a: '2' });
    const url = new URL(result);
    expect(url.searchParams.get('x')).toBe('1');
    expect(url.searchParams.get('a')).toBe('2');
  });

  it('overwrites existing params with same key', () => {
    const result = setUrlParams('https://example.com?a=1', { a: '2' });
    const url = new URL(result);
    expect(url.searchParams.get('a')).toBe('2');
  });
});

describe('objectToUrlParams', () => {
  it('converts object to URL params string', () => {
    expect(objectToUrlParams({ a: '1', b: '2' })).toBe('a=1&b=2');
  });

  it('skips empty values', () => {
    expect(objectToUrlParams({ a: '1', b: '', c: '3' })).toBe('a=1&c=3');
  });

  it('handles empty object', () => {
    expect(objectToUrlParams({})).toBe('');
  });
});

describe('getOrigin', () => {
  it('extracts origin from full URL', () => {
    expect(getOrigin('https://example.com/path?q=1')).toBe('https://example.com');
  });

  it('returns input for invalid URL', () => {
    expect(getOrigin('not-a-url')).toBe('not-a-url');
  });
});

describe('getBaseDomain', () => {
  it('extracts domain from URL', () => {
    expect(getBaseDomain('https://www.example.com/path')).toBe('www.example.com');
  });

  it('removes port number', () => {
    expect(getBaseDomain('https://example.com:8080/path')).toBe('example.com');
  });

  it('handles protocol-relative URL', () => {
    expect(getBaseDomain('//example.com/path')).toBe('example.com');
  });

  it('handles URL without protocol', () => {
    expect(getBaseDomain('example.com/path')).toBe('example.com');
  });

  it('returns "undefined" for empty input', () => {
    expect(getBaseDomain('')).toBe('undefined');
  });
});

describe('isDomainAllowed', () => {
  it('returns true when exclude string is empty', () => {
    expect(isDomainAllowed('https://example.com', '')).toBe(true);
  });

  it('returns true when url is undefined', () => {
    expect(isDomainAllowed(undefined, 'example.com')).toBe(true);
  });

  it('returns false for excluded domain', () => {
    expect(isDomainAllowed('https://example.com/page', 'example.com')).toBe(false);
  });

  it('returns true for non-excluded domain', () => {
    expect(isDomainAllowed('https://other.com', 'example.com')).toBe(true);
  });

  it('handles multiple exclude domains separated by space', () => {
    expect(isDomainAllowed('https://b.com', 'a.com b.com c.com')).toBe(false);
  });

  it('handles newline-separated exclude domains', () => {
    expect(isDomainAllowed('https://b.com', 'a.com\nb.com\nc.com')).toBe(false);
  });

  it('supports regex patterns', () => {
    expect(isDomainAllowed('https://test.example.com', '.*\\.example\\.com')).toBe(false);
  });

  it('supports wildcard patterns', () => {
    expect(isDomainAllowed('https://test.example.com', '*.example.com')).toBe(false);
  });
});

describe('isSameUrl', () => {
  it('returns true for identical URLs', () => {
    expect(isSameUrl('https://example.com', 'https://example.com')).toBe(true);
  });

  it('returns true for same URL with different param order', () => {
    expect(isSameUrl('https://example.com?a=1&b=2', 'https://example.com?b=2&a=1')).toBe(true);
  });

  it('returns false for different URLs', () => {
    expect(isSameUrl('https://example.com', 'https://other.com')).toBe(false);
  });

  it('returns false for different params', () => {
    expect(isSameUrl('https://example.com?a=1', 'https://example.com?a=2')).toBe(false);
  });

  it('returns false for different param count', () => {
    expect(isSameUrl('https://example.com?a=1', 'https://example.com?a=1&b=2')).toBe(false);
  });

  it('handles non-standard protocols', () => {
    expect(isSameUrl('about:blank', 'about:blank')).toBe(true);
  });

  it('returns true for same string without protocol', () => {
    expect(isSameUrl('example.com', 'example.com')).toBe(true);
  });
});

describe('isContentMatched', () => {
  it('matches with equal mode', () => {
    expect(isContentMatched('https://example.com', 'https://example.com', 'equal')).toBe(true);
  });

  it('matches with startsWith mode', () => {
    expect(isContentMatched('https://example.com/path', 'https://example.com', 'startsWith')).toBe(true);
  });

  it('matches with endsWith mode', () => {
    expect(isContentMatched('https://example.com/page.html', '.html', 'endsWith')).toBe(true);
  });

  it('matches with contains mode', () => {
    expect(isContentMatched('https://example.com/path', 'example', 'contains')).toBe(true);
  });

  it('matches with regex mode', () => {
    expect(isContentMatched('https://example.com', '^https://example\\.com$', 'regex')).toBe(true);
  });

  it('matches with wildcard mode', () => {
    expect(isContentMatched('https://example.com/path', 'https://example.com/*', 'wildcard')).toBe(true);
  });

  it('returns false for non-matching regex', () => {
    expect(isContentMatched('https://other.com', '^https://example\\.com$', 'regex')).toBe(false);
  });

  it('returns false for invalid regex', () => {
    expect(isContentMatched('https://example.com', '[invalid', 'regex')).toBe(false);
  });

  it('defaults to equal mode', () => {
    expect(isContentMatched('https://example.com', 'https://example.com')).toBe(true);
  });

  it('returns false for unknown mode', () => {
    expect(isContentMatched('https://example.com', 'https://example.com', 'unknown' as any)).toBe(false);
  });
});

describe('isUrl', () => {
  it('returns true for valid URL', () => {
    expect(isUrl('https://example.com')).toBe(true);
  });

  it('returns true for URL without protocol (auto-prepends https)', () => {
    expect(isUrl('example.com')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isUrl('')).toBe(false);
  });

  it('returns true for http URL', () => {
    expect(isUrl('http://example.com')).toBe(true);
  });

  it('returns true for URL with path', () => {
    expect(isUrl('https://example.com/path/to/page')).toBe(true);
  });
});