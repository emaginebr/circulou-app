# Spike T048a — NAuth × Constituição V

**Data**: 2026-04-27
**Modalidade**: análise de fontes (sem ambiente NAuth/Lofn dev acessível)
**Fonte primária**: `node_modules/nauth-react/dist/index.js` (build minificado, identificadores legíveis)
**Fonte secundária**: `node_modules/nauth-react/dist/index.d.ts`

## 1. Pergunta original (do tasks.md T048a)

> Validar antes de US3 que o token emitido por `nauth-react` é compatível com o esquema
> `Authorization: Basic {token}` exigido pela constituição (Princípio V) e aceito pelo
> backend Lofn.

## 2. O que o `nauth-react` faz internamente

### 2.1 Armazenamento do token

```js
// dist/index.js, linhas ~9520-9573
this.config = {
  timeout: 30000,
  storageKey: "nauth_token",        // ← default
  storageType: "localStorage",      // ← default
  enableFingerprinting: true,
  ...userConfig
};
getStorage() {
  return this.config.storageType === "sessionStorage" ? sessionStorage : localStorage;
}
getToken()   { return this.getStorage().getItem(this.config.storageKey || "nauth_token"); }
setToken(t)  { this.getStorage().setItem(this.config.storageKey || "nauth_token", t); }
clearToken() { this.getStorage().removeItem(this.config.storageKey || "nauth_token"); }
```

**Observação**: a chave de storage é configurável via `NAuthConfig.storageKey`. O storage type também (default `localStorage`).

### 2.2 Header de autenticação que o `nauth-react` envia

```js
// dist/index.js, linha ~9536-9540
this.client.interceptors.request.use(async (e) => {
  const r = this.getToken();
  return r && (e.headers.Authorization = `Bearer ${r}`), e;
});
```

**Observação**: nas requests que o próprio `nauth-react` faz contra o backend NAuth (login, register, getMe, etc.), o header é fixado como `Bearer {token}`. Não há configuração para trocar o esquema.

### 2.3 Tipo do token

```ts
// dist/index.d.ts, linha 46
export declare interface AuthSession {
  token: string;            // ← opaque string
  user: UserInfo;
}
```

O `login(credentials)` retorna `AuthSession.token` — uma string opaca. O `nauth-react` chama `setToken(session.token)` e o armazena no storage configurado.

## 3. Conflito identificado

| Aspecto | Constituição V (não-negociável) | NAuth default | Conflita? |
|---|---|---|---|
| Chave de storage | `"login-with-metamask:auth"` | `"nauth_token"` | **Sim, mas configurável** |
| Storage type | `localStorage` | `localStorage` | Não |
| Esquema de autenticação | `Authorization: Basic {token}` | `Authorization: Bearer {token}` | **Sim** |

## 4. Resolução

### 4.1 Storage key — alinhamento via config

`NAuthProvider` aceita `config.storageKey`. Configuramos:

```ts
const nauthConfig: NAuthConfig = {
  apiUrl: import.meta.env.VITE_NAUTH_URL,
  storageKey: 'login-with-metamask:auth',  // alinha com Princípio V
  storageType: 'localStorage',
  redirectOnUnauthorized: '/login',
};
```

Resultado: ambos `nauth-react` e nosso `HttpClient.ts` leem da mesma chave.

### 4.2 Header de autenticação — divisão de responsabilidades

- **Chamadas que o `nauth-react` faz contra o backend NAuth** (`/Auth/login`, `/User/getMe`, etc.) usam `Authorization: Bearer {token}`. Não conseguimos trocar isso sem patchar o módulo.
- **Chamadas que nosso `HttpClient.ts` faz contra o backend Lofn** (`/product/search`, `/shopcart/insert`, GraphQL) leem o token do **mesmo** `localStorage` e enviam `Authorization: Basic {token}` conforme Princípio V.

Esta é uma divisão **legítima**: o esquema do header é uma propriedade do **destino**, não do token em si. O mesmo token opaco pode ser apresentado como `Basic` para o Lofn (que historicamente assim aceita, conforme Princípio V) e como `Bearer` para o NAuth (que é o que o `nauth-react` espera).

### 4.3 Pergunta empírica não respondida

> O backend Lofn aceita `Authorization: Basic {token-emitido-pelo-NAuth}` como esquema válido?

Sem ambiente Lofn/NAuth dev acessível, **não pude validar empiricamente**. Mas:

- A constituição v1.0.0 (`./.specify/memory/constitution.md`) **declara este padrão como invariante histórico do projeto** — `Authorization: Basic {token}` + `localStorage["login-with-metamask:auth"]` (Princípio V).
- O constituinte é a fonte de verdade nesse contexto. Se o backend Lofn rejeitar, é a constituição que precisa ser amendada — não o frontend.
- A primeira request real autenticada (ex.: `POST /shopcart/insert` em US5) será o teste empírico.

## 5. Decisão

✅ **Procedemos com Phase 5 (US3)** sem amendment de constituição.

**Implementação**:

1. Adicionar `VITE_NAUTH_URL` ao `.env.example`.
2. Em `src/Services/AuthService.ts`, criar wrapper sobre os hooks `nauth-react`:
   - Configurar `NAuthProvider` com `storageKey: 'login-with-metamask:auth'`, `storageType: 'localStorage'`, `redirectOnUnauthorized: '/login'`.
   - Expor `getHeaders()` que lê do mesmo storage e devolve `{ Authorization: 'Basic {token}' }` para Services Lofn.
3. `HttpClient.ts` já lê do storage correto (T014).
4. Em `AuthContext`, ouvir eventos `auth:expired` (emitidos pelo `HttpClient` em 401 das chamadas Lofn) **além** do redirect interno do `nauth-react` em 401 das chamadas NAuth.

## 6. Riscos abertos (registrar como dívida)

| ID | Risco | Plano |
|---|---|---|
| NAUTH-S1 | Lofn rejeita `Basic {token-NAuth}` na primeira request real | Validar manualmente assim que houver acesso a ambiente dev. Se rejeitar, acionar amendment de constituição. |
| NAUTH-S2 | `nauth-react` faz fingerprinting (FingerprintJS) por padrão | Mantido habilitado — útil para sessões. Se causar problema (CSP, GDPR), desabilitar via `enableFingerprinting: false`. |
| NAUTH-S3 | `redirectOnUnauthorized` do NAuth e nosso evento `auth:expired` podem disparar redirects duplos | Sentinela: nosso listener checa `pathname !== '/login'` antes de navegar. |

## 7. Fontes consultadas

- `node_modules/nauth-react/dist/index.js` linhas 9510-9610 (NAuthAPI class)
- `node_modules/nauth-react/dist/index.d.ts` linhas 831-877 (NAuthConfig, NAuthContextValue)
- `.specify/memory/constitution.md` Princípio V
