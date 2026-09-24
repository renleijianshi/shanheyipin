import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalMediaStore } from '../src/modules/catalog/local-media-store.js';

const directories: string[] = [];
afterEach(async () => { for (const dir of directories.splice(0)) await rm(dir, { recursive: true, force: true }); });
async function store() { const root = await mkdtemp(join(tmpdir(), 'shanhe-media-')); directories.push(root); return new LocalMediaStore(root); }
describe('local media storage', () => {
  it('persists accepted image bytes behind a unique portable key', async () => {
    const media = await store();
    const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGx0AAAAASUVORK5CYII=', 'base64');
    const first = await media.upload(bytes.toString('base64'));
    const second = await media.upload(bytes.toString('base64'));
    expect(first.objectKey).not.toBe(second.objectKey);
    expect(await media.read(first.objectKey)).toEqual({ data: bytes, contentType: 'image/png' });
  });
  it('rejects executable or oversized content and never reads traversal paths', async () => {
    const media = await store();
    await expect(media.upload(Buffer.from('<svg onload="alert(1)"/>').toString('base64'))).rejects.toThrow('Invalid image format');
    await expect(media.upload('a'.repeat(7_000_000))).rejects.toThrow('Invalid image');
    expect(await media.read('products/../../secret.png')).toBeNull();
    expect(await media.read('products/absent.png')).toBeNull();
  });
});
