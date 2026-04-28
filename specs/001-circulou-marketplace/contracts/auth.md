# Contract — `Services/AuthService.ts` (NAuth integration)

**FRs cobertos**: FR-013, FR-014, FR-015 (parte de perfil), FR-016, FR-022.
**Gaps backend referenciados**: nenhum — NAuth cobre integralmente.

## 1. Origem

Toda a comunicação de auth passa pelo pacote `nauth-react` (v0.7.x). O `AuthService`
do Circulou é um **wrapper fino** sobre os hooks oficiais do NAuth, expondo apenas o
que o app consome e centralizando o `getHeaders()` para outros Services.

## 2. Funções públicas (assinatura conceitual)

```ts
interface AuthService {
  // Lê o token do localStorage e devolve { Authorization: 'Basic {token}' } ou {} se ausente.
  getHeaders(): Record<string, string>;

  // Compõe o token (stub — a forma exata é definida pelo NAuth).
  getCurrentUser(): UserInfo | null;

  // Disparados pelos hooks de NAuth via eventos:
  // - 'auth:login'    → CartContext aciona mergeAnonBuffer()
  // - 'auth:logout'   → AuthContext limpa estado, mantém localStorage por userId
  // - 'auth:expired'  → HttpClient dispara isso ao receber 401 (FR-016)
  on(event: 'auth:login' | 'auth:logout' | 'auth:expired', cb: () => void): () => void;
}
```

> Os hooks de fluxo (login, register, forgot-password, change-password) vêm direto do
> `nauth-react` — o `AuthContext` do Circulou apenas os expõe e adiciona o efeito
> `mergeAnonBuffer` no `auth:login`.

## 3. Constituição V — header e storage

```ts
function getHeaders(): Record<string, string> {
  const raw = localStorage.getItem('login-with-metamask:auth');  // chave fixada na constituição
  if (!raw) return {};
  // O NAuth grava o token em algum schema; aqui assumimos que `raw` ou um campo de `JSON.parse(raw)`
  // contém o token bruto. A forma exata é confirmada em /speckit.tasks ao olhar o nauth-react.
  const token = parseToken(raw);
  return token ? { Authorization: `Basic ${token}` } : {};
}
```

- A chave `"login-with-metamask:auth"` é **literal** e imutável conforme constituição.
- Esquema `Basic {token}` é exigido pela constituição. Se NAuth gravar `Bearer`,
  ainda compomos `Basic` por cima do token base — confirmar com a equipe NAuth se
  o token base é compatível. Discrepâncias são resolvidas em research adicional
  durante `/speckit.tasks`, **não** alterando a constituição.

## 4. Fluxos cobertos

| Fluxo | Componente | Hook NAuth |
|---|---|---|
| Login (FR-014) | `LoginPage` / `LoginForm` | `useLogin` ou equivalente |
| Cadastro (FR-013) | `RegisterPage` / `RegisterForm` | `useRegister` |
| Esqueci minha senha (FR-014) | `ForgotPasswordPage` | `useForgotPassword` |
| Reset de senha (FR-014) | `ResetPasswordPage` | `useResetPassword` |
| Trocar senha autenticado (FR-014) | `ChangePasswordPage` | `useChangePassword` |
| Ver/atualizar perfil (FR-015) | `ProfilePage` | `useUser` + `useUpdateUser` |
| Logout | `Header.tsx` | `useLogout` |
| Sessão expirada (FR-016) | `HttpClient` → `AuthContext` → redirect | n/a (gerado client-side) |

## 5. Eventos consumidos pelo restante do app

```ts
// Em main.tsx (provider chain), AuthContext registra:
authService.on('auth:login', () => {
  cartContext.mergeAnonBufferIntoUser(currentUser.userId);
  addressContext.load(currentUser.userId);
});

authService.on('auth:logout', () => {
  cartContext.unload();        // limpa estado em memória; localStorage permanece
  addressContext.unload();
});

authService.on('auth:expired', () => {
  // Salva intent atual (path + filtros via useUrlSearchState) em sessionStorage
  // e redireciona para /login. Após login bem-sucedido, restaura.
});
```

## 6. Erros mapeados

| Cenário | Tratamento |
|---|---|
| Credenciais inválidas | Mensagem inline no form (NAuth já provê texto); sem redirect. |
| E-mail já em uso (cadastro) | Mensagem inline no form. |
| Token expirado em request | `HttpClient` detecta 401 e dispara `auth:expired`. |
| NAuth indisponível | Toast "Serviço de autenticação indisponível. Tente novamente em instantes." Fluxo bloqueia o login. |
| Logout enquanto há requests pendentes | Cancelar via `AbortController` global; descartar respostas tardias. |

## 7. Privacidade e LGPD

A clarification Q3 da segunda sessão (deferred LGPD) se aplica também aqui:

- Sem banner/consentimento no MVP.
- Token e dados básicos (`UserInfo`) ficam em `localStorage`. Quando LGPD for
  endereçada antes do release de produção, este Service ganhará um método
  `forgetMe()` que limpa todos os namespaces `circulou:*` para o usuário.
