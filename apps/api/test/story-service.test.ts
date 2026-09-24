import { describe, expect, it } from 'vitest';
import { AdminStoryService, type Story, type StoryInput, type StoryRepository } from '../src/modules/content/story-service.js';

const draft: StoryInput = {
  contentType: 'ORIGIN', title: '舟曲风物（内部测试）', summary: '用于后台和小程序联调的测试内容。',
  body: '这是一篇明确标注为内测的示例文章。图片为 AI 生成示意图，不代表实拍。',
  coverObjectKey: 'products/internal-test/orchard.png', relatedProductPublicId: null, sortOrder: 0
};

function repository(): StoryRepository {
  let current: Story | null = null;
  let nextId = 1;
  return {
    create: async input => { current = { id: String(nextId++), publicId: '6ed7300a-f580-49ef-a844-a5f0c58b44aa', ...input, status: 'DRAFT', publishedAt: null, relatedProduct: null }; return current; },
    update: async (id, input) => { if (!current || current.id !== id) throw new Error('Story not found'); current = { ...current, ...input }; return current; },
    findById: async id => current?.id === id ? current : null,
    listAdmin: async () => ({ items: current ? [current] : [], total: current ? 1 : 0 }),
    setStatus: async (id, status) => { if (!current || current.id !== id) throw new Error('Story not found'); current = { ...current, status, publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : current.publishedAt }; return current; },
    listPublished: async () => current?.status === 'PUBLISHED' ? [current] : [],
    findPublishedByPublicId: async id => current?.publicId === id && current.status === 'PUBLISHED' ? current : null
  };
}

describe('AdminStoryService', () => {
  it('creates drafts, publishes publicly, then withdraws them from the public feed', async () => {
    const service = new AdminStoryService(repository());
    const created = await service.create(draft);
    expect(created.status).toBe('DRAFT');
    const published = await service.publish(created.id);
    expect(published.status).toBe('PUBLISHED');
    expect(await service.listPublished()).toHaveLength(1);
    expect((await service.getPublished(created.publicId))?.body).toContain('内测');
    await service.withdraw(created.id);
    expect(await service.listPublished()).toEqual([]);
    expect(await service.getPublished(created.publicId)).toBeNull();
  });

  it('requires a cover and prevents editing published stories until they are withdrawn', async () => {
    const service = new AdminStoryService(repository());
    await expect(service.create({ ...draft, coverObjectKey: null })).rejects.toThrow('cover image');
    const created = await service.create(draft);
    await service.publish(created.id);
    await expect(service.update(created.id, { ...draft, title: '改稿' })).rejects.toThrow('withdraw');
  });

  it('rejects unsafe cover keys, invalid types and invalid list bounds', async () => {
    const service = new AdminStoryService(repository());
    await expect(service.create({ ...draft, coverObjectKey: 'products/../secret.png' })).rejects.toThrow('cover object key');
    await expect(service.create({ ...draft, contentType: 'VIDEO' as StoryInput['contentType'] })).rejects.toThrow('content type');
    await expect(service.listAdmin({ page: 1, pageSize: 101 })).rejects.toThrow('page size');
  });
});
