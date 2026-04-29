<!--
SYNC IMPACT REPORT
==================
Version change: 2.1.0 → 3.0.0
Bump rationale: MAJOR — Princípio II teve uma biblioteca mandatória removida
(i18next 25.x) e Princípio VII teve seu mecanismo redefinido: strings ficam
hard-coded em pt-BR diretamente nos componentes em vez de passar por i18next.
Mudança backwards-incompatible: código existente que usa `useTranslation` /
`t('...')` deve ser refatorado.

Modified principles:
  - II. Approved Frontend Stack — i18next 25.x removido.
  - VII. Single Locale — Português (pt-BR) — exige strings hard-coded; i18next
    proibido como dependência do app.

Added sections: none (apenas atualizações)
Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md       — Genérico; sem ajuste.
  ✅ .specify/templates/spec-template.md       — Genérico; sem ajuste.
  ✅ .specify/templates/tasks-template.md      — Genérico; sem ajuste.
  ⚠ specs/001-circulou-marketplace/plan.md    — Atualizar referência a i18next.
  ⚠ CLAUDE.md                                  — Atualizar Active Technologies.
  ⚠ README.md                                  — Atualizar stack.

Follow-up TODOs: nenhum.
-->

# Circulou Frontend Constitution

## Core Principles

### I. Mandatory Skill Usage (NON-NEGOTIABLE)

For any new frontend entity (Types, Service, Context, Hook, Provider registration), the
`react-architecture` skill MUST be invoked via `/react-architecture`. Contributors MUST
NOT hand-roll these patterns — the skill is the single source of truth for file layout,
provider chain wiring, and error handling conventions (`handleError`, `clearError`,
`loading` state).

**Rationale**: Reimplementing scaffolding manually causes drift from the established
provider chain, error-handling, and loading-state contracts, producing inconsistent
behavior across features. The skill encodes those contracts in one place.

### II. Approved Frontend Stack

The following stack is fixed and MUST be used as specified:

| Tecnologia      | Versão   | Finalidade                                |
|-----------------|----------|-------------------------------------------|
| React           | 18.x     | Framework UI                              |
| TypeScript      | 5.x      | Tipagem estática                          |
| React Router    | 6.x      | Roteamento SPA                            |
| Vite            | 6.x      | Build toolchain                           |
| Tailwind CSS    | 4.x      | Sistema de utilidades + design tokens     |
| `@tailwindcss/vite` | 4.x  | Plugin Vite oficial do Tailwind           |
| Axios           | 1.x      | HTTP client (legado)                      |
| Fetch API       | Nativo   | HTTP client (novos serviços)              |

New code MUST use the Fetch API for HTTP calls; Axios is permitted only for legacy
integration points already wired through it.

UI styling rules:

- Tailwind utility classes são a forma padrão de estilizar componentes.
- Tokens de design (cores, raios, tipografia) são declarados em `src/styles/theme.css`
  via `@theme` ou variáveis CSS, e referenciados pelas utility classes.
- Bibliotecas de componentes baseadas em Bootstrap (`react-bootstrap`,
  `bootstrap-icons`, etc.) MUST NOT ser introduzidas.
- Para primitivos acessíveis (modal, popover, tabs), preferir bibliotecas headless
  (Radix, Headless UI) ou implementação própria com ARIA correto. **Não** ressuscitar
  o JS do Bootstrap.

**Rationale**: Tailwind dá controle direto sobre o design sem CSS global concorrente,
elimina a camada de variáveis Sass e os ~313 deprecation warnings do Bootstrap 5.3
sobre `red()/green()/blue()`, e remove a dependência de Sass em runtime do app.

### III. Directory Case Sensitivity (Inviolable)

Directory casing MUST match exactly on disk and in every import statement:

| Diretório    | Casing       | Motivo                                |
|--------------|--------------|---------------------------------------|
| `Contexts/`  | Uppercase C  | Compatibilidade Docker/Linux          |
| `Services/`  | Uppercase S  | Compatibilidade Docker/Linux          |
| `hooks/`     | Lowercase h  | Convenção React                       |
| `types/`     | Lowercase t  | Convenção TypeScript                  |

**Rationale**: Windows file systems are case-insensitive but Docker/Linux production
environments are not. Mismatched casing builds locally and silently breaks in
deployment.

### IV. TypeScript & React Code Conventions

The following conventions are mandatory:

| Elemento                | Convenção                  | Exemplo                          |
|-------------------------|----------------------------|----------------------------------|
| Componentes             | PascalCase                 | `LoginPage`, `CampaignCard`      |
| Interfaces              | PascalCase                 | `CampaignContextType`            |
| Variáveis / Funções     | camelCase                  | `getHeaders`, `loadCampaigns`    |
| Constantes              | UPPER_CASE                 | `AUTH_STORAGE_KEY`               |
| Tipos                   | `interface` (não `type`)   | `interface CampaignInfo {}`      |
| Funções                 | Arrow functions            | `const fn = () => {}`            |
| Variáveis               | `const` por padrão         | `const campaigns = []`           |

`type` aliases SHOULD be used only for unions, intersections, or mapped/utility types
where an `interface` cannot express the shape.

**Rationale**: Uniform naming and declaration style let any contributor read any file
without context-switching, and make automated refactors and search reliable.

### V. Authentication & Security

Authentication and secret handling MUST follow these rules:

- Authorization header format: `Authorization: Basic {token}`.
- Token storage: localStorage under the exact key `"login-with-metamask:auth"`.
- Tokens MUST NOT be stored in cookies under any circumstance.
- Connection strings, API secrets, and any other backend credentials MUST NOT be
  embedded in frontend code or exposed via `VITE_*` variables.

**Rationale**: A single, explicit auth contract prevents accidental cookie-based
session bleed and ensures every service call uses the same header shape. Anything
shipped to the browser is public, so secrets belong on the backend only.

### VI. Environment Variables (VITE_ Prefix)

All frontend environment variables MUST use the `VITE_` prefix and be accessed via
`import.meta.env.VITE_*`. The legacy `REACT_APP_` prefix is forbidden.

| Variável             | Obrigatória | Descrição                                                 |
|----------------------|-------------|-----------------------------------------------------------|
| `VITE_API_URL`       | Sim         | URL base da API backend (Lofn — REST + GraphQL)           |
| `VITE_NAUTH_URL`     | Sim         | URL base da API REST do NAuth                             |
| `VITE_TENANT_ID`     | Não         | Identificador do tenant. Default `"emagine"`. Enviado no header `X-Tenant-Id` em toda requisição. |
| `VITE_SITE_BASENAME` | Não         | Base path do React Router                                 |

**Rationale**: Vite only exposes variables prefixed with `VITE_` to client code; any
other prefix silently produces `undefined` at runtime, leading to broken builds in
non-dev environments.

### VII. Single Locale — Português (pt-BR), Strings Hard-Coded

O site é **monolíngue em pt-BR**. Não existe seletor de idioma, fallback para inglês,
nem rotas/URLs por idioma. Toda string visível ao usuário (UI, mensagens de erro,
e-mails de notificação gerados no frontend) MUST estar em português brasileiro,
**escrita diretamente nos componentes JSX/TSX** — sem camada de tradução.

Regras operacionais:

- Bibliotecas de internacionalização (`i18next`, `react-i18next`, `i18next-http-backend`,
  `i18next-browser-languagedetector`, `react-intl`, `formatjs`, etc.) MUST NOT ser
  dependências do app. Removê-las quando encontradas.
- O diretório `public/locales/` MUST NOT existir. Strings ficam no JSX.
- Componentes de seleção de idioma (`LanguageSwitcher`, etc.) MUST NOT existir.
- Mensagens de erro/sucesso de UI ficam em strings literais pt-BR no ponto de uso.
- Documentos de produto (spec, plan, tasks, README, CLAUDE.md, comentários de PR)
  podem ser escritos em pt-BR ou en — esta restrição vale apenas para o **site final
  servido ao usuário** e o código fonte da app.

**Rationale**: O público-alvo do Circulou é Brasil; suporte a múltiplos idiomas
adiciona custo (tradução, QA, divergência de copy) sem retorno de produto. Manter
`i18next` apenas para um locale é overhead puro — adiciona dependência, suspense
de carregamento, indireção em todo `useTranslation`, e quebras silenciosas quando
uma chave erra ou o JSON não carrega. Strings literais pt-BR no JSX são mais
diretas, mais fáceis de revisar visualmente em PR, e acompanham o componente.

## Stack Rules & Restrictions

The following restrictions are part of the constitution and apply to every change:

- **Vite is the only allowed bundler.** CRA, manual Webpack setups, Parcel, esbuild
  CLIs, or any alternative bundler MUST NOT be introduced.
- **No external state-management libraries.** Redux, Zustand, MobX, Recoil, Jotai, and
  similar libraries MUST NOT be added. Application state lives in React Context API
  providers wired by the `react-architecture` skill.
- **No Bootstrap or jQuery.** `bootstrap`, `react-bootstrap`, `bootstrap-icons`,
  `jquery` e similares MUST NOT ser dependências do app. Tailwind é o único sistema
  de UI/grid permitido.
- **Sass não é dependência obrigatória.** Pode ser usado por ferramentas de build
  internas, mas o app principal estiliza via Tailwind + CSS puro/`@theme`.
- **Sem i18n.** `i18next`, `react-i18next`, `i18next-http-backend`,
  `i18next-browser-languagedetector`, `react-intl`, `formatjs` e similares MUST NOT
  ser dependências do app. Strings ficam hard-coded em pt-BR nos componentes
  (Princípio VII). O diretório `public/locales/` MUST NOT existir.
- **No Docker execution in the local environment.** Contributors MUST NOT run `docker`
  or `docker compose` locally; Docker is not accessible in this development setup.
  Containerized verification belongs to CI / deployment pipelines.
- **No `REACT_APP_` variables.** Only the `VITE_` prefix is recognized.

## Contribution Workflow & Checklist

Before opening a pull request, the contributor MUST verify:

- [ ] The `react-architecture` skill was invoked for any new frontend entity.
- [ ] All imports match the exact disk casing (`Contexts/`, `Services/`, `hooks/`,
      `types/`).
- [ ] Frontend environment variables use the `VITE_` prefix and are accessed via
      `import.meta.env.VITE_*`.
- [ ] Naming, declaration, and typing conventions from Principle IV are respected.
- [ ] No tokens, secrets, or connection strings are committed to the frontend.
- [ ] No new dependency violates the Stack Rules & Restrictions above.
- [ ] Estilização usa Tailwind utilities + tokens declarados em `theme.css`. Sem
      classes de Bootstrap (`btn-primary`, `card`, `col-*`, etc.) no código.
- [ ] Toda string visível ao usuário está em pt-BR (Princípio VII), **hard-coded
      diretamente no JSX**. Sem `useTranslation`, sem `t('...')`, sem dependência
      de `i18next` ou similar. Nenhum diretório `public/locales/`.

PR reviewers MUST block merge if any checklist item fails.

## Governance

- This constitution supersedes ad-hoc conventions, individual preferences, and tribal
  knowledge. When code conflicts with this document, the code MUST be changed.
- **Amendments**: Any change to this constitution requires (a) a PR modifying this
  file, (b) an updated Sync Impact Report at the top of the file, (c) a corresponding
  version bump per the policy below, and (d) reviewer approval.
- **Versioning policy** (semantic):
  - **MAJOR**: Backward-incompatible governance or principle removal/redefinition,
    including dropping a mandated tool, library, or convention.
  - **MINOR**: A new principle or section is added, or existing guidance is
    materially expanded.
  - **PATCH**: Wording, typo, or clarification edits with no semantic change.
- **Compliance review**: Every PR description MUST confirm the Contribution Workflow
  & Checklist above. Reviewers MUST verify Principle III (casing) and Principle VI
  (env prefix) on any touched imports or environment configuration.
- **Runtime guidance**: When agent-specific guidance files (e.g., `CLAUDE.md`,
  `AGENTS.md`) exist, they MUST defer to this constitution; conflicts are resolved in
  favor of the constitution.

**Version**: 3.0.0 | **Ratified**: 2026-04-02 | **Last Amended**: 2026-04-28
