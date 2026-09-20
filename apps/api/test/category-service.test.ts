import { describe, expect, it } from 'vitest';
import {
  AdminCategoryService,
  PublicCategoryService,
  type Category,
  type CategoryRepository
} from '../src/modules/catalog/category-service.js';

function createRepository(seed: Category[] = []): CategoryRepository {
  const rows = [...seed];
  return {
    list: async ({ onlyEnabled }) => rows.filter((row) => !onlyEnabled || row.status === 'ENABLED'),
    findById: async (id) => rows.find((row) => row.id === id) ?? null,
    create: async (input) => ({ id: String(rows.length + 1), ...input }),
    update: async (id, input) => ({ id, ...input }),
    remove: async () => undefined,
    hasChildren: async (id) => rows.some((row) => row.parentId === id),
    isDescendant: async (categoryId, possibleDescendantId) => {
      let current = rows.find((row) => row.id === possibleDescendantId);
      while (current?.parentId) {
        if (current.parentId === categoryId) return true;
        current = rows.find((row) => row.id === current?.parentId);
      }
      return false;
    }
  };
}

const root: Category = {
  id: '1', parentId: null, code: 'gift', name: '精品礼盒', sortOrder: 20, status: 'ENABLED'
};

describe('PublicCategoryService', () => {
  it('returns only enabled categories as a stable sorted tree', async () => {
    const service = new PublicCategoryService(createRepository([
      { id: '3', parentId: '1', code: 'festival', name: '节礼', sortOrder: 10, status: 'ENABLED' },
      { id: '2', parentId: null, code: 'trial', name: '试吃装', sortOrder: 10, status: 'ENABLED' },
      { id: '10', parentId: null, code: 'bulk', name: '袋装', sortOrder: 10, status: 'ENABLED' },
      { id: '4', parentId: null, code: 'hidden', name: '隐藏', sortOrder: 1, status: 'DISABLED' },
      { id: '5', parentId: '4', code: 'hidden-child', name: '隐藏子类', sortOrder: 1, status: 'ENABLED' },
      root
    ]));

    await expect(service.listTree()).resolves.toEqual([
      { id: '2', parentId: null, code: 'trial', name: '试吃装', sortOrder: 10, children: [] },
      { id: '10', parentId: null, code: 'bulk', name: '袋装', sortOrder: 10, children: [] },
      {
        id: '1', parentId: null, code: 'gift', name: '精品礼盒', sortOrder: 20,
        children: [{ id: '3', parentId: '1', code: 'festival', name: '节礼', sortOrder: 10, children: [] }]
      }
    ]);
  });
});

describe('AdminCategoryService', () => {
  it('normalizes valid create input', async () => {
    const service = new AdminCategoryService(createRepository());
    await expect(service.create({
      parentId: null, code: '  dried-fruit ', name: ' 柿饼 ', sortOrder: 0, status: 'ENABLED'
    })).resolves.toMatchObject({ code: 'dried-fruit', name: '柿饼' });
  });

  it('rejects invalid category codes', async () => {
    const service = new AdminCategoryService(createRepository());
    await expect(service.create({
      parentId: null, code: '../gift', name: '礼盒', sortOrder: 0, status: 'ENABLED'
    })).rejects.toThrow('Invalid category code');
  });

  it('rejects moving a category below itself or one of its descendants', async () => {
    const service = new AdminCategoryService(createRepository([
      root,
      { id: '2', parentId: '1', code: 'festival', name: '节礼', sortOrder: 0, status: 'ENABLED' }
    ]));
    const input = { parentId: '2', code: 'gift', name: '精品礼盒', sortOrder: 20, status: 'ENABLED' as const };
    await expect(service.update('1', input)).rejects.toThrow('Category hierarchy cycle');
    await expect(service.update('1', { ...input, parentId: '1' })).rejects.toThrow('Category hierarchy cycle');
  });

  it('rejects deletion while child categories exist', async () => {
    const service = new AdminCategoryService(createRepository([
      root,
      { id: '2', parentId: '1', code: 'festival', name: '节礼', sortOrder: 0, status: 'ENABLED' }
    ]));
    await expect(service.remove('1')).rejects.toThrow('Category has children');
  });
});
