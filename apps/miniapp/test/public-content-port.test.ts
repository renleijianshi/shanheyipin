import { describe, expect, it } from 'vitest';
import { createPublicContentPort } from '../src/public-content-port.js';
import type { PublicApiGet } from '../src/public-api-client.js';

describe('public content port', () => {
  it('reads the published feed and a story detail through the configured public API', async () => {
    const calls: string[] = [];
    const get: PublicApiGet = async <T>(path: string) => {
      calls.push(path);
      return (path.endsWith('/stories') ? [] : { id: 'public-story-id', body: '正文' }) as T;
    };
    const content = createPublicContentPort(get);
    await expect(content.listStories()).resolves.toEqual([]);
    await expect(content.getStory('public story/id')).resolves.toMatchObject({ body: '正文' });
    expect(calls).toEqual(['/api/v1/stories', '/api/v1/stories/public%20story%2Fid']);
  });
});
