export interface Address {
  addressId: string;
  label?: string;
  recipientName: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export const ADDRESSES_STORAGE_PREFIX = 'circulou:addresses:';

export const addressesStorageKey = (userId: string): string =>
  `${ADDRESSES_STORAGE_PREFIX}${userId}`;
