import type { NAuthConfig } from 'nauth-react';
import {
  AUTH_STORAGE_KEY,
  TENANT_HEADER,
  TENANT_ID,
  getStoredToken,
} from '@/Services/HttpClient';

export const buildNAuthConfig = (): NAuthConfig => ({
  apiUrl: import.meta.env.VITE_NAUTH_URL ?? '',
  storageKey: AUTH_STORAGE_KEY,
  storageType: 'localStorage',
  redirectOnUnauthorized: '/login',
  enableFingerprinting: true,
  headers: { [TENANT_HEADER]: TENANT_ID },
});

/**
 * Lê o token diretamente do localStorage e devolve o header Basic
 * para chamadas a Services do Circulou (Lofn). Princípio V da constituição.
 *
 * Note: o `nauth-react` envia `Bearer` para o próprio backend NAuth
 * por dentro de seus interceptors; este helper é exclusivamente para
 * Services do Circulou que falam com Lofn.
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Basic ${token}` } : {};
};

export const isAuthenticated = (): boolean => Boolean(getStoredToken());
