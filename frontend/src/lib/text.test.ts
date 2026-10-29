import { describe, expect, it } from 'vitest';
import { charCount, checkText, pluralize } from './text';

describe('text rules', () => {
  it('counts code points after trimming, like the server', () => {
    expect(charCount('  hello  ')).toBe(5);
    expect(charCount('😀😀')).toBe(2);
    expect(charCount('\n\t ')).toBe(0);
  });

  it('flags empty and too-long text', () => {
    expect(checkText('   ', 500)).toMatchObject({ isEmpty: true, isValid: false });
    expect(checkText('a'.repeat(500), 500).isValid).toBe(true);
    expect(checkText('a'.repeat(501), 500)).toMatchObject({ isTooLong: true, isValid: false });
    expect(checkText(`  ${'a'.repeat(500)}  `, 500).isValid).toBe(true);
    expect(checkText('😀'.repeat(300), 300).isValid).toBe(true);
  });

  it('pluralizes', () => {
    expect(pluralize(0, 'like')).toBe('0 likes');
    expect(pluralize(1, 'like')).toBe('1 like');
    expect(pluralize(2, 'like')).toBe('2 likes');
  });
});
