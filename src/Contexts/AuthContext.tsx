import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AUTH_EXPIRED_EVENT } from '@/Services/HttpClient';

/**
 * Listener do evento `auth:expired` emitido pelo HttpClient em 401 vindo do Lofn.
 * Redireciona para /login preservando o pathname atual em `state.from` para
 * que o LoginPage possa retornar o usuário ao destino original (FR-016).
 *
 * **Renderização**: deve ficar dentro do `RouterProvider` (usa `useNavigate`/`useLocation`).
 * O `NAuthProvider` em si fica no `main.tsx` (top-level).
 */
export const AuthExpiredListener = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => {
      if (location.pathname === '/login') return;
      navigate('/login', {
        state: { from: location.pathname + location.search },
        replace: true,
      });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
  }, [navigate, location]);

  return <>{children}</>;
};
