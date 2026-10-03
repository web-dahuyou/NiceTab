import { describe, it, expect, vi } from 'vitest';
import {
  classNames,
  capitalize,
  toKebabCase,
  toCamelCase,
  getRandomId,
  pick,
  omit,
  groupBySize,
  getUniqueList,
  getMergedList,
  withTimeout,
} from '../common';

describe('classNames', () => {
  it('joins multiple class names', () => {
    expect(classNames('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(classNames('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy args', () => {
    expect(classNames(false, null, undefined)).toBe('');
  });

  it('handles single class name', () => {
    expect(classNames('only')).toBe('only');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles single char', () => {
    expect(capitalize('a')).toBe('A');
  });
});

describe('toKebabCase', () => {
  it('converts camelCase to kebab-case', () => {
    expect(toKebabCase('fontSize')).toBe('font-size');
  });

  it('converts PascalCase to kebab-case (first char not hyphenated due to \\B)', () => {
    expect(toKebabCase('FontSize')).toBe('font-size');
  });

  it('handles empty string', () => {
    expect(toKebabCase('')).toBe('');
  });

  it('handles no uppercase', () => {
    expect(toKebabCase('font')).toBe('font');
  });

  it('handles multiple uppercase', () => {
    expect(toKebabCase('backgroundColor')).toBe('background-color');
  });

  it('handles undefined input', () => {
    expect(toKebabCase()).toBe('');
  });
});

describe('toCamelCase', () => {
  it('converts kebab-case to camelCase', () => {
    expect(toCamelCase('font-size')).toBe('fontSize');
  });

  it('handles single word', () => {
    expect(toCamelCase('font')).toBe('font');
  });

  it('handles multiple hyphens', () => {
    expect(toCamelCase('background-color-size')).toBe('backgroundColorSize');
  });
});

describe('getRandomId', () => {
  it('generates id of specified length', () => {
    expect(getRandomId(8)).toHaveLength(8);
    expect(getRandomId(16)).toHaveLength(16);
  });

  it('generates hex string by default', () => {
    const id = getRandomId(100);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });

  it('generates numeric string when isPlainNumber is true', () => {
    const id = getRandomId(100, true);
    expect(id).toMatch(/^[0-9]+$/);
  });

  it('generates different ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => getRandomId(16)));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('pick', () => {
  it('picks specified keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('ignores non-existent keys', () => {
    expect(pick({ a: 1 }, ['a', 'b' as any])).toEqual({ a: 1 });
  });

  it('returns empty object for empty keys', () => {
    expect(pick({ a: 1 }, [])).toEqual({});
  });
});

describe('omit', () => {
  it('omits specified keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('returns same object for empty keys', () => {
    expect(omit({ a: 1, b: 2 }, [])).toEqual({ a: 1, b: 2 });
  });

  it('omits multiple keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ b: 2 });
  });
});

describe('groupBySize', () => {
  it('splits array into groups of specified size', () => {
    expect(groupBySize([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles exact division', () => {
    expect(groupBySize([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('handles size larger than array', () => {
    expect(groupBySize([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('handles empty array', () => {
    expect(groupBySize([], 3)).toEqual([]);
  });

  it('defaults to size 3', () => {
    expect(groupBySize([1, 2, 3, 4, 5, 6, 7])).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });
});

describe('getUniqueList', () => {
  it('deduplicates by key', () => {
    const list = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ];
    expect(getUniqueList(list, 'id')).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
  });

  it('keeps first occurrence', () => {
    const list = [
      { id: 1, name: 'first' },
      { id: 1, name: 'second' },
    ];
    expect(getUniqueList(list, 'id')[0].name).toBe('first');
  });

  it('handles empty list', () => {
    expect(getUniqueList([], 'id')).toEqual([]);
  });
});

describe('getMergedList', () => {
  it('merges duplicate items using handler', () => {
    const list = [
      { id: 1, count: 1 },
      { id: 2, count: 3 },
      { id: 1, count: 5 },
    ];
    const result = getMergedList(list, 'id', (prev, curr) => ({
      ...prev,
      count: prev.count + curr.count,
    }));
    expect(result).toEqual([
      { id: 1, count: 6 },
      { id: 2, count: 3 },
    ]);
  });

  it('handles no duplicates', () => {
    const list = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    const result = getMergedList(list, 'id', (prev, curr) => prev);
    expect(result).toHaveLength(2);
  });

  it('handles empty list', () => {
    expect(getMergedList([], 'id', (prev, curr) => prev)).toEqual([]);
  });
});

describe('withTimeout', () => {
  it('resolves when promise resolves before timeout', async () => {
    const promise = Promise.resolve('ok');
    const result = await withTimeout(promise, 1000);
    expect(result).toBe('ok');
  });

  it('rejects when promise takes too long', async () => {
    const promise = new Promise(resolve => setTimeout(() => resolve('late'), 200));
    await expect(withTimeout(promise, 50)).rejects.toThrow('ERROR:FETCH_TIMEOUT');
  });

  it('uses default timeout of 5000ms', async () => {
    const promise = Promise.resolve('fast');
    const result = await withTimeout(promise);
    expect(result).toBe('fast');
  });
});