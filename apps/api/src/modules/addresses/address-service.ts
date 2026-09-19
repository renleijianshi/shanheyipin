export interface AddressInput {
  readonly recipientName: string;
  readonly phone: string;
  readonly province: string;
  readonly city: string;
  readonly district: string;
  readonly detail: string;
  readonly isDefault: boolean;
}

export interface Address extends AddressInput { readonly id: string }

export interface AddressRepository {
  list(userId: string): Promise<Address[]>;
  create(userId: string, input: AddressInput): Promise<Address>;
  update(userId: string, addressId: string, input: AddressInput): Promise<Address>;
  remove(userId: string, addressId: string): Promise<void>;
}

export class AddressService {
  constructor(private readonly addresses: AddressRepository) {}

  list(userId: string) { return this.addresses.list(userId); }

  async create(userId: string, input: AddressInput) {
    return this.addresses.create(userId, validate(input));
  }

  async update(userId: string, addressId: string, input: AddressInput) {
    return this.addresses.update(userId, addressId, validate(input));
  }

  remove(userId: string, addressId: string) { return this.addresses.remove(userId, addressId); }

  static toOrderSnapshot(address: Address): AddressInput {
    return {
      recipientName: address.recipientName, phone: address.phone,
      province: address.province, city: address.city, district: address.district,
      detail: address.detail, isDefault: address.isDefault
    };
  }
}

function validate(input: AddressInput): AddressInput {
  const recipientName = input.recipientName.trim();
  const detail = input.detail.trim();
  if (recipientName.length < 1 || recipientName.length > 50) throw new Error('Invalid recipient name');
  if (!/^1[3-9]\d{9}$/.test(input.phone)) throw new Error('Invalid recipient phone');
  if (![input.province, input.city, input.district].every((value) => value.trim().length > 0)) {
    throw new Error('Province, city and district are required');
  }
  if (detail.length < 1 || detail.length > 255) throw new Error('Invalid address detail');
  return {
    ...input, recipientName, province: input.province.trim(), city: input.city.trim(),
    district: input.district.trim(), detail
  };
}
