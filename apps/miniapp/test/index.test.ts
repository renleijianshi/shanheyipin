import { describe, expect, it } from 'vitest';
import { miniappManifest } from '../src/index.js';

describe('miniapp bootstrap', () => {
  it('exposes a miniapp application manifest', () => {
    expect(miniappManifest.kind).toBe('miniapp');
    expect(miniappManifest.status).toBe('bootstrap');
  });
});
