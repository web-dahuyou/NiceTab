import { describe, it, expect } from 'vitest';
import { resolveLanguage } from '../constants';

describe('resolveLanguage', () => {
  it('returns exact match for zh-CN', () => {
    expect(resolveLanguage('zh-CN')).toBe('zh-CN');
  });

  it('returns exact match for en-US', () => {
    expect(resolveLanguage('en-US')).toBe('en-US');
  });

  it('returns exact match for ru-RU', () => {
    expect(resolveLanguage('ru-RU')).toBe('ru-RU');
  });

  it('returns exact match for zh-TW', () => {
    expect(resolveLanguage('zh-TW')).toBe('zh-TW');
  });

  it('handles case insensitivity', () => {
    expect(resolveLanguage('zh-cn')).toBe('zh-CN');
    expect(resolveLanguage('EN-US')).toBe('en-US');
  });

  it('maps zh-HK to zh-TW (Traditional Chinese)', () => {
    expect(resolveLanguage('zh-HK')).toBe('zh-TW');
  });

  it('maps zh-MO to zh-TW (Traditional Chinese)', () => {
    expect(resolveLanguage('zh-MO')).toBe('zh-TW');
  });

  it('maps zh-Hant to zh-TW (Traditional Chinese)', () => {
    expect(resolveLanguage('zh-Hant')).toBe('zh-TW');
  });

  it('maps bare "zh" to zh-CN', () => {
    expect(resolveLanguage('zh')).toBe('zh-CN');
  });

  it('maps bare "en" to en-US', () => {
    expect(resolveLanguage('en')).toBe('en-US');
  });

  it('maps bare "ru" to ru-RU', () => {
    expect(resolveLanguage('ru')).toBe('ru-RU');
  });

  it('returns default (en-US) for unknown language', () => {
    expect(resolveLanguage('fr-FR')).toBe('en-US');
  });

  it('returns default (en-US) for undefined', () => {
    expect(resolveLanguage(undefined)).toBe('en-US');
  });

  it('returns default (en-US) for empty string', () => {
    expect(resolveLanguage('')).toBe('en-US');
  });
});