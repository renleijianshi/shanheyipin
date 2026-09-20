export type CategoryStatus = 'ENABLED' | 'DISABLED';

export interface CategoryInput {
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly status: CategoryStatus;
}

export interface Category extends CategoryInput { readonly id: string }

export interface PublicCategory {
  readonly id: string;
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly children: PublicCategory[];
}

export interface CategoryRepository {
  list(options: { readonly onlyEnabled: boolean }): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, input: CategoryInput): Promise<Category>;
  remove(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
  isDescendant(categoryId: string, possibleDescendantId: string): Promise<boolean>;
}

export class PublicCategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async listTree(): Promise<PublicCategory[]> {
    return buildTree(await this.categories.list({ onlyEnabled: false }));
  }
}

export class AdminCategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  list(): Promise<Category[]> {
    return this.categories.list({ onlyEnabled: false });
  }

  async create(input: CategoryInput): Promise<Category> {
    const valid = validate(input);
    if (valid.parentId) validateId(valid.parentId);
    if (valid.parentId && !(await this.categories.findById(valid.parentId))) {
      throw new Error('Parent category not found');
    }
    return this.categories.create(valid);
  }

  async update(id: string, input: CategoryInput): Promise<Category> {
    validateId(id);
    if (!(await this.categories.findById(id))) throw new Error('Category not found');
    const valid = validate(input);
    if (valid.parentId) {
      validateId(valid.parentId);
      if (valid.parentId === id || await this.categories.isDescendant(id, valid.parentId)) {
        throw new Error('Category hierarchy cycle');
      }
      if (!(await this.categories.findById(valid.parentId))) throw new Error('Parent category not found');
    }
    return this.categories.update(id, valid);
  }

  async remove(id: string): Promise<void> {
    validateId(id);
    if (!(await this.categories.findById(id))) throw new Error('Category not found');
    if (await this.categories.hasChildren(id)) throw new Error('Category has children');
    await this.categories.remove(id);
  }
}

function validateId(id: string): void {
  if (!/^[1-9]\d*$/.test(id)) throw new Error('Invalid category id');
}

function validate(input: CategoryInput): CategoryInput {
  const code = input.code.trim();
  const name = input.name.trim();
  if (code.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
    throw new Error('Invalid category code');
  }
  if (name.length < 1 || name.length > 50) throw new Error('Invalid category name');
  if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 999_999) {
    throw new Error('Invalid category sort order');
  }
  if (input.status !== 'ENABLED' && input.status !== 'DISABLED') {
    throw new Error('Invalid category status');
  }
  return { ...input, code, name };
}

function buildTree(categories: Category[]): PublicCategory[] {
  const children = new Map<string | null, Category[]>();
  for (const category of categories) {
    const siblings = children.get(category.parentId) ?? [];
    siblings.push(category);
    children.set(category.parentId, siblings);
  }

  for (const siblings of children.values()) {
    siblings.sort((left, right) => left.sortOrder - right.sortOrder || compareIds(left.id, right.id));
  }

  const toPublic = (category: Category, ancestors: ReadonlySet<string>): PublicCategory | null => {
    if (category.status !== 'ENABLED') return null;
    if (ancestors.has(category.id)) throw new Error('Existing category hierarchy cycle');
    const nextAncestors = new Set(ancestors).add(category.id);
    const publicChildren = (children.get(category.id) ?? [])
      .map((child) => toPublic(child, nextAncestors))
      .filter((child): child is PublicCategory => child !== null);
    return {
      id: category.id, parentId: category.parentId, code: category.code,
      name: category.name, sortOrder: category.sortOrder, children: publicChildren
    };
  };

  return (children.get(null) ?? [])
    .map((category) => toPublic(category, new Set()))
    .filter((category): category is PublicCategory => category !== null);
}

function compareIds(left: string, right: string): number {
  const leftId = BigInt(left);
  const rightId = BigInt(right);
  return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
}
