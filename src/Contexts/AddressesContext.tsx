import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addressService } from '@/Services/AddressService';
import type { Address } from '@/types/address';

export interface AddressesContextValue {
  addresses: Address[];
  defaultAddress: Address | null;
  loading: boolean;
  error: string | null;
  add: (data: Omit<Address, 'addressId' | 'createdAt'>) => void;
  update: (address: Address) => void;
  remove: (addressId: string) => void;
  setDefault: (addressId: string) => void;
  refresh: () => void;
  clearError: () => void;
}

export const AddressesContext = createContext<AddressesContextValue | undefined>(undefined);

interface AddressesProviderProps {
  children: ReactNode;
}

export const AddressesProvider = ({ children }: AddressesProviderProps) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.userId !== undefined ? String(user.userId) : null;

  const refresh = useCallback(() => {
    if (!userId) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAddresses(addressService.list(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar endereços');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    (data: Omit<Address, 'addressId' | 'createdAt'>) => {
      if (!userId) return;
      addressService.insert(userId, data);
      refresh();
    },
    [userId, refresh],
  );

  const update = useCallback(
    (address: Address) => {
      if (!userId) return;
      addressService.update(userId, address);
      refresh();
    },
    [userId, refresh],
  );

  const remove = useCallback(
    (addressId: string) => {
      if (!userId) return;
      addressService.remove(userId, addressId);
      refresh();
    },
    [userId, refresh],
  );

  const setDefault = useCallback(
    (addressId: string) => {
      if (!userId) return;
      addressService.setDefault(userId, addressId);
      refresh();
    },
    [userId, refresh],
  );

  const clearError = useCallback(() => setError(null), []);

  const defaultAddress = useMemo(
    () => addresses.find(a => a.isDefault) ?? null,
    [addresses],
  );

  const value = useMemo<AddressesContextValue>(
    () => ({
      addresses,
      defaultAddress,
      loading,
      error,
      add,
      update,
      remove,
      setDefault,
      refresh,
      clearError,
    }),
    [
      addresses,
      defaultAddress,
      loading,
      error,
      add,
      update,
      remove,
      setDefault,
      refresh,
      clearError,
    ],
  );

  return <AddressesContext.Provider value={value}>{children}</AddressesContext.Provider>;
};
