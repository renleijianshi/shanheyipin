import type {
  CheckoutAddress,
  CheckoutItem,
  CheckoutPreview,
  ShippingQuote
} from '@shanheyipin/shared-types';
import type { CartRepositoryItem } from '../cart/cart-service.js';

export interface CheckoutRepository {
  findOwnedAddress(userId: string, addressId: string): Promise<CheckoutAddress | null>;
  listCartItems(userId: string): Promise<CartRepositoryItem[]>;
}

export interface ShippingQuoteProvider {
  quote(input: {
    readonly address: CheckoutAddress;
    readonly items: readonly CheckoutItem[];
    readonly merchandiseAmountCent: number;
  }): Promise<ShippingQuote>;
}

export class FixedShippingQuoteProvider implements ShippingQuoteProvider {
  constructor(private readonly config: {
    readonly feeCent: number;
    readonly freeAboveCent?: number;
  }) {
    if (!isNonNegativeMoney(config.feeCent)
      || (config.freeAboveCent !== undefined && !isNonNegativeMoney(config.freeAboveCent))) {
      throw new Error('Invalid shipping configuration');
    }
  }

  async quote(input: Parameters<ShippingQuoteProvider['quote']>[0]): Promise<ShippingQuote> {
    const isFree = this.config.freeAboveCent !== undefined
      && input.merchandiseAmountCent >= this.config.freeAboveCent;
    return {
      method: 'STANDARD',
      feeCent: isFree ? 0 : this.config.feeCent,
      description: isFree ? '满额包邮' : '标准配送'
    };
  }
}

export class CheckoutService {
  constructor(
    private readonly checkout: CheckoutRepository,
    private readonly shippingQuotes: ShippingQuoteProvider
  ) {}

  async preview(
    userId: string,
    input: { readonly addressId: string; readonly cartItemIds: readonly string[] }
  ): Promise<CheckoutPreview> {
    assertPositiveId(userId, 'Invalid user id');
    assertPositiveId(input.addressId, 'Invalid address id');
    if (input.cartItemIds.length < 1 || input.cartItemIds.length > 100) {
      throw new Error('Checkout requires cart items');
    }
    if (!input.cartItemIds.every(isUuid)) throw new Error('Invalid cart item id');
    if (new Set(input.cartItemIds).size !== input.cartItemIds.length) {
      throw new Error('Duplicate cart item id');
    }

    const [address, cartItems] = await Promise.all([
      this.checkout.findOwnedAddress(userId, input.addressId),
      this.checkout.listCartItems(userId)
    ]);
    if (!address) throw new Error('Checkout address not found');
    const byId = new Map(cartItems.map((item) => [item.id, item]));
    const selected = input.cartItemIds.map((id) => byId.get(id));
    if (selected.some((item) => item === undefined)) throw new Error('Checkout cart item not found');
    if (selected.some((item) => !item!.isValid)) throw new Error('Checkout contains unavailable item');

    const items = selected.map((item) => toCheckoutItem(item!));
    const merchandiseAmountCent = items.reduce((sum, item) => sum + item.lineAmountCent, 0);
    const shipping = await this.shippingQuotes.quote({ address, items, merchandiseAmountCent });
    assertShippingQuote(shipping);

    const discounts = [] as const;
    const discountAmountCent = 0;
    return {
      address,
      items,
      merchandiseAmountCent,
      discounts,
      discountAmountCent,
      shipping,
      payableAmountCent: merchandiseAmountCent - discountAmountCent + shipping.feeCent
    };
  }
}

function toCheckoutItem(item: CartRepositoryItem): CheckoutItem {
  return {
    cartItemId: item.id,
    skuId: item.skuId,
    productName: item.productName,
    skuName: item.skuName,
    coverObjectKey: item.coverObjectKey,
    specs: item.specs,
    quantity: item.quantity,
    unitPriceCent: item.salePriceCent,
    lineAmountCent: item.salePriceCent * item.quantity
  };
}

function assertShippingQuote(quote: ShippingQuote): void {
  if (!isNonNegativeMoney(quote.feeCent)
    || quote.method.trim().length < 1 || quote.method.length > 50
    || quote.description.trim().length < 1 || quote.description.length > 100) {
    throw new Error('Invalid shipping quote');
  }
}

function isNonNegativeMoney(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function assertPositiveId(value: string, message: string): void {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(message);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
