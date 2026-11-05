# NaPorta

<img width="1280" height="698" alt="image" src="https://github.com/user-attachments/assets/4b1a54fe-4f47-49f6-94ef-84d742711be3" />

Software para gerenciamento de solicitação de serviço de quarto. O cliente realiza a leitura de um QRCode que identifica o quarto, é direcionado ao sistema e realiza a solicitação de sua refeição, podendo acompanhar o progresso até a entrega.

> ✅ **Status v1:** Concluído

## Estrutura do Repositório

- **`/api`** — Armazena o código backend da aplicação
- **`/web`** — Armazena a interface web do cliente

## Stack

- **Backend:** Node.js, Fastify, Prisma ORM v7, PostgreSQL, Docker, Zod, bcryptjs
- **Frontend:** Angular 16, Angular Material, Tailwind CSS
- **Tooling:** TypeScript, tsx, tsup

## Arquitetura

- API REST utilizando Fastify
- Autenticação baseada em JWT
- Controle de acesso baseado em papéis (RBAC)
- Persistência com PostgreSQL
- Validação de entrada com Zod
- ORM Prisma v7

## Checklist de Integração — MVP

### Infraestrutura
- [x] Criar service `ApiService` no Angular com `HttpClient` configurado para a URL base da API
- [x] Adicionar `HttpClientModule` no `app.module.ts`
- [x] Configurar variável de ambiente com a URL da API (`environment.ts`)

### Autenticação Admin
- [x] Criar endpoint `POST /sessions` na API (email + senha → retorna token JWT)
- [x] Implementar login no `SignInComponent` consumindo `POST /sessions`
- [x] Salvar token no `localStorage`
- [x] Criar `AuthGuard` para proteger rotas do admin
- [x] Implementar logout no header admin limpando o token
- [x] Exibir nome do usuário logado no dashboard (payload JWT)

### Cardápio (admin)
- [x] Listar itens consumindo `GET /menu` no `MenuItemsComponent`
- [x] Ativar/desativar item consumindo `PATCH /menu/:id` com `{ available: boolean }`
- [x] Criar formulário de novo item consumindo `POST /menu`

### Pedidos (admin)
- [x] Adicionar endpoint `GET /orders` na API
- [x] Listar todos os pedidos no `OrdersComponent`
- [x] Atualizar status consumindo `PATCH /orders/:id/status`

### Dashboard (admin)
- [x] Conectar stats à API real (pendentes, em preparo, entregues, itens no cardápio)
- [x] Exibir últimos pedidos reais

### Cardápio (cliente)
- [x] Substituir dados mockados do `MenuComponent` pela listagem real da API
- [x] Exibir itens por categoria com filtro

### Pedidos (cliente)
- [x] Criar `CartService` para gerenciar itens do carrinho localmente
- [x] Criar pedido consumindo `POST /orders` com `guest_id` e itens
- [x] Listar pedidos do hóspede consumindo `GET /orders/:guest_id`
- [x] Exibir status do pedido em tempo real no `OrderStatusComponent`

### Hóspede / QRCode
- [x] Identificar hóspede via token na URL consumindo `GET /guests/:token`
- [x] Salvar `guest_id` no `localStorage` ao acessar via QRCode
- [x] Redirecionar para `/menu` após identificação

## Requisitos Funcionais (RF)

- [x] O hóspede deve poder visualizar o cardápio
- [x] O hóspede deve poder montar um carrinho e realizar um pedido
- [x] O hóspede deve poder acompanhar o status do pedido
- [x] O funcionário deve poder registrar um hóspede e vincular a um quarto
- [x] O funcionário deve poder gerenciar o cardápio (criar, ativar/desativar itens)
- [x] O funcionário deve poder visualizar e atualizar o status dos pedidos
- [ ] O hóspede deve ser identificado via QRCode ao acessar o sistema

## Requisitos Não-Funcionais (RNF)

- [x] A senha do usuário precisa estar em formato hash
- [x] Os dados da aplicação precisam estar persistidos em um banco PostgreSQL
- [x] O banco de dados deve utilizar UUID v7 para performance e identificação
- [x] O usuário deve ser identificado por um JWT entre as requisições
- [x] Todos os usuários devem ser identificados pela permissão de `admin` ou `member`

## Regras de Negócio (RN)

- [x] O hóspede não pode ter mais de um pedido ativo (pending/preparing) simultaneamente
- [x] A senha do usuário deve ser armazenada em hash (bcryptjs)
- [x] O usuário não pode se cadastrar com e-mail duplicado
- [x] O token do QRCode é único por hóspede e expira no check-out

## Estrutura do Banco de Dados

### Entidades

- [x] Users
- [x] Rooms
- [x] Guests
- [x] MenuItems
- [x] Orders
- [x] OrderItems

### Relacionamentos

- Um quarto possui vários hóspedes
- Um hóspede possui vários pedidos (mas apenas um ativo por vez)
- Um pedido possui vários itens
- Um item de pedido pertence a um item do cardápio

## Comandos para Iniciar o Projeto

### API

- `pnpm install` — instala as dependências
- `docker compose up -d` — sobe o container do banco de dados
- `npx prisma migrate dev` — executa as migrations
- `pnpm start:dev` — inicia o servidor em modo watch
- `pnpm build` — compila o projeto
- `pnpm start` — inicia o servidor compilado

### Banco de Dados

- `npx prisma studio` — abre o Prisma Studio
- `npx prisma migrate dev --name <nome>` — cria e executa uma nova migration

### Web

- `pnpm install` — instala as dependências
- `pnpm start` — inicia o servidor de desenvolvimento
- `ng g c pages/<nome>` — gera um novo componente de página
