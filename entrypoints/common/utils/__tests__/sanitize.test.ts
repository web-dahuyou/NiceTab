import { describe, it, expect } from 'vitest';
import {
  filterEmoji,
  filter4ByteChars,
  filterMySQLSpecialChars,
  sanitizeContent,
} from '../sanitize';

describe('filterEmoji', () => {
  it('removes emoji characters', () => {
    expect(filterEmoji('hello 😀 world')).toBe('hello  world');
  });

  it('removes multiple emoji', () => {
    expect(filterEmoji('🎉🎊🎈')).toBe('');
  });

  it('keeps non-emoji text unchanged', () => {
    expect(filterEmoji('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(filterEmoji('')).toBe('');
  });

  it('handles null/undefined input', () => {
    expect(filterEmoji(null as any)).toBe(null);
    expect(filterEmoji(undefined as any)).toBe(undefined);
  });

  it('uses custom replacement', () => {
    expect(filterEmoji('hello 😀', '*')).toBe('hello *');
  });
});

describe('filter4ByteChars', () => {
  it('removes 4-byte UTF-8 characters', () => {
    // 𝄞 is a 4-byte character (U+1D11E)
    expect(filter4ByteChars('hello 𝄞 world')).toBe('hello  world');
  });

  it('keeps normal characters', () => {
    expect(filter4ByteChars('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(filter4ByteChars('')).toBe('');
  });

  it('handles null/undefined input', () => {
    expect(filter4ByteChars(null as any)).toBe(null);
    expect(filter4ByteChars(undefined as any)).toBe(undefined);
  });

  it('uses custom replacement', () => {
    expect(filter4ByteChars('hello 𝄞', '?')).toBe('hello ?');
  });
});

describe('filterMySQLSpecialChars', () => {
  it('removes NULL byte', () => {
    expect(filterMySQLSpecialChars('hello\x00world')).toBe('helloworld');
  });

  it('removes control characters', () => {
    expect(filterMySQLSpecialChars('hello\x01\x02\x03world')).toBe('helloworld');
  });

  it('keeps normal characters', () => {
    expect(filterMySQLSpecialChars('hello world!@#$%')).toBe('hello world!@#$%');
  });

  it('handles empty string', () => {
    expect(filterMySQLSpecialChars('')).toBe('');
  });

  it('handles null/undefined input', () => {
    expect(filterMySQLSpecialChars(null as any)).toBe(null);
    expect(filterMySQLSpecialChars(undefined as any)).toBe(undefined);
  });
});

describe('sanitizeContent', () => {
  it('combines all filters', () => {
    const input = 'hello 😀\x00world';
    const result = sanitizeContent(input);
    expect(result).not.toContain('😀');
    expect(result).not.toContain('\x00');
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });

  it('handles empty string', () => {
    expect(sanitizeContent('')).toBe('');
  });

  it('handles null/undefined input', () => {
    expect(sanitizeContent(null as any)).toBe(null);
    expect(sanitizeContent(undefined as any)).toBe(undefined);
  });

  it('keeps clean text unchanged', () => {
    expect(sanitizeContent('hello world 123')).toBe('hello world 123');
  });
});
