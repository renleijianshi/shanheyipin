import type { Cart, CartItem, CartItemInvalidReason } from '@shanheyipin/shared-types';

export interface CartRepositoryItem extends CartItem {
  readonly invalidReason: CartItemInvalidReason | null;
}

export interface CartRepository {
  listItems(userId: string): Promise<CartRepositoryItem[]>;
  addItem(userId: string, skuId: string, quantity: number): Promise<void>;
  updateItem(userId: string, itemId: string, quantity: number): Promise<void>;
  removeItem(userId: string, itemId: string): Promise<void>;
}

export class CartService {
  constructor(private readonly carts: CartRepository) {}

  async get(userId: string): Promise<Cart> {
    assertUserId(userId);
    return summarize(await this.carts.listItems(userId));
  }

  async add(userId: string, input: { readonly skuId: string; readonly quantity: number }): Promise<Cart> {
    assertUserId(userId);
    if (!isUuid(input.skuId)) throw new Error('Invalid SKU id');
    assertQuantity(input.quantity);
    await this.carts.addItem(userId, input.skuId, input.quantity);
    return this.get(userId);
  }

  async update(
    userId: string,
    itemId: string,
    input: { readonly quantity: number }
  ): Promise<Cart> {
    assertUserId(userId);
    if (!isUuid(itemId)) throw new Error('Invalid cart item id');
    assertQuantity(input.quantity);
    await this.carts.updateItem(userId, itemId, input.quantity);
    return this.get(userId);
  }

  async remove(userId: string, itemId: string): Promise<Cart> {
    assertUserId(userId);
    if (!isUuid(itemId)) throw new Error('Invalid cart item id');
    await this.carts.removeItem(userId, itemId);
    return this.get(userId);
  }
}

function summarize(items: readonly CartRepositoryItem[]): Cart {
  const validItems = items.filter((item) => item.isValid);
  return {
    items,
    validItemCount: validItems.length,
    totalQuantity: validItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCent: validItems.reduce((sum, item) => sum + item.salePriceCent * item.quantity, 0)
  };
}

function assertUserId(userId: string): void {
  if (!/^[1-9]\d*$/.test(userId)) throw new Error('Invalid user id');
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error('Invalid cart item quantity');
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
