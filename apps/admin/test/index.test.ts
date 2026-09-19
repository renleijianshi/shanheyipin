import { describe, expect, it } from 'vitest';
import { adminManifest } from '../src/index.js';

describe('admin bootstrap', () => {
  it('exposes an admin application manifest', () => {
    expect(adminManifest.kind).toBe('admin');
    expect(adminManifest.status).toBe('bootstrap');
  });
});
