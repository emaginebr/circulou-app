import { useContext } from 'react';
import { CategoriesContext } from '@/Contexts/CategoriesContext';

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
};

export default useCategories;
