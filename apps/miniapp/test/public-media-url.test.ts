import { describe, expect, it } from 'vitest';
import { resolvePublicMediaUrl } from '../src/public-media-url.js';

describe('public media URL', () => {
  it('resolves object keys only against the configured media host', () => {
    expect(resolvePublicMediaUrl('/products/舟曲/cover.webp', 'https://media.example.com/'))
      .toBe('https://media.example.com/products/%E8%88%9F%E6%9B%B2/cover.webp');
  });

  it('does not load unconfigured or externally supplied image URLs', () => {
    expect(resolvePublicMediaUrl('products/cover.webp', '')).toBe('');
    expect(resolvePublicMediaUrl('https://demo.example/image.webp', 'https://media.example.com')).toBe('');
    expect(resolvePublicMediaUrl('../private.webp', 'https://media.example.com')).toBe('');
  });
});
