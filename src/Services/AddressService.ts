import type { Address } from '@/types/address';
import { addressesStorageKey } from '@/types/address';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback inferior, suficiente para POC.
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const READ = (key: string): Address[] => {
  // MOCK :: LOFN-G13 — armazenamento de endereços client-side.
  // Substituir por GET /address/list/{userId} quando o gap fechar.
  // Ver specs/001-circulou-marketplace/lofn-api-gaps.md#lofn-g13.
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Address[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

const WRITE = (key: string, items: Address[]): void => {
  // MOCK :: LOFN-G13 — persistir endereços em localStorage.
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
};

class AddressService {
  list(userId: string): Address[] {
    return READ(addressesStorageKey(userId));
  }

  insert(userId: string, data: Omit<Address, 'addressId' | 'createdAt'>): Address {
    const list = this.list(userId);
    const willBeFirst = list.length === 0;
    const newItem: Address = {
      ...data,
      addressId: generateId(),
      createdAt: new Date().toISOString(),
      isDefault: willBeFirst ? true : Boolean(data.isDefault),
    };
    let next = [...list, newItem];
    if (newItem.isDefault) next = enforceSingleDefault(next, newItem.addressId);
    WRITE(addressesStorageKey(userId), next);
    return newItem;
  }

  update(userId: string, address: Address): Address {
    const list = this.list(userId);
    let next = list.map(a => (a.addressId === address.addressId ? address : a));
    if (address.isDefault) next = enforceSingleDefault(next, address.addressId);
    WRITE(addressesStorageKey(userId), next);
    return address;
  }

  remove(userId: string, addressId: string): Address[] {
    const list = this.list(userId);
    const wasDefault = list.find(a => a.addressId === addressId)?.isDefault === true;
    let next = list.filter(a => a.addressId !== addressId);
    // MOCK :: LOFN-G14 — reatribuir default ao primeiro endereço restante quando o default é apagado.
    if (wasDefault && next.length > 0) {
      const first = next[0];
      if (first) next = enforceSingleDefault(next, first.addressId);
    }
    WRITE(addressesStorageKey(userId), next);
    return next;
  }

  setDefault(userId: string, addressId: string): Address[] {
    const list = enforceSingleDefault(this.list(userId), addressId);
    WRITE(addressesStorageKey(userId), list);
    return list;
  }
}

const enforceSingleDefault = (items: Address[], defaultId: string): Address[] =>
  items.map(a => ({ ...a, isDefault: a.addressId === defaultId }));

export const addressService = new AddressService();
export default AddressService;
