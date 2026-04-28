<!--
SYNC IMPACT REPORT
==================
Version change: 2.0.0 → 2.1.0
Bump rationale: MINOR — Adicionada nova restrição de produto (Princípio VII:
Single Locale — Português pt-BR). Nenhum princípio existente foi removido ou
redefinido; i18next continua na stack como camada de gestão de strings, mas o
site fica restrito a um único idioma. Bump MINOR conforme política.

Modified principles: nenhum (II permanece como em 2.0.0).
Added sections:
  - Princípio VII: Single Locale — Português (pt-BR).
  - Item correspondente em Stack Rules & Restrictions.
  - Item correspondente no Contribution Workflow & Checklist.
Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md       — Genérico; sem ajuste.
  ✅ .specify/templates/spec-template.md       — Genérico; sem ajuste.
  ✅ .specify/templates/tasks-template.md      — Genérico; sem ajuste.
  ✅ specs/001-circulou-marketplace/plan.md    — i18n descrito como pt-BR único; sem ajuste necessário.
  ✅ CLAUDE.md                                  — Sem referência a multi-idioma; sem ajuste.
  ✅ README.md                                  — Sem referência a multi-idioma; sem ajuste.

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
| i18next         | 25.x     | Gestão centralizada de strings (pt-BR)    |
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

| Variável             | Obrigatória | Descrição                               |
|----------------------|-------------|-----------------------------------------|
| `VITE_API_URL`       | Sim         | URL base da API backend                 |
| `VITE_SITE_BASENAME` | Não         | Base path do React Router               |

**Rationale**: Vite only exposes variables prefixed with `VITE_` to client code; any
other prefix silently produces `undefined` at runtime, leading to broken builds in
non-dev environments.

### VII. Single Locale — Português (pt-BR)

O site é **monolíngue em pt-BR**. Não existe seletor de idioma, fallback para inglês,
nem rotas/URLs por idioma. Toda string visível ao usuário (UI, mensagens de erro,
e-mails de notificação gerados no frontend) MUST estar em português brasileiro.

Regras operacionais:

- O bundle de tradução `public/locales/pt-BR/translation.json` é o **único** locale
  carregado. Outros diretórios (`en`, `es`, `pt-PT`, …) MUST NOT ser criados.
- `i18next` permanece como mecanismo de centralização de strings (chaves estáveis,
  pluralização, interpolação) — mas configurado com `lng: 'pt-BR'` fixo e
  `fallbackLng: 'pt-BR'`. Não habilitar `i18next-browser-languagedetector` nem
  `i18next-http-backend` para múltiplos locales.
- Componentes de seleção de idioma (`LanguageSwitcher`, etc.) MUST NOT existir.
- Documentos de produto (spec, plan, tasks, README, CLAUDE.md, comentários de PR)
  podem ser escritos em pt-BR ou en — esta restrição vale apenas para o **site final
  servido ao usuário**.

**Rationale**: O público-alvo do Circulou é Brasil; suporte a múltiplos idiomas
adiciona custo (tradução, QA, divergência de copy) sem retorno de produto. Manter
`i18next` em vez de strings hard-coded ainda paga porque centraliza copy num único
arquivo, facilitando revisão e ajuste textual sem caça em dezenas de `.tsx`.

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
- **Sem multi-idioma.** Pacotes auxiliares de detecção/troca de locale
  (`i18next-browser-languagedetector`, `i18next-http-backend` configurado para
  múltiplos namespaces de idioma, etc.) MUST NOT ser usados para expor mais de um
  idioma. Nenhum diretório `public/locales/<lang>/` além de `pt-BR/`.
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
- [ ] Toda string visível ao usuário está em pt-BR (Princípio VII). Nenhuma string
      em inglês ou outro idioma vaza para a UI; nenhum locale adicional foi
      adicionado em `public/locales/`.

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

**Version**: 2.1.0 | **Ratified**: 2026-04-02 | **Last Amended**: 2026-04-28
