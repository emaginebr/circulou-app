import { useContext } from 'react';
import { AddressesContext } from '@/Contexts/AddressesContext';

export const useAddresses = () => {
  const ctx = useContext(AddressesContext);
  if (!ctx) throw new Error('useAddresses must be used within an AddressesProvider');
  return ctx;
};

export default useAddresses;
