import type { ContentPort, StoryDetail, StorySummary } from './v12-ports.js';
import { publicApiGet, type PublicApiGet } from './public-api-client.js';

export function createPublicContentPort(get: PublicApiGet = publicApiGet): ContentPort {
  return {
    listStories: () => get<readonly StorySummary[]>('/api/v1/stories'),
    getStory: publicId => get<StoryDetail>(`/api/v1/stories/${encodeURIComponent(publicId)}`)
  };
}
