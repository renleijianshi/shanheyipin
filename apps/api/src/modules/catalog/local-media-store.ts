import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const KEY = /^products\/[A-Za-z0-9/_-]+\.(png|jpg|jpeg|webp)$/;
const mimeTypes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

/** Local disk adapter; enable only with an explicit directory. Object keys remain portable to OSS. */
export class LocalMediaStore {
  private readonly root: string;
  constructor(root: string) { this.root = resolve(root); }

  async upload(base64: string): Promise<{ objectKey: string }> {
    if (!base64 || base64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
      throw new Error('Invalid image: choose a PNG, JPEG or WebP smaller than 5 MB');
    }
    const data = Buffer.from(base64, 'base64');
    if (!data.length || data.length > MAX_IMAGE_BYTES || data.toString('base64') !== base64) throw new Error('Invalid image encoding');
    const extension = data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
      : data[0] === 255 && data[1] === 216 && data[2] === 255 ? 'jpg'
      : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
    if (!extension) throw new Error('Invalid image format: PNG, JPEG and WebP only');
    const objectKey = `products/uploads/${randomUUID()}.${extension}`;
    await mkdir(join(this.root, 'products/uploads'), { recursive: true });
    await writeFile(join(this.root, objectKey), data, { flag: 'wx' });
    return { objectKey };
  }

  async read(objectKey: string): Promise<{ data: Buffer; contentType: string } | null> {
    const match = KEY.exec(objectKey);
    if (!match) return null;
    try { return { data: await readFile(join(this.root, objectKey)), contentType: mimeTypes[match[1]!]! }; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  }
}
