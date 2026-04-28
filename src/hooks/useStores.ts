import { useContext } from 'react';
import { StoresContext } from '@/Contexts/StoresContext';

export const useStores = () => {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error('useStores must be used within a StoresProvider');
  return ctx;
};

export default useStores;
