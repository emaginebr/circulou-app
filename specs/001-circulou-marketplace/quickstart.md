# Quickstart — Circulou (frontend)

**Date**: 2026-04-27
**Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md)

Este guia leva um novo desenvolvedor de "repo recém-clonado" até "spec validável no
navegador" no menor número de passos.

## 1. Pré-requisitos

- **Node.js 20.x LTS** (qualquer versão suportada pelo Vite 6 serve, mas 20 LTS é a
  referência do projeto).
- **npm 10+** (vem com Node 20). pnpm/yarn não são exigidos pela constituição;
  use o que preferir, contanto que o lockfile commitado seja respeitado.
- **Git** + acesso ao repositório `circulou-app`.
- Acesso de rede ao serviço **Lofn** e ao **NAuth** (URLs nas variáveis de ambiente).
- **Não use Docker neste projeto** — a constituição proíbe (Stack Restriction). Tudo
  roda diretamente no host de desenvolvimento.

## 2. Bootstrap

```bash
git clone <repo>
cd circulou-app
git checkout 001-circulou-marketplace

# instalar dependências
npm install

# configurar variáveis de ambiente
cp .env.example .env.local
# editar .env.local apontando para os serviços corretos
```

### `.env.local` mínimo

```dotenv
# URL base da API REST do Lofn
VITE_API_URL=https://lofn.dev.example.com

# URL do GraphQL público do Lofn (geralmente VITE_API_URL + /graphql, mas explicitado)
VITE_LOFN_GRAPHQL_URL=https://lofn.dev.example.com/graphql

# Base path do React Router 6 (deixe em branco se servido na raiz)
VITE_SITE_BASENAME=
```

> **Princípio VI**: o prefixo `VITE_` é **obrigatório**. `REACT_APP_*` não é lido pelo
> Vite — qualquer variável com esse prefixo é ignorada e produz `undefined` em
> runtime.

## 3. Comandos disponíveis

| Script | Propósito |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite, hot reload). Padrão `http://localhost:5173`. |
| `npm run build` | Build de produção em `dist/`. |
| `npm run preview` | Servir o build local para inspeção. |
| `npm run test` | Vitest em modo run (uma execução). |
| `npm run test:watch` | Vitest em watch (TDD). |
| `npm run lint` | ESLint sobre `src/`. |
| `npm run typecheck` | `tsc --noEmit` para verificação estática. |

## 4. Validação dos Acceptance Scenarios da spec

Após `npm run dev`, abra `http://localhost:5173` e siga este roteiro para cobrir as
seis user stories da spec:

### US1 — Buscar produtos cross-store (P1)

1. Sem digitar nada na barra, confirme que a home exibe a primeira página com 12
   itens (FR-004); título "Em destaque" se há `featured`, "Catálogo" se não.
2. Digite "café" na busca e tecle **Enter** (FR-001 — não digite "espera-busca";
   confirme que **nada** é buscado enquanto você digita).
3. Verifique que cada card mostra nome, imagem (ou placeholder), preço, desconto se
   houver, e o **nome da loja** clicável (FR-002).
4. Verifique que a paginação aparece quando há mais de 12 resultados (FR-003).
5. Busque por um termo improvável ("xyzzy123") e confirme estado vazio (FR-001 #2).

### US2 — Filtros e ordenação unificados (P2)

1. Após uma busca não-vazia, abra o painel de filtros: deve ter "Loja", "Faixa de
   preço (min/max)", "Apenas em promoção". **NÃO** deve ter "Categoria"
   (Clarification Q3).
2. Selecione uma loja específica e confirme que a lista é refeita.
3. Defina min/max e confirme; observe que se a página atual não preencher 12 itens,
   o sistema busca progressivamente até 5 páginas (FR-007); se não preencher,
   aparece o botão **"Buscar mais"**.
4. Mude a ordenação para "Menor preço" e confirme que a lista é reordenada (mock
   LOFN-G03).
5. Compartilhe a URL da busca; abra em nova aba — os filtros e termo são
   reproduzidos exatamente (FR-009).

### US3 — Auth (P2)

1. Em `/register`, crie uma conta com e-mail novo (FR-013).
2. Logout, depois `/login` com as credenciais (FR-014).
3. Em `/profile`, atualize o nome (FR-015).
4. Use "Esqueci minha senha" e siga o fluxo — o NAuth gerencia tudo.
5. Abra DevTools > Network, force expiração do token (apague a chave
   `login-with-metamask:auth` do localStorage), tente uma ação restrita —
   deve redirecionar para `/login` e, após reentrar, voltar ao mesmo lugar (FR-016).

### US4 — Detalhe + add to cart (P3)

1. Clique em um produto da listagem; abra a página de detalhe (FR-010).
2. Verifique galeria (se o produto tiver `images[]`).
3. Tente quantidade acima do `limit` — o seletor recusa (FR-020).
4. Sem estar logado, clique em "Adicionar ao carrinho":
   - O sistema **não** adiciona imediatamente; redireciona para login.
   - Após login, retorna à página com o item já no carrinho (Clarification Q1 da
     2ª sessão — buffer pré-login em `sessionStorage` foi mesclado).
5. Adicione um produto de outra loja e abra `/cart`. Confirme que ambos coexistem
   agrupados por loja (FR-018).

### US5 — Checkout (P3)

1. Em `/cart`, clique "Finalizar compra".
2. Sem endereços cadastrados, o sistema pede para criar um (FR-023).
3. Crie um endereço (CEP, logradouro, etc.). Marque como padrão.
4. Revise o resumo (subtotais por loja + total geral, FR-018).
5. Confirme. Você deve aterrissar em `/order-confirmation` com **N cards**
   (um por loja envolvida), cada um com:
   - **ID provisório** no formato `MOCK-{slug}-{timestamp}-{rand5}` (LOFN-G11);
   - Aviso visual "Identificador provisório";
   - Subtotal, itens, endereço de entrega.
6. Feche a aba e tente voltar — confirmação não persiste (Clarification Q4).

### US6 — Página da loja (P3)

1. Em qualquer card, clique no nome da loja → `/loja/{storeSlug}`.
2. Confirme que aparece logo + nome da loja (FR-012); listagem somente desta loja.
3. Aplique filtro por **categoria** — só aqui ele existe (FR-011, Clarification Q3).
4. Use "Voltar à busca em todas as lojas" e veja os filtros prévios preservados
   (US6 cenário 2).

## 5. Cenários LGPD / privacidade (não-no-MVP)

A clarification Q3 da 2ª sessão pôs LGPD como dívida explícita para release de
produção. **Não** existe banner/consentimento no MVP. Se você for executar testes
em ambiente externo, valide com o time de produto antes de expor o build.

## 6. Onde os mocks vivem

Cada mock está marcado com `// MOCK :: LOFN-G##` no arquivo correspondente em
`src/Services/`. Para listar todos os mocks ativos:

```bash
# bash
grep -rn "MOCK :: LOFN-G" src/

# powershell
Select-String -Path src/* -Pattern "MOCK :: LOFN-G" -Recurse
```

Cada match aponta para uma linha do `lofn-api-gaps.md`. Quando um gap for fechado
no backend, basta abrir aquele item no doc, ler a estratégia de substituição e
remover o mock.

## 7. Limitações conhecidas (registradas na spec)

- Carrinho **não migra entre dispositivos** (depende de LOFN-G09). A `CartPage`
  exibe um aviso explícito.
- Endereços não migram entre dispositivos (LOFN-G13). A `ProfilePage` exibe aviso.
- IDs de pedido na confirmação são provisórios (LOFN-G11). A
  `OrderConfirmationPage` os apresenta com badge "Provisório".
- Filtros price-range e "em promoção" + ordenação dependem de pré-fetch progressivo
  (FR-007). Em catálogos grandes, a contagem total exata só é conhecida após
  esgotar o "Buscar mais".

## 8. Troubleshooting

| Problema | Diagnóstico |
|---|---|
| Tela em branco no `npm run dev` | Verifique `.env.local` — `VITE_API_URL` e `VITE_LOFN_GRAPHQL_URL` precisam estar definidos. |
| 404 em todas as buscas | Confirme que o Lofn está rodando em `VITE_API_URL` e responde a `POST /product/search`. |
| Login funciona mas o token não persiste | Verifique a chave `login-with-metamask:auth` no `localStorage`. A chave é fixada pela constituição — não renomeie. |
| `import.meta.env.VITE_*` é `undefined` | A variável precisa estar prefixada com `VITE_` e o servidor `npm run dev` precisa ser reiniciado após editar `.env.local`. |
| Filtros parecem "não aplicar tudo" | Comportamento esperado em catálogos com mais de ~60 itens (teto do pré-fetch progressivo). Use "Buscar mais". Quando LOFN-G01..G03 forem fechados, o servidor retornará o conjunto completo. |
| Carrinho some ao trocar de dispositivo | Comportamento esperado neste MVP (LOFN-G09). |

## 9. Próximos passos

`/speckit.tasks` — gera `tasks.md` com decomposição P1→P3 baseada em `spec.md` +
`plan.md`. O scaffolding obrigatório das entidades segue via skill
`/react-architecture` (Princípio I).
