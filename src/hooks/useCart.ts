import { useContext } from 'react';
import { CartContext } from '@/Contexts/CartContext';

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export default useCart;
