// Wrapper sobre fetch com:
// - Header Authorization: Basic {token} lido de localStorage["login-with-metamask:auth"] (Princípio V).
// - Header X-Tenant-Id em toda requisição, lido de VITE_TENANT_ID (default "emagine").
// - Serialização JSON automática.
// - AbortSignal pass-through.
// - Mapeamento de erros HTTP para LofnApiError.
// - Dispatch de evento 'auth:expired' em 401 (FR-016).

export const AUTH_STORAGE_KEY = 'login-with-metamask:auth';
export const AUTH_EXPIRED_EVENT = 'auth:expired';
export const TENANT_HEADER = 'X-Tenant-Id';
export const TENANT_ID =
  (import.meta.env.VITE_TENANT_ID as string | undefined) ?? 'emagine';

export class LofnApiError extends Error {
  override readonly name = 'LofnApiError';
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} ${statusText}`);
  }
}

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
};

const buildAuthHeader = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Basic ${token}` } : {};
};

interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [TENANT_HEADER]: TENANT_ID,
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.skipAuth ? {} : buildAuthHeader()),
    ...(options.headers ?? {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new LofnApiError(0, 'Network', null, (err as Error).message);
  }

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    const text = await safeText(response);
    throw new LofnApiError(401, response.statusText, text, 'Sessão expirada');
  }

  if (!response.ok) {
    const text = await safeText(response);
    throw new LofnApiError(response.status, response.statusText, text);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) return (await response.json()) as T;
  return (await safeText(response)) as unknown as T;
};

const safeText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

export const HttpClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', url, body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', url, body, options),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, undefined, options),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', url, body, options),
};

export const apiUrl = (path: string): string => {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleaned}`;
};

// O GraphQL do Lofn é sempre servido na mesma base da REST, no path /graphql.
export const graphqlUrl = (): string => apiUrl('/graphql');
