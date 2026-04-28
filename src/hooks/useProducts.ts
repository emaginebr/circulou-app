import { useContext } from 'react';
import { ProductsContext } from '@/Contexts/ProductsContext';

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return ctx;
};

export default useProducts;
