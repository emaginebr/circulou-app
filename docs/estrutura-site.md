# Estrutura do Site - Brechó Online (Marketplace de Roupas Usadas)

Documento de referência descrevendo a estrutura básica de um marketplace de moda circular / brechó online, baseado no modelo do Repassa. Use este documento como prompt para gerar sites similares com aparência diferente.

## Visão Geral

Site de e-commerce do tipo brechó online, onde usuários podem **comprar** peças de roupa usadas (semi-novas) e também **vender** suas próprias roupas através de um sistema de envio simplificado. O site possui forte apelo de sustentabilidade, moda circular e doações para ONGs.

## Estrutura de Páginas

### 1. Header (Cabeçalho - Global)

Presente em todas as páginas. Contém:

- Logo da marca (com link para home)
- Barra de busca
- Menu de navegação principal com categorias
- Link/botão para "Quero Vender" (CTA de venda)
- Link de Login / Acesso ao perfil
- Ícone de Sacola/Carrinho com contador de itens
- Mini-painel lateral de resumo do pedido (abre ao clicar na sacola)

### 2. Menu Principal de Navegação

Categorias e seções principais:

- **Novas com Etiquetas** - peças nunca usadas
- **Mais Favoritadas** - produtos populares
- **Curadoria do Bem** - seleção curada
- **Marcas** - navegação por marca
- **Last Chance** - últimas peças disponíveis
- **Categorias de produto** (feminino, masculino, infantil, calçados, acessórios, etc.)

### 3. Home Page

Estrutura sequencial de seções:

1. **Banner principal (hero)** - destaque promocional ou campanha vigente
2. **Banners secundários** - promoções e categorias em destaque
3. **Seções de produtos curados** com título + subtítulo + grid horizontal de cards de produto. Exemplos:
   - "Hot News" (novidades por categoria, ex: suéteres e tricôs)
   - "Seleção Alfaiataria"
   - Outras seleções temáticas/sazonais
4. **Seção de destaque para venda** - CTA convidando o usuário a vender suas roupas
5. **Seção de propósito/impacto** - sustentabilidade, ONGs, doações

### 4. Página de Listagem de Produtos (PLP)

- Filtros laterais (categoria, tamanho, marca, cor, faixa de preço, condição)
- Ordenação (mais recentes, menor preço, maior preço, mais favoritados)
- Grid de produtos com paginação ou scroll infinito
- Breadcrumb de navegação

### 5. Página de Detalhes do Produto (PDP)

- Galeria de imagens do produto
- Nome do produto e marca
- Preço atual e preço original (com desconto destacado)
- Tamanho disponível
- Condição da peça
- Descrição e medidas
- Botão "Adicionar à Sacola"
- Botão de favoritar
- Informações de frete
- Produtos relacionados/similares

### 6. Card de Produto (Componente reutilizável)

Cada card exibe:

- Imagem do produto
- Marca
- Nome curto do produto
- Tamanho
- Preço com desconto + preço original
- Botão "Adicionar à Sacola"

### 7. Páginas de Navegação Especiais

- **Navegue por Produtos** - listagem geral
- **Navegue por Pessoas (Vitrines)** - perfis de vendedores
- **Navegue por ONGs e Causas** - listagem de instituições parceiras
- **Navegue por Parceiros do Bem** - parceiros da marca
- **Marcas** - índice alfabético de marcas

### 8. Página "Quero Vender" (Sacola do Bem)

Página explicativa sobre o processo de venda:

- Como funciona (passos do processo)
- Solicitar o kit / sacola para envio
- Benefícios para quem vende
- Opção de doação (parte do valor para ONGs)
- FAQ específico de vendas

### 9. Área do Usuário (Meu Perfil)

Seções:

- **Perfil** - dados pessoais
- **Meu Saldo / Créditos**
- **Meus Pedidos** - histórico de compras
- **Minhas Sacolas** - sacolas enviadas para venda
- **Meus Produtos** - itens à venda
- **Promoções** - cupons e ofertas
- **Favoritos**

### 10. Carrinho / Sacola de Compras

- Lista de itens adicionados
- Resumo do pedido (subtotal, frete, desconto, total)
- Cálculo de frete por CEP
- Aplicação de cupom
- Botão para finalizar compra

### 11. Checkout

- Identificação (login ou cadastro)
- Endereço de entrega
- Forma de pagamento (cartão, PIX, boleto)
- Revisão e confirmação do pedido

### 12. Páginas de Autenticação

- Login
- Cadastro
- Recuperação de senha

### 13. Páginas Institucionais e de Ajuda

- **FAQ / Central de Ajuda** com tópicos:
  - Sobre a empresa
  - Compras
  - Devolução e Reembolso
  - Vendas
  - Convites e Recomendações
  - ONGs e Doações
  - Pagamentos
  - Frete e Entrega
- Política de Privacidade
- Trabalhe Conosco
- Blog
- Fale Conosco / Chat de atendimento

### 14. Footer (Rodapé - Global)

Organizado em colunas:

- **Coluna Úteis**: Home, Quero Vender, Campanhas atuais, Navegação por produtos/pessoas/ONGs/parceiros, Blog, Pesquisa de opinião, Trabalhe Conosco
- **Coluna Meu Perfil**: links para áreas do usuário logado
- **Coluna Ajuda**: FAQ, políticas, atendimento, segurança
- **Redes Sociais** - ícones com links
- **Pagamentos e Certificados** - bandeiras de cartão e selos de segurança
- **Informações legais** - razão social, CNPJ, e-mail de contato, horários de atendimento, copyright

## Funcionalidades-Chave

- **Marketplace duplo**: usuários podem comprar e vender
- **Sistema de "Sacola do Bem"**: kit enviado ao usuário para devolver com peças a vender
- **Curadoria de produtos**: seções com seleção editorial
- **Navegação por vitrines**: perfis de vendedores como destaque
- **Integração com ONGs**: opção de doação no fluxo de venda
- **Sistema de créditos/saldo**: para quem vende
- **Favoritos**: salvar produtos
- **Filtros avançados** na listagem
- **Cálculo de frete** por CEP
- **Cupons e promoções**
- **Blog** integrado para conteúdo

## Tipos de Usuário

1. **Visitante** - navega e compra sem cadastro completo
2. **Comprador cadastrado** - tem perfil, favoritos, histórico
3. **Vendedor** - usa o sistema de sacola para enviar peças
4. **ONG / Parceiro** - recebe doações através do sistema

## Observações

- Site responsivo (mobile-first é desejável)
- Foco em sustentabilidade e moda circular como diferencial de marca
- Estrutura típica de e-commerce + camada de marketplace C2C (usuário para usuário, intermediado pela plataforma)