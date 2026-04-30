# Página de Categoria — Spec de Design

Proposta de UI/UX para a **Página de Categoria** do Circulou (marketplace de moda
circular). Reaproveita 100% dos tokens, paleta e helpers da Home — qualquer
mudança na identidade da marca cascateia automaticamente para esta página via
`docs/design/home/tokens.css`.

## Arquivos desta entrega

- `index.html` — desktop standalone, exemplo "Calçados" com 4 subcategorias
  (Tênis, Sapatilhas, Botas, Sandálias), 12 produtos paginados, 7 lojas
  agregadas e estado vazio anexo como referência visual.
- `mobile.html` — recorte 360 px com ordem otimizada para mobile-commerce e
  drawer de filtros renderizado inline para preview.
- `README.md` — este documento.

Ambos os HTMLs abrem via `file://` sem build. Tokens vêm de
`../home/tokens.css` (link relativo). Fontes Google: Alfa Slab One + DM Sans +
DM Mono (mesmo conjunto da Home).

## Direção visual

Mantém a direção **editorial-folk com toques retro-futuristas** estabelecida na
Home (paleta oliva/âmbar/cedro/cobre/areia/cru, slab serif chubby, fotografia
editorial em aspect-ratio 3/4). A Página de Categoria é uma página
**utilitária** — então o tratamento se atenua: hero compacto em vez do hero
massivo, sol-blob menor (280 px), e o protagonismo passa para a grid de
produtos. O fundo da seção de lojas usa `--color-areia` para criar uma
respiração visual entre listagem e agregador, sem competir com o oliva
saturado da Home.

## Hierarquia visual

| Elemento | Token / valor | Uso |
| --- | --- | --- |
| `h1` título da categoria | `--text-display-lg` (clamp 2 → 3.25 rem) · `--font-display` · `--color-cedro` | "Calçados" |
| `h2` blocos (lojas, filtros) | `--text-display-md` · `--font-display` | "Brechós com calçados pra você" |
| `h3` agrupadores de filtro | `--font-mono` · `0.75 rem` · uppercase letter-spaced | "Faixa de preço", "Condição" |
| Body | `--text-body` · `--font-sans` | descrições, opções |
| Tag/badge editorial | `.circulou-tag` (já em tokens.css) | "○ Lojas parceiras" |
| Mono numérico | `--font-mono` | counts, preços antigos riscados, breadcrumb |
| Preço atual | `--font-display` `1.2 rem` · `--color-cobre` | destaca o preço sem precisar de bold |
| Brand label do produto | `--font-mono` `0.7 rem` uppercase · `--color-cedro` | "Nike", "Adidas" |

Espaçamentos seguem `--space-section-tight` para blocos secundários e
`--space-section` para a banda de lojas — exatamente como a Home.

## Layout responsivo

| Breakpoint | Comportamento |
| --- | --- |
| `≥ 1200 px` (desktop largo) | Layout 280 px + 1fr · grid de produtos 4-col · sidebar de filtros sticky abaixo do header (top: 200 px) · stores rail horizontal com 240 px por card |
| `1024 – 1199 px` (desktop estreito) | Layout idêntico mas grid de produtos 3-col |
| `768 – 1023 px` (tablet) | Sidebar de filtros oculta · grid 2-col · botão "Filtros" aparece na toolbar abrindo drawer · stores rail mantém scroll horizontal |
| `≤ 767 px` (mobile) | Ordem reordenada (ver `mobile.html`): hero compacto → subcategorias em chips horizontal-scroll → toolbar inline (count + sort + filtros) → grid 2-col → paginação compacta → bloco "Lojas" como `<details>` colapsável → FAB sticky com Ordenar+Filtrar (badge de contagem de filtros ativos) |

### Mobile drawer de filtros

- Renderizado como overlay full-screen (em prod), `role="dialog"` +
  `aria-labelledby` apontando para o `h2` "Filtros".
- Abertura por slide-in da direita (240 ms ease-out). Sob `prefers-reduced-motion`
  vira fade simples.
- Header sticky com botão "X" (44 × 44 px). Footer sticky com 2 botões: "Limpar
  tudo" (ghost) e "Aplicar (N)" (primary, mostra contagem prevista).
- Focus-trap obrigatório enquanto aberto. Tecla Esc fecha. Scroll do `<body>` é
  travado com `overflow: hidden` para não vazar.

## Estados

| Estado | Tratamento |
| --- | --- |
| Loading inicial | Skeleton de 12 cards no grid (mesma silhueta do `.product-card`, com `--color-areia-soft` no place do `.img` e barras chumbadas no `.body`). Subcategorias e contagem da categoria com `aria-busy="true"`. |
| Loading paginado (mudança de página) | Grid mantém densidade visual mas opacidade vai a 0.5 e cursor: progress. Mensagem `aria-live="polite"`: "Carregando página 2…". |
| Lista vazia | Bloco `.empty-ref-card`: ilustração âmbar (sol-blob com letra "○" em display), `h2` "Nada por aqui ainda", copy "Volte logo — peças novas chegam todo dia.", CTA primário "Voltar para a home". |
| Filtros muito restritivos | Mesma estrutura do vazio, mas com copy "Nenhuma peça com esses filtros. Tente afrouxar a faixa de preço ou tirar tamanhos." e CTA secundário "Limpar filtros". |
| Erro de rede | Card centralizado com ícone alerta, copy "Algo não funcionou. Tente recarregar." e botão "Tentar de novo" (primary). Não substitui o header/footer. |
| Página atual da paginação | `aria-current="page"`, fundo `--color-cedro`, texto `--color-cru`, fonte trocada para `--font-display` para diferença não baseada apenas em cor (WCAG SC 1.4.1). |
| Subcategoria ativa | `.subcat-chip--active`: fundo cedro + texto cru + count em pill cobre. |
| Filtro de tamanho aplicado | `aria-pressed="true"` + fundo cedro. Em desktop a contagem total atualiza no `.list-meta` com `aria-live="polite"`. |
| Hover/Focus em produto | `.circulou-card` (do tokens.css) ergue 3 px e ganha `--shadow-lg`. Foco visível: outline cobre 2 px + offset 3 px. |

## Acessibilidade

- **Foco**: todos os elementos interativos (chips, pills de tamanho, checkboxes,
  paginação, favoritar) têm `:focus-visible` com outline `--color-cobre` ou
  `--color-ambar` (botões primários) com offset ≥ 2 px e largura ≥ 2 px.
- **Touch target**: chips (40 px), filtros (mínimo 44 px), botões de paginação
  (44 × 44 px), FAB mobile (48 px). Todos passam ≥ 44 × 44 px da WCAG 2.5.5.
- **Contraste**: cobre `#AE531A` sobre cru `#F5ECE5` = 4.81:1 (AA); cedro `#4D2801`
  sobre cru = 11.6:1 (AAA). Texto cinza-mute (`#8A7E6F`) só é usado em rótulos
  de meta-info de tamanho ≥ 0.78 rem — passa AA Large.
- **ARIA**:
  - `breadcrumb` em `<nav aria-label="Caminho de navegação">` com `aria-current="page"` no último item.
  - Subcategoria atual em `aria-current="page"`.
  - Toolbar com `aria-live="polite"` no contador "Mostrando 1–12 de 247".
  - Paginação em `<nav aria-label="Paginação dos resultados">`, página atual com `aria-current="page"`, página anterior desabilitada com `aria-disabled="true"` + `tabindex="-1"`.
  - Pills de tamanho usam `aria-pressed`, não checkboxes — semanticamente são botões togle de filtro.
  - Switch "Apenas em promoção" usa `<input type="checkbox">` escondido + label clicável (padrão de switch acessível).
  - Drawer de filtros: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="m-filters-title"`, focus-trap, retorno de foco ao trigger ao fechar.
- **Navegação por teclado nos chips**: arrow-left / arrow-right percorrem os
  chips de subcategoria (padrão de "tablist" do WAI-ARIA, mesmo sem usar `role="tab"` — implementar via JS no porte React). Tab pula a banda inteira de chips e cai na toolbar.
- **Skip-link** "Pular para o conteúdo principal" → `#main`.
- **Reduced motion**: já coberto pelo `tokens.css` (zera transitions). Slide-in
  do drawer mobile e qualquer hover-lift do card ficam neutralizados.

## Componentes para o frontend criar / reutilizar

### Reutilizar (já existem ou foram especificados na Home)

- `ProductCard` — mesmo da Home, mas precisa aceitar 2 novos slots:
  - `badge?: { kind: 'sale' | 'new'; label: string }` — pill superior-esquerda
  - `store?: { name: string; activeCount?: number }` — rodapé com `○` separador
- `Pagination` — assume-se que já existe (US3). Caso não tenha, ver `Pagination` spec abaixo.
- `Breadcrumb` — provavelmente reutiliza algo de outras páginas (US1 mostrou loja-pelo-slug). Caso não exista, é trivial.
- `Layout` (header + footer + barra de categorias) — reuso direto da Home.
- Tokens, helpers `.circulou-card`, `.circulou-tag`, `.circulou-btn-primary`, `.circulou-btn-ghost` — vêm de `src/styles/theme.css` (porte do `tokens.css`).

### Novos componentes a criar

- `SubcategoryChip` — props: `{ name, slug, productCount, active?, href }`. Renderiza link com pill numérica. Suporta navegação por seta (← →) entre irmãos.
- `StoreInCategoryCard` — props: `{ store: { id, name, slug, city, logoUrl, description }; categoryProductCount: number }`. Card 240 px de largura usado no rail.
- `StoresRail` — wrapper de `StoreInCategoryCard[]` com scroll horizontal + scroll-snap. Em mobile vira `<details>` colapsável.
- `CategoryFiltersSidebar` — sticky em desktop. Em mobile/tablet, vira `<CategoryFiltersDrawer>` com mesmo conteúdo + headers/footers sticky.
- `PriceRangeSlider` — dual-thumb (em prod considerar `@radix-ui/react-slider`). Min/max em inputs sincronizados.
- `SizePillGroup` — `role="group"` com pills `aria-pressed`. Suporta múltipla seleção.
- `ConditionFilter` — checkbox-list com counts. Mapeia `productCondition` enum do Lofn (1..4 → "Nova c/ etiqueta", "Semi-nova", "Usada em ótimo estado", "Usada com sinais").
- `BrandFilter` — input search interno + checkbox-list paginada (mostra top 6, "Ver todas (N)" abre overlay).
- `SortSelect` — `<select>` nativo em desktop (suficiente). Em mobile vira bottom-sheet de opções (mais ergonômico).
- `EmptyCategoryState` — usa `EmptyStateCard` se já existir; senão criar.

### Estrutura de rota / dados (sugestão)

```
/categories/:categorySlug             → CategoryPage (esta tela)
/categories/:categorySlug?sub=tenis   → mesma tela, filtro pré-aplicado
/categories/:categorySlug?page=2      → paginação via querystring
```

Estado de filtros (URL-driven, idealmente via `useSearchParams`): `?sub=&size=&brand=&minPrice=&maxPrice=&condition=&onSale=&sort=&page=`.

## Backend gaps

> **Crítico**: o Lofn hoje só conhece categoria-por-loja (`CategoryInfo {
> categoryId, slug, name, storeId, productCount }`). A categoria-marketplace
> agregada **não existe**. Sem os endpoints abaixo, a página renderiza só com
> mock data. Estes itens viram backlog do time backend (sugestão de
> nomenclatura: `LOFN-G##`, "G" = Global / agregação cross-store).

### LOFN-G01 — Árvore global de categorias do marketplace

Endpoint: `GET /marketplace/categories`

Retorna a árvore canônica do marketplace, **independente de loja**. Estrutura:

```json
[
  {
    "categoryId": "uuid",
    "slug": "calcados",
    "name": "Calçados",
    "totalActiveProducts": 247,
    "totalActiveStores": 42,
    "subcategories": [
      { "categoryId": "uuid", "slug": "tenis", "name": "Tênis", "totalActiveProducts": 124 },
      { "categoryId": "uuid", "slug": "sapatilhas", "name": "Sapatilhas", "totalActiveProducts": 38 },
      { "categoryId": "uuid", "slug": "botas", "name": "Botas", "totalActiveProducts": 52 },
      { "categoryId": "uuid", "slug": "sandalias", "name": "Sandálias", "totalActiveProducts": 33 }
    ]
  }
]
```

Notas:
- Hoje cada categoria está atrelada a uma `storeId`. Precisa-se de uma tabela
  `marketplace_categories` (canônica) + relação N-N `store_category_mapping`
  ligando a categoria-da-loja à categoria global (com fallback heurístico de
  slug match na primeira execução).
- `totalActiveProducts` precisa contar produtos ativos (não vendidos, não
  ocultos, da categoria-da-loja vinculada à categoria global).
- Cacheável agressivamente (1 h TTL bom o suficiente).

### LOFN-G02 — Listagem paginada de produtos por categoria global

Endpoint: `GET /marketplace/categories/:slug/products`

Query params:
- `page`, `pageSize`
- `sub` (slug da subcategoria, opcional)
- `size[]`, `brand[]`, `condition[]` (multi-valor)
- `minPrice`, `maxPrice`
- `onSale` (bool)
- `sort` (enum: `relevance` | `price-asc` | `price-desc` | `discount` | `recent`)

Retorno: `{ items: ProductSummary[], page, pageSize, total, totalPages }`.

Diferença vs. `GET /shop/:slug/products` atual: cruza N lojas, exige índice
global (categoria → produtos ativos cross-store) e ordenação por relevância
não-trivial (precisa pelo menos um score base — ex. recência + popularidade).

### LOFN-G03 — Lojas com produtos em uma categoria global

Endpoint: `GET /marketplace/categories/:slug/stores`

Retorno: `[{ storeId, slug, name, logoUrl, city, state, description, activeCount }]`,
ordenado por `activeCount DESC` (top-N por padrão, e.g. top 50).

Notas:
- `activeCount` é a contagem de produtos ativos **daquela loja** **dentro da
  categoria global** (cruzando com a árvore G01). Cache por categoria-slug.
- A página paga 1 round-trip a mais; vale a pena vs. embutir em G01 (tamanho
  do payload).

### LOFN-G04 — Facets de filtro com contagem dinâmica

Endpoint: `GET /marketplace/categories/:slug/facets` (ou inline em G02 com
`?include=facets`)

Retorno:
```json
{
  "brands": [{ "name": "Nike", "count": 31 }, { "name": "Adidas", "count": 22 }, …],
  "sizes": [{ "value": "36", "count": 18 }, { "value": "37", "count": 22 }, …],
  "conditions": [{ "value": 1, "count": 38 }, { "value": 2, "count": 112 }, …],
  "priceRange": { "min": 19, "max": 1499, "histogram": [/* opcional */] }
}
```

Sem isto, a sidebar não consegue mostrar os counts realistas ao lado de cada
opção (UX padrão de marketplace). Em prod precisa atualizar conforme outros
filtros são aplicados (multi-facet com exclusion-set por dimensão — comum em
Elasticsearch / Algolia).

### LOFN-G05 — Estatística da categoria (count topo da página)

Pequeno mas explícito: `totalActiveProducts` no endpoint G01 é o que alimenta
o `<strong>247</strong> peças circulando agora` no hero. Garantir que essa
contagem é a **mesma** que sai de G02 com filtros vazios — divergência aqui é
um bug de credibilidade da plataforma.

### Observações para o time backend

- Esta árvore global precisa de uma decisão de produto antes da implementação:
  a categoria-da-loja é editável livre pelo lojista? Se sim, precisa de
  curadoria/mapping manual ou heurística para LOFN-G01. Se não (catálogo
  fechado), o problema é só de schema.
- Considerar materializar contagens (`totalActiveProducts`, `activeCount` por
  loja) em uma view ou tabela com refresh agendado — recálculo on-the-fly em
  toda request da home da categoria não escala.
- Indexação textual do filtro de marca (LOFN-G04 + busca interna no chip
  "Buscar marca…") é um caso típico para Elastic / Meilisearch / Postgres
  trigram.

## Notas de porte para Tailwind v4

Quando o frontend portar este mockup para `src/styles/theme.css` + componentes
React + Tailwind v4:

- Todas as `--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--shadow-*`,
  `--space-*` já vêm do `theme.css` da Home (que herda de `tokens.css`). Nada
  a adicionar.
- Helpers `.circulou-card`, `.circulou-tag`, `.circulou-btn-primary`,
  `.circulou-btn-ghost` continuam aplicáveis.
- Classes próprias deste mockup (`.subcat-chip`, `.product-card`,
  `.filter-group`, `.size-pill`, `.page-btn`, etc.) devem ser reescritas como
  utility classes Tailwind ou como classes nomeadas em `@layer components`. A
  decisão final é do `frontend-react-developer` (CLAUDE.md proíbe Bootstrap em
  código novo, então Tailwind utility é o caminho default).
- O JS de focus-trap do drawer mobile, navegação por seta nos chips e
  arrow-key dos pills de tamanho cabem dentro do hook ou Radix-equivalente
  (e.g. Radix Toggle Group para os pills, Radix Dialog para o drawer).
- Toaster (`sonner`) já está no projeto — usar para feedback de "Filtros
  aplicados (164 peças)" quando o usuário aplica no mobile.

## Dependências externas declaradas neste mockup

- Google Fonts: já carregadas pelos HTMLs (Alfa Slab One + DM Sans + DM Mono).
- Imagens: Unsplash (placeholders editoriais). Em prod, substituir por
  `productImageUrl` do Lofn (que já é S3 via zTools).

Nenhuma outra dependência foi introduzida — sem ícones de biblioteca, sem
SVGs externos, sem JS além do que o `tokens.css` da Home traz.
