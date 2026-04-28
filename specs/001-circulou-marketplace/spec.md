# Feature Specification: Circulou — Marketplace Unificado de Produtos

**Feature Branch**: `001-circulou-marketplace`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Crie um website em react: Esse sistema é um marketing place chamado 'Circulou', deve ser uma busca por produtos de várias lojas. Para autenticação de usuário, deve usar o pacote npm nauth-react. Use o pacote npm lofn-react para gerenciar a parte de exposição dos produtos na loja. Pode se basear totalmente no projeto C:\repos\Lofn\lofn-react\example-app. Mas nesse projeto as lojas estão separadas, no 'Circulou' as buscas e filtros devem ser unificadas. A API do Lofn está em c:\repos\Lofn\Lofn. Use o agente 'frontend-react-developer'."

## Clarifications

### Session 2026-04-27

- Q: Se o mesmo usuário autenticado alterar o carrinho em dois dispositivos simultaneamente, como o sistema reconcilia o estado? → A: Last-write-wins do carrinho inteiro — a última gravação sobrescreve todo o estado anterior.
- Q: O termo digitado na busca unificada é comparado contra quais campos do produto? → A: Apenas o nome do produto.
- Q: Como o filtro de categoria deve se comportar na busca unificada, dado que cada loja mantém suas próprias categorias? → A: Não oferecer filtro de categoria na busca unificada — categoria só funciona dentro da página de uma loja específica.
- Q: Após o checkout, o usuário consegue voltar a ver os pedidos confirmados (histórico, e-mail, etc.)? → A: Não — a confirmação só fica disponível enquanto a aba/sessão estiver aberta; o usuário é responsável por anotar ou fotografar os identificadores. Não há tela de histórico nem envio de e-mail neste escopo.
- Q: Qual a ordem de grandeza do catálogo e do tráfego alvo para o MVP? → A: Muito pequeno (POC/demo): menos de 1.000 produtos agregados, menos de 10 lojas, baixíssimo tráfego.
- Q: A implementação pode introduzir novos endpoints no backend Lofn ou deve se restringir aos endpoints existentes? → A: Restringir-se aos endpoints existentes da API Lofn (REST e `POST /graphql` público) e do NAuth. Quando uma capacidade exigida pela spec não existe no backend hoje, o frontend usa um **MOCK** local controlado e o gap é registrado no documento `lofn-api-gaps.md` para implementação futura no Lofn — sem alterar a API neste escopo.
- Q: Quando um visitante anônimo tenta adicionar um produto ao carrinho, onde fica o item até o login concluir e como ele é integrado a um carrinho preexistente do usuário? → A: Buffer único pré-login em `sessionStorage`; ao logar, o buffer é mesclado ao carrinho do usuário — mesmo produto soma quantidades respeitando o `limit`; buffer é descartado em seguida.
- Q: A busca textual dispara automaticamente enquanto o usuário digita ou apenas quando ele confirma o termo? → A: Apenas ao confirmar — Enter ou botão "Buscar". Nenhuma chamada de busca é feita enquanto o usuário digita.
- Q: O MVP precisa exibir aviso/consentimento explícito sobre os dados pessoais (endereço, carrinho) persistidos em `localStorage`? → A: Não no MVP — tratamento como dado de aplicação típico de e-commerce; conformidade com LGPD (transparência, base legal, consentimento, exclusão) fica como dívida explícita a ser endereçada antes do release de produção.
- Q: O que a home exibe quando nenhuma loja tem produtos `featured = true`? → A: Mostrar `featured` primeiro; se a página de 12 não preencher, completar com produtos não-`featured` mais recentes. A seção é rotulada "Em destaque" quando há ao menos um produto `featured` na primeira página, e "Catálogo" caso contrário.
- Q: Como a UX se comporta quando filtros/ordenação client-side (LOFN-G01..G03) reduzem a página corrente abaixo de 12 itens? → A: Pré-fetch progressivo das páginas seguintes do servidor até completar 12 itens visíveis pós-filtro, com teto de **5 páginas / 60 itens buscados** por interação. Atingido o teto sem encher 12, exibir o que houver com contagem ("X resultados encontrados") e botão "Buscar mais" que avança o teto em mais 5 páginas a cada clique.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buscar produtos em todas as lojas de uma só vez (Priority: P1)

Um visitante chega ao Circulou querendo encontrar um produto específico (ex.: "café gourmet") sem saber em qual loja ele está disponível. Em uma única caixa de busca na home, ele digita o termo e recebe uma lista paginada com todos os produtos correspondentes vindos de qualquer loja cadastrada na plataforma. Para cada item, ele vê nome, foto, preço, eventual desconto e o nome da loja de origem.

**Why this priority**: É a proposta de valor central que diferencia o Circulou do exemplo `lofn-react/example-app` (que isola cada loja). Sem busca unificada, o produto é apenas um agregador de links — isto é o produto mínimo viável.

**Independent Test**: Cadastrar produtos com o mesmo termo em duas ou mais lojas distintas via API Lofn, abrir a home do Circulou, digitar o termo e confirmar que produtos das diferentes lojas aparecem juntos no resultado, com o nome da loja visível em cada item.

**Acceptance Scenarios**:

1. **Given** existem produtos contendo o termo "café" em pelo menos duas lojas distintas, **When** o visitante digita "café" no campo de busca da home e confirma, **Then** o sistema retorna uma lista paginada misturando produtos de todas as lojas que contêm o termo, com nome do produto, imagem, preço, desconto (se houver) e nome da loja de origem em cada card.
2. **Given** o termo buscado não existe em nenhuma loja, **When** o visitante confirma a busca, **Then** o sistema exibe um estado vazio com mensagem "Nenhum produto encontrado para '{termo}'" e mantém o termo no campo para edição.
3. **Given** uma busca retorna mais de 12 resultados, **When** o visitante chega ao fim da primeira página, **Then** o sistema permite navegar para a próxima página mantendo o termo de busca e os filtros ativos.
4. **Given** o visitante não digitou termo de busca, **When** ele acessa a home, **Then** o sistema exibe a primeira página (12 itens) priorizando produtos com `featured = true` de várias lojas; **And** se houver menos de 12 produtos `featured` disponíveis, a página é completada com produtos não-`featured` mais recentes; **And** o título da seção é "Em destaque" quando há ao menos um produto `featured` na primeira página, e "Catálogo" quando não houver nenhum.

---

### User Story 2 - Refinar a busca com filtros e ordenação unificados (Priority: P2)

Após uma busca, o visitante quer reduzir os resultados aplicando critérios — por loja específica, por faixa de preço, somente itens em promoção — e reordenar (mais barato, mais novo, com maior desconto). Os filtros se aplicam ao conjunto unificado, não a uma loja por vez. Filtro por categoria não está disponível na busca unificada (categoria é uma taxonomia interna a cada loja); ele se torna disponível apenas dentro da página de uma loja específica.

**Why this priority**: Filtros e ordenação são essenciais para que a busca em um catálogo grande seja utilizável. Sem eles, listas longas tornam-se inúteis. Construído sobre o US1.

**Independent Test**: Com produtos cadastrados em pelo menos duas lojas e em pelo menos duas categorias, abrir a home, aplicar combinação de filtros (loja + faixa de preço) e ordenação (preço crescente), confirmar que os resultados refletem as restrições e a ordem solicitada.

**Acceptance Scenarios**:

1. **Given** uma busca retornou produtos de várias lojas, **When** o visitante seleciona uma loja específica no filtro lateral, **Then** o resultado é refeito mostrando apenas produtos dessa loja, mantendo o termo de busca.
2. **Given** uma busca retornou produtos com diferentes preços, **When** o visitante define uma faixa de preço mínimo e máximo, **Then** apenas produtos cujo preço (após desconto) cai dentro da faixa permanecem.
3. **Given** o visitante alterou a ordenação para "Menor preço", **When** o resultado é renderizado, **Then** os produtos aparecem ordenados crescentemente pelo preço final.
4. **Given** filtros ativos, **When** o visitante clica em "Limpar filtros", **Then** todos os filtros são removidos e a lista volta ao resultado da busca textual atual.
5. **Given** o visitante marca "Apenas em promoção", **When** o resultado é refeito, **Then** apenas produtos com desconto maior que zero permanecem.

---

### User Story 3 - Autenticar para comprar e gerenciar conta (Priority: P2)

Um visitante que decidiu comprar precisa criar uma conta ou entrar em uma conta existente. Ele acessa o cadastro, informa nome, e-mail e senha, recebe confirmação e passa a estar logado. Em visitas seguintes, faz login com e-mail e senha. Pode redefinir a senha caso a esqueça e atualizar dados básicos do perfil.

**Why this priority**: Sem autenticação, não é possível persistir carrinho, endereços ou histórico — bloqueia todo o funil de compra. É P2 porque a descoberta (P1) entrega valor mesmo a visitantes anônimos.

**Independent Test**: Criar uma conta nova com e-mail novo, deslogar, logar de volta com as mesmas credenciais, confirmar acesso ao perfil; usar fluxo de "esqueci minha senha" e validar reset.

**Acceptance Scenarios**:

1. **Given** um visitante anônimo na home, **When** ele clica em "Entrar" e em seguida "Criar conta" e preenche nome, e-mail e senha válidos, **Then** a conta é criada e ele é redirecionado autenticado para a home.
2. **Given** um usuário já cadastrado, **When** ele informa e-mail e senha corretos no login, **Then** entra na sessão e seu nome aparece no cabeçalho.
3. **Given** o usuário esqueceu a senha, **When** ele solicita "Esqueci minha senha" informando seu e-mail, **Then** recebe instruções para redefinir e consegue entrar com a nova senha.
4. **Given** o usuário está logado, **When** ele acessa "Meu perfil", **Then** consegue ver e atualizar nome e dados básicos da conta.
5. **Given** o token de sessão expirou, **When** o usuário tenta uma ação restrita, **Then** o sistema redireciona para o login mantendo a intenção original (retornar ao fluxo após reentrar).

---

### User Story 4 - Ver detalhes do produto e adicionar ao carrinho (Priority: P3)

Ao clicar em um produto da listagem, o usuário vê uma página de detalhe com galeria de imagens, descrição completa, preço com eventual desconto, quantidade desejada (respeitando o limite por compra) e a loja vendedora. Pode adicionar ao carrinho sem precisar trocar de loja manualmente — o carrinho do Circulou aceita produtos de várias lojas em uma sessão.

**Why this priority**: Conecta descoberta (P1/P2) ao funil transacional. Depende de US3 para persistir o carrinho do usuário logado.

**Independent Test**: A partir de um resultado de busca, abrir a página de detalhe de um produto, escolher quantidade e adicionar ao carrinho; abrir a página de carrinho e confirmar a presença do item com a loja correta atribuída; repetir com um produto de outra loja e confirmar que ambos coexistem no carrinho.

**Acceptance Scenarios**:

1. **Given** um produto possui múltiplas imagens, **When** o usuário abre a página de detalhe, **Then** vê uma galeria com imagem principal e miniaturas navegáveis.
2. **Given** o produto tem `limit` definido (ex.: máximo 3 unidades por compra), **When** o usuário tenta selecionar quantidade acima desse limite, **Then** o seletor não permite e indica o motivo.
3. **Given** o usuário logado adiciona um produto ao carrinho, **When** ele depois adiciona um produto de outra loja, **Then** ambos aparecem no carrinho agrupados por loja de origem.
4. **Given** o usuário não está logado e tenta adicionar ao carrinho, **When** confirma a ação, **Then** o item é guardado em um buffer pré-login (escopo de aba/sessão) e o sistema redireciona ao login; **And** ao concluir o login, o buffer é mesclado ao carrinho do usuário (mesmo produto soma quantidades respeitando o `limit`) e o buffer é descartado, retornando à página do produto com o carrinho atualizado.
5. **Given** o produto está marcado como inativo entre o momento da listagem e a página de detalhe, **When** o usuário acessa a URL, **Then** o sistema mostra mensagem de "Produto indisponível" sem botão de adicionar.

---

### User Story 5 - Concluir compra com endereço e confirmação (Priority: P3)

Com itens no carrinho, o usuário logado vai para o checkout, escolhe (ou cadastra) um endereço de entrega, revisa o resumo (subtotal, descontos, total agrupado por loja), confirma e recebe uma página de confirmação com identificador do pedido por loja.

**Why this priority**: Fecha o ciclo de compra. P3 porque o sistema já entrega valor sem checkout — o checkout vira essencial somente quando descoberta + carrinho estão validados.

**Independent Test**: Logar, adicionar produtos de duas lojas ao carrinho, ir ao checkout, cadastrar endereço novo, confirmar pedido, e ver a tela de confirmação listando uma ordem por loja com seus respectivos itens.

**Acceptance Scenarios**:

1. **Given** o usuário tem itens de duas lojas no carrinho, **When** ele inicia o checkout, **Then** o resumo mostra subtotais e totais agrupados por loja, com o total geral somando todos.
2. **Given** o usuário não tem endereços cadastrados, **When** entra no checkout, **Then** o sistema solicita o cadastro de pelo menos um endereço antes de permitir confirmar.
3. **Given** o usuário tem múltiplos endereços salvos, **When** chega ao checkout, **Then** consegue escolher um deles como endereço de entrega.
4. **Given** o usuário confirma o pedido, **When** a confirmação é processada, **Then** o sistema apresenta uma tela com identificador do pedido por loja e instruções de acompanhamento.
5. **Given** uma das lojas tornou-se inativa entre o carrinho e o checkout, **When** o usuário tenta confirmar, **Then** o sistema bloqueia e indica quais itens precisam ser removidos.

---

### User Story 6 - Visitar a loja específica de um produto (Priority: P3)

Ao ver um produto que o agradou, o usuário pode clicar no nome da loja para abrir uma página dedicada àquela loja, com sua identidade visual (logo/nome) e o catálogo restrito a ela — útil para descobrir mais produtos do mesmo vendedor.

**Why this priority**: Reforça relacionamento com lojas e fideliza, mas não bloqueia o ciclo de compra.

**Independent Test**: Em um card de produto, clicar no nome da loja e confirmar que a página resultante exibe somente produtos daquela loja, com nome/logo da loja em destaque.

**Acceptance Scenarios**:

1. **Given** o usuário está em qualquer listagem, **When** clica no nome da loja em um card, **Then** é levado a uma página da loja onde a busca/filtro passam a operar apenas dentro daquela loja.
2. **Given** está na página de uma loja, **When** clica em "Voltar à busca em todas as lojas", **Then** retorna à busca unificada com os filtros anteriores preservados.

---

### Edge Cases

- O termo de busca contém apenas espaços ou caracteres especiais — o sistema deve tratar como busca vazia em vez de erro.
- Existem produtos com nomes/descrições contendo o termo em outro idioma ou com acentuação diferente — a busca deve tolerar diacríticos comuns do português.
- O catálogo total cresce além do volume-alvo do MVP (mais de 1.000 produtos ou mais de 10 lojas) — a paginação deve continuar correta e a UI nunca tentar carregar a lista inteira; ganhos de performance além desse ponto podem requerer revisão arquitetural (cache, indexador), fora do escopo do MVP.
- Uma loja é desativada enquanto o usuário tem itens dela no carrinho — o carrinho deve sinalizar visualmente os itens indisponíveis sem perder os demais.
- Um produto fica sem estoque (`limit` reduzido) entre a busca e a tentativa de adicionar — o sistema deve recusar a adição com mensagem clara.
- O usuário troca de dispositivo logado — o carrinho persistido deve voltar a aparecer.
- O usuário tem o carrinho aberto em dois dispositivos simultaneamente e altera ambos — a última gravação prevalece (last-write-wins) e sobrescreve completamente o estado anterior; alterações feitas no dispositivo cuja gravação foi sobrescrita são perdidas.
- O usuário fecha a aba ou navega para fora da página de confirmação — os identificadores dos pedidos não são recuperáveis pelo sistema (FR-025 é efêmero); a tela de confirmação MUST advertir o usuário visualmente para anotar/capturar os identificadores antes de sair.
- Visitante anônimo adiciona itens ao carrinho e fecha a aba antes de logar — o buffer pré-login (FR-017) vive apenas no escopo da aba/sessão; ao reabrir, o anônimo começa com buffer vazio. Esse comportamento é intencional para evitar persistência sem consentimento de identidade.
- Falha de rede durante busca/checkout — o sistema deve preservar termo, filtros e itens do carrinho e oferecer "tentar novamente".
- Imagens de produto ausentes ou quebradas — exibir imagem-placeholder neutra sem quebrar o layout.
- Sessão expirada durante o checkout — o sistema redireciona ao login e retorna ao mesmo passo do checkout.
- Filtro/ordenação client-side resulta em < 12 itens visíveis — o sistema pré-busca páginas seguintes (até 5 páginas / 60 itens por interação); se ainda assim não chegar a 12, exibe o que houver com contagem e botão "Buscar mais" (FR-007). Não exibir simplesmente "vazio" enquanto houver páginas no servidor não exploradas.
- Produtos do tipo assinatura (com `frequency` > 0) e produtos avulsos no mesmo carrinho — o resumo deve deixar claro o que é cobrança recorrente versus única.

## Requirements *(mandatory)*

### Functional Requirements

**Descoberta unificada**

- **FR-001**: O sistema MUST permitir que qualquer visitante (autenticado ou não) execute uma busca textual única que retorna produtos de todas as lojas ativas em uma única lista. O match textual MUST ser feito **apenas contra o nome do produto** — descrição, categoria e nome da loja NÃO participam do casamento. A comparação MUST ser case-insensitive e tolerante a diacríticos comuns do português (ex.: "cafe" casa com "café"). A busca MUST disparar **somente quando o usuário confirmar o termo** (tecla Enter ou clique em botão "Buscar"); o sistema NÃO MUST executar busca incremental enquanto o usuário digita nem oferecer dropdown de sugestões instantâneas.
- **FR-002**: Cada item da lista de resultados MUST exibir, no mínimo: nome do produto, imagem principal (ou placeholder), preço, desconto (quando houver) e nome da loja de origem com link para a página da loja.
- **FR-003**: O sistema MUST suportar paginação por blocos de tamanho fixo (padrão 12 itens por página), preservando termo de busca e filtros ao navegar entre páginas.
- **FR-004**: O sistema MUST oferecer, na home, uma listagem inicial paginada (12 itens) quando o visitante ainda não digitou termo de busca. A composição da página MUST priorizar produtos com `featured = true` de várias lojas; se a quantidade de `featured` disponíveis for menor que 12, a página MUST ser completada com produtos não-`featured` mais recentes (ordenados decrescentemente por data de criação) até preencher 12 itens. O título da seção MUST ser **"Em destaque"** quando houver ao menos um produto `featured` na primeira página e **"Catálogo"** quando não houver nenhum, garantindo que a home nunca exibe estado vazio enquanto existir qualquer produto ativo no marketplace.

**Filtros e ordenação**

- **FR-005**: O sistema MUST permitir filtrar a busca unificada por: loja específica, faixa de preço (mínimo e máximo) e "apenas em promoção". Filtro por categoria NÃO está disponível na busca unificada — ver FR-011 para o filtro de categoria escopo de loja.
- **FR-006**: O sistema MUST permitir ordenar a busca por: relevância (padrão), menor preço, maior preço, maior desconto e mais recentes. "Relevância" é definida sobre o casamento do termo no nome do produto (match exato do termo > prefixo > substring > sem termo, e em seguida desempatado por produtos em destaque (`featured`) e por mais recentes).
- **FR-007**: Os filtros e a ordenação MUST se aplicar ao conjunto unificado de produtos (não a uma loja por vez), e MUST poder ser combinados. Enquanto faixa de preço, "apenas em promoção" e ordenação operam client-side (gaps LOFN-G01..G03), o sistema MUST executar **pré-fetch progressivo** das páginas seguintes do servidor até completar 12 itens visíveis pós-filtro, com teto de **5 páginas (60 itens) buscadas por interação de filtro/ordenação**. Quando o teto é atingido sem alcançar 12 itens, o sistema MUST exibir os itens encontrados, a contagem corrente ("X resultados encontrados") e um botão **"Buscar mais"** que estende o teto em mais 5 páginas a cada clique. Esse comportamento é transitório: deixa de ser necessário quando os gaps G01..G03 forem fechados no backend.
- **FR-008**: O sistema MUST oferecer uma ação visível de "Limpar filtros" que devolve a busca ao estado padrão preservando apenas o termo textual.
- **FR-009**: O sistema MUST refletir filtros e termo na URL para que a mesma busca seja compartilhável e reproduzível por link.

**Detalhe de produto e loja**

- **FR-010**: O sistema MUST disponibilizar uma página de detalhe por produto exibindo: galeria de imagens, descrição completa em texto formatado, preço, desconto, limite de quantidade por compra, tipo (avulso ou recorrente com periodicidade), categoria e identificação da loja vendedora.
- **FR-011**: O sistema MUST disponibilizar uma página por loja, listando os produtos somente dessa loja e permitindo aplicar busca e filtros restritos a ela. Dentro da página de uma loja, o sistema MUST oferecer **filtro por categoria** (usando as categorias internas da própria loja) além dos filtros do FR-005.
- **FR-012**: A página da loja MUST exibir nome e logo da loja em destaque.

**Autenticação e perfil**

- **FR-013**: O sistema MUST permitir que um visitante crie conta informando nome, e-mail e senha, e em seguida fique autenticado.
- **FR-014**: O sistema MUST permitir login por e-mail e senha, e oferecer fluxo de "esqueci minha senha" e troca de senha autenticada.
- **FR-015**: O sistema MUST permitir ao usuário autenticado visualizar e atualizar dados básicos do perfil (nome) e gerenciar a lista de endereços de entrega (criar, atualizar, remover, escolher um como padrão).
- **FR-016**: O sistema MUST tratar a expiração da sessão sem perda de contexto: redireciona ao login e, após reentrar, retoma a tela e a ação que estavam em andamento.

**Carrinho multi-loja**

- **FR-017**: O sistema MUST permitir que o usuário autenticado mantenha um único carrinho contendo produtos de múltiplas lojas simultaneamente. Antes do login, o sistema MUST oferecer um **buffer pré-login** (escopo de aba/sessão) que retém itens cuja adição foi tentada por um visitante anônimo; ao concluir a autenticação, o sistema MUST mesclar o buffer ao carrinho do usuário (somando quantidades para o mesmo produto, sempre respeitando o `limit` por compra) e descartar o buffer.
- **FR-018**: O carrinho MUST exibir os itens agrupados por loja, mostrando subtotal por loja além do total geral.
- **FR-019**: O sistema MUST persistir o carrinho do usuário entre sessões e dispositivos enquanto o usuário estiver autenticado. Em caso de alterações concorrentes a partir de múltiplos dispositivos, a estratégia de reconciliação é **last-write-wins por carrinho inteiro**: a última gravação recebida sobrescreve completamente o estado anterior do carrinho. Não há merge por item nem prompt de conflito.
- **FR-020**: O sistema MUST respeitar o limite de quantidade por produto (`limit`) ao permitir aumentar a quantidade no carrinho.
- **FR-021**: Se um produto ou loja se tornar inativo após estar no carrinho, o sistema MUST sinalizar visualmente o item como indisponível sem removê-lo automaticamente até a confirmação do usuário.

**Checkout**

- **FR-022**: O sistema MUST exigir autenticação antes de iniciar o checkout.
- **FR-023**: O sistema MUST exigir ao menos um endereço de entrega antes de permitir confirmar o pedido.
- **FR-024**: Ao confirmar, o sistema MUST gerar um pedido por loja envolvida no carrinho (já que cada loja é um vendedor independente), enviando à loja apenas os itens correspondentes.
- **FR-025**: O sistema MUST exibir uma página de confirmação que lista os identificadores de cada pedido gerado (um por loja) com seus respectivos itens, valores e endereço de entrega. Esta página é **efêmera**: ela só fica acessível enquanto a aba/sessão estiver aberta. O sistema NÃO MUST persistir uma tela de "Meus pedidos" nem enviar uma cópia por e-mail neste escopo — cabe ao usuário anotar/capturar os identificadores enquanto a página estiver visível.
- **FR-026**: O sistema MUST impedir a confirmação se algum item ou loja estiver indisponível, listando claramente o que precisa ser removido ou ajustado.

**Não-funcionais visíveis ao usuário**

- **FR-027**: A interface MUST estar em português do Brasil (pt-BR) por padrão e MUST estar preparada para receber traduções adicionais.
- **FR-028**: O sistema MUST funcionar em telas a partir de 360 px de largura (smartphones modernos) sem degradar a navegação e a leitura.
- **FR-029**: O sistema MUST atender níveis de acessibilidade básicos: navegação por teclado nas ações principais (busca, filtros, paginação, adicionar ao carrinho, checkout), foco visível e contraste mínimo legível.
- **FR-030**: O sistema MUST exibir feedback visual durante operações assíncronas (busca, login, adicionar ao carrinho, confirmação de pedido) e mensagens claras de erro em falhas.

### Key Entities *(include if feature involves data)*

- **Loja**: Vendedor cadastrado na plataforma. Possui identificador, nome, slug, logo e estado (ativa/inativa). É proprietária de um conjunto de produtos e categorias.
- **Produto**: Item à venda em uma loja específica. Tem nome, descrição, preço, desconto, limite de quantidade por compra, tipo (avulso ou recorrente com periodicidade), categoria, imagens (galeria) e marcação de destaque. Cada produto pertence a exatamente uma loja.
- **Categoria**: Agrupamento de produtos dentro de uma loja. Tem nome, slug e contador de produtos.
- **Imagem do produto**: Arquivo visual associado a um produto, com ordem de exibição na galeria.
- **Conta de usuário**: Identidade autenticada da plataforma. Tem nome, e-mail e credencial de acesso. Possui lista de endereços e histórico de pedidos.
- **Endereço**: Dados de entrega vinculados a uma conta — CEP, logradouro, complemento, bairro, cidade, estado.
- **Carrinho**: Coleção dos produtos que o usuário pretende comprar. Cada item registra produto, quantidade e a loja de origem (derivada do produto). Único por usuário e persistente entre sessões.
- **Pedido**: Compra confirmada de uma loja específica. Contém os itens daquela loja, valores, endereço de entrega e referência à conta compradora. Um checkout pode gerar múltiplos pedidos (um por loja envolvida).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% das buscas unificadas exibem a primeira página de resultados em menos de 1,5 segundo após a confirmação do termo, em conexão de banda larga típica, dentro do volume-alvo do MVP (até 1.000 produtos agregados, até 10 lojas, baixíssimo tráfego concorrente).
- **SC-002**: A partir da home, um novo usuário consegue completar o caminho "buscar → abrir produto → adicionar ao carrinho" em menos de 60 segundos sem instruções externas em pelo menos 80% dos testes de usabilidade.
- **SC-003**: Um usuário com itens de duas lojas no carrinho consegue concluir o checkout (selecionar endereço e confirmar) em menos de 2 minutos.
- **SC-004**: Os resultados de uma busca unificada incluem produtos de todas as lojas ativas que possuam itens correspondentes ao termo, sem que nenhuma loja fique sub-representada por padrão (taxa de inclusão ≥ 99% medida contra o catálogo).
- **SC-005**: Em telas a partir de 360 px de largura, todas as ações principais (buscar, abrir produto, adicionar ao carrinho, fazer login, finalizar pedido) permanecem visíveis e operáveis sem rolagem horizontal.
- **SC-006**: A taxa de erros não tratados (telas em branco, exceções visíveis ao usuário) por sessão se mantém abaixo de 0,5% durante operação normal.
- **SC-007**: 100% das URLs de busca/filtro são compartilháveis: abrir o link em uma nova sessão reproduz exatamente os mesmos filtros e termo.
- **SC-008**: *(Adiado para pós-MVP — depende de LOFN-G09; ver `lofn-api-gaps.md`.)* Quando a persistência server-side do carrinho estiver disponível no backend Lofn, 90% dos usuários autenticados que adicionam um item ao carrinho devem recuperar esse carrinho intacto ao logar em outro dispositivo. **No MVP, com persistência apenas em `localStorage` por dispositivo, a métrica não é exigida** — a tela do carrinho MUST informar visualmente que itens não migram entre dispositivos enquanto o gap LOFN-G09 não for fechado.

## Assumptions

- **Idioma padrão**: pt-BR. Outros idiomas ficam fora do escopo desta primeira entrega, mas a interface é projetada para acomodá-los depois.
- **Catálogo unificado por busca, não por taxonomia**: cada loja mantém suas próprias categorias internas. A unificação acontece na camada de busca textual e nos filtros de loja, faixa de preço e promoção. **Não existe filtro de categoria na busca unificada**; categoria só é exposta como filtro dentro da página de uma loja específica, usando exclusivamente as categorias daquela loja. Não há, neste escopo, uma taxonomia global única.
- **Carrinho unificado, pedido por loja**: o usuário vê e gerencia um único carrinho contendo itens de várias lojas. No momento do checkout, o sistema gera um pedido independente por loja, já que cada loja é um vendedor distinto e processa entrega/pagamento separadamente.
- **Identidade visual**: Circulou tem identidade própria (logo, paleta, tipografia) — não herda a identidade visual de nenhuma loja específica. As lojas aparecem com seus nomes e logos nos cards/páginas, mas o tema do site é da plataforma.
- **Pagamento e entrega** estão **fora do escopo** desta primeira spec. O sistema chega até a confirmação de pedido (geração dos identificadores). Integração com gateway, cálculo de frete e rastreio são tratados em specs posteriores.
- **Avaliações, favoritos/wishlist e histórico de pedidos** estão **fora do escopo** desta primeira entrega. O ícone de favorito existente no exemplo de referência permanece desativado. **Confirmação de pedido**: existe somente como página efêmera após o checkout (FR-025); não há tela de "Meus pedidos" nem envio de e-mail de confirmação. Se o usuário fechar a aba ou navegar para fora, perde o acesso aos identificadores — comunique isso visualmente na própria tela de confirmação.
- **Subscrições**: produtos do tipo recorrente (com periodicidade) são exibidos e podem ser adicionados ao carrinho com indicação clara de que se trata de cobrança recorrente, mas o ciclo completo de gestão de assinatura (renovação, cancelamento, alteração) está fora do escopo.
- **Identidade do visitante anônimo**: a busca, os filtros e a página de detalhe são acessíveis sem login. O carrinho e o checkout exigem login.
- **Disponibilidade dos serviços de domínio**: o sistema depende do serviço de catálogo de produtos/lojas/categorias e do serviço de autenticação de usuários — ambos já existentes — para entregar todos os fluxos descritos. Falhas desses serviços são tratadas como erros de rede para o usuário (mensagem + tentar novamente).
- **Volume-alvo do MVP**: o sistema é dimensionado para um catálogo POC/demo — menos de 1.000 produtos agregados, menos de 10 lojas e tráfego baixíssimo. Decisões de UI (paginação backend, debounce de busca) seguem suficientes nesse volume; introdução de indexador externo ou cache dedicado fica fora do escopo. Crescimento além desse ponto motiva uma revisão arquitetural em spec posterior.
- **Privacidade / LGPD no MVP**: o MVP NÃO exibe aviso ou consentimento explícito antes de persistir dados pessoais (endereço, carrinho) em `localStorage`. O tratamento equivale ao de uma aplicação típica de e-commerce em fase POC. **Conformidade com LGPD** — transparência, base legal documentada, fluxos de consentimento, exclusão e portabilidade — fica registrada como **dívida explícita** a ser endereçada antes de qualquer release de produção, em spec posterior. Esta decisão é proporcional ao volume-alvo POC e à audiência interna; não se estende para uso externo sem revisão.
- **Restrição de backend ("APIs existentes apenas")**: nenhuma capacidade exigida por esta spec autoriza a criação de novos endpoints no backend Lofn neste escopo. O frontend MUST consumir apenas os endpoints já expostos pelo Lofn (REST sob `/product/*`, `/store/*`, `/category/*`, `/shopcart/*`, `/image/*` e `POST /graphql` público) e pelo NAuth. Onde uma funcionalidade exigida pela spec não tem cobertura backend hoje, o frontend MUST implementar um **mock local controlado** (filtragem/ordenação client-side, persistência em `localStorage`, simulação de identificadores de pedido) e o gap MUST ser registrado em `specs/001-circulou-marketplace/lofn-api-gaps.md` como item de trabalho futuro para a equipe Lofn — não como bloqueador desta spec. Cada mock MUST ser claramente comentado no código com referência ao item correspondente em `lofn-api-gaps.md` para que a substituição pelo endpoint real, quando ele existir, seja localizada e direta. Volume-alvo POC torna mocks client-side viáveis sem degradação perceptível.
- **Stack e ferramentas de implementação**: a constituição do projeto (`.specify/memory/constitution.md`) já fixa a stack obrigatória (React 18, TypeScript 5, Vite 6, React Router 6, Bootstrap 5, i18next 25, Fetch API). Esta spec não decide stack — apenas registra que: (a) o frontend reusa o pacote `lofn-react` para acesso ao domínio de produtos/lojas/categorias/carrinho e o pacote `nauth-react` para autenticação; (b) o agente `frontend-react-developer` é o responsável pela implementação; (c) o `lofn-react/example-app` serve como referência de UX e fluxos, com a diferença central de que aqui as buscas e filtros são unificados entre lojas em vez de isolados por loja.
