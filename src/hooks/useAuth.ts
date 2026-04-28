import { useNAuth } from 'nauth-react';

/**
 * Hook do Circulou para autenticação. Re-exporta o useNAuth do nauth-react
 * para que componentes do app falem apenas com `@/hooks/useAuth` e mantenham
 * a porta de troca caso a implementação mude (ex.: amendment de constituição).
 */
export const useAuth = () => useNAuth();

export default useAuth;
