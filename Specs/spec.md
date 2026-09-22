# SPEC TÉCNICA — Sistema de Requisição e Controle de Insumos Internos (SRCI)

**Versão:** 1.0
**Data:** 15/09/2026
**Stack:** HTML + CSS + JS (vanilla) + Supabase | Hospedagem: GitHub Pages
**Autor:** Gestão de TI

---

## 1. Contexto do Problema

A empresa está perdendo dinheiro por ausência de controle sobre insumos internos:

- Resmas de papel somem do estoque sem registro;
- Toners de impressora secam (ficam parados) no estoque sem rastreabilidade;
- Mouses e teclados são solicitados em duplicidade (colaboradores pedem o mesmo item mais de uma vez, ou pedem sem saber que já há disponível).

A diretoria convocou o Gestor de TI para planejar a criação de um **software interno de requisição e controle desses materiais**.

---

## 2. Objetivos

### 2.1 Objetivo Geral

Criar um sistema web interno que garanta **rastreabilidade total** do fluxo de insumos: entrada (compra), estoque e saída (requisição), eliminando perdas e solicitações duplicadas.

### 2.2 Objetivos Específicos (Mensuráveis)

| # | Objetivo | Métrica de Sucesso |
| --- | --- | --- |
| O1 | 100% das saídas de estoque vinculadas a uma requisição aprovada e a um colaborador | 0 saídas sem requisição em 60 dias |
| O2 | Eliminar solicitações duplicadas | Sistema bloqueia/avisa pedido de item que o colaborador já possui em uso |
| O3 | Dar visibilidade de saldo em tempo real | Tela de estoque consultável por qualquer usuário autenticado |
| O4 | Estabelecer fluxo de aprovação | Toda requisição passa por aprovador antes da baixa no estoque |
| O5 | Registrar responsável por cada movimentação | Auditoria completa (quem, o quê, quando, quanto) |

---

## 3. Personas e Perfis de Acesso

| Perfil | Descrição | Permissões |
| --- | --- | --- |
| **Solicitante** | Colaborador comum | Criar requisição, consultar próprias requisições, consultar saldo de estoque |
| **Aprovador** | Gestor / responsável de setor | Tudo do Solicitante + aprovar/rejeitar requisições do seu setor |
| **Almoxarife/Admin** | Responsável pelo estoque físico | Tudo acima + registrar entradas (compras), dar baixa, cadastrar itens, gerar relatórios |
| **Admin TI** | Gestor de TI | Gerenciar usuários e perfis, acesso total |

---

## 4. Requisitos Funcionais (RF)

### Módulo 1 — Autenticação

- **RF-01:** Login via e-mail corporativo e senha (Supabase Auth). Sem cadastro público — usuários são criados pelo Admin TI.
- **RF-02:** Sessão persistente (token JWT do Supabase com refresh automático).
- **RF-03:** Recuperação de senha por e-mail.
- **RF-04:** Redirecionamento por perfil após login (Solicitante → Dashboard; Aprovador → Fila de Aprovação; Admin → Painel Administrativo).

### Módulo 2 — Catálogo de Itens (CRUD)

- **RF-05:** Cadastro de itens com: nome, categoria (Papel / Toner / Mouse / Teclado / Outros), unidade de medida (resma, unidade, cartucho), quantidade mínima (estoque de segurança), ativo/inativo.
- **RF-06:** Edição e desativação de itens (nunca excluir — manter histórico).
- **RF-07:** Listagem do catálogo com saldo atual visível.

### Módulo 3 — Entrada de Estoque

- **RF-08:** Registro de entrada (compra/transferência): item, quantidade, data, nota/observação, responsável (auto = usuário logado).
- **RF-09:** Saldo do item atualizado automaticamente após entrada.

### Módulo 4 — Requisição (Solicitação)

- **RF-10:** Criar requisição: item, quantidade, justificativa (obrigatória), setor destino.
- **RF-11:** **Validação anti-duplicidade:** ao criar, o sistema verifica se o solicitante já possui uma requisição *aprovada e não entregue* ou *em análise* do mesmo item → bloquear ou exigir confirmação com justificativa adicional.
- **RF-12:** Consultar status das próprias requisições: `Pendente` → `Aprovada` | `Rejeitada` → `Entregue` | `Cancelada`.
- **RF-13:** Cancelar requisição enquanto estiver `Pendente`.

### Módulo 5 — Aprovação

- **RF-14:** Fila de aprovação visível ao Aprovador com requisições pendentes do seu setor.
- **RF-15:** Aprovar ou rejeitar (rejeição exige motivo obrigatório).
- **RF-16:** Notificação por e-mail ao solicitante sobre decisão (via Supabase Edge Function + serviço de e-mail, ex.: Resend).

### Módulo 6 — Entrega / Baixa

- **RF-17:** Após aprovação, o Almoxarife registra a entrega → baixa automática no estoque + requisição passa para `Entregue`.
- **RF-18:** Bloquear entrega se saldo insuficiente (alerta ao Admin).

### Módulo 7 — Relatórios e Auditoria

- **RF-19:** Relatório de movimentações (filtros: período, item, colaborador, tipo movimento).
- **RF-20:** Histórico completo por item (quem retirou, quando, quanto).
- **RF-21:** Alerta visual de itens abaixo do estoque mínimo.
- **RF-22:** Relatório de consumo por setor/colaborador (para identificar desperdício).

---

## 5. Requisitos Não Funcionais (RNF)

| # | Requisito | Detalhe |
| --- | --- | --- |
| RNF-01 | Hospedagem | GitHub Pages (estático, HTTPS nativo) |
| RNF-02 | Banco de dados | Supabase (PostgreSQL gerenciado) |
| RNF-03 | Sem backend próprio | Toda lógica via Supabase Client JS + Row Level Security (RLS) |
| RNF-04 | Responsividade | Funciona em desktop e mobile (layout fluido) |
| RNF-05 | Navegadores | Chrome, Edge, Firefox (2 últimas versões) |
| RNF-06 | Segurança | Chaves Supabase *anon key* públicas protegidas por RLS; nenhuma service_role key no frontend |
| RNF-07 | Performance | Telas carregando em < 3s (consultas indexadas) |
| RNF-08 | Auditoria | Tabela de logs imutável para toda movimentação |

---

## 6. Arquitetura

```javascript
┌─────────────────────┐         ┌──────────────────────────┐
│   GitHub Pages      │  HTTPS  │       Supabase           │
│  (HTML/CSS/JS       ├────────►│  ┌────────────────────┐  │
│   estático)         │  REST   │  │ PostgreSQL + RLS   │  │
└─────────────────────┘         │  │ Auth (e-mail/senha)│  │
                                │  │ Edge Functions     │  │
                                │  │ Storage (anexos)   │  │
                                │  └────────────────────┘  │
                                └──────────────────────────┘
```

**Decisão arquitetural:** GitHub Pages só serve arquivos estáticos → toda a lógica de negócio e segurança fica no banco (RLS policies + funções/triggers SQL). Isso elimina a necessidade de servidor backend.

### Estrutura de pastas do repositório

```javascript
srci/
├── index.html            → Login
├── dashboard.html        → Visão do solicitante
├── requisitar.html       → Nova requisição
├── minhas-requisicoes.html
├── aprovacoes.html       → Fila do aprovador
├── estoque.html          → Saldo atual (todos os perfis)
├── entradas.html         → Registro de compras (Almoxarife)
├── relatorios.html       → Relatórios (Almoxarife/Admin)
├── admin.html            → Gestão de usuários (Admin TI)
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── supabase-client.js   → inicialização do client
│       ├── auth.js              → login/logout/guards
│       ├── requisicoes.js
│       ├── estoque.js
│       └── relatorios.js
├── supabase/
│   └── migrations/              → SQL de schema e RLS (versionado)
└── .github/workflows/           → (opcional) CI de validação
```

---

## 7. Modelo de Dados (PostgreSQL / Supabase)

```sql
-- Perfis de usuário (espelha auth.users)
create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  setor text not null,
  perfil text not null check (perfil in ('solicitante','aprovador','almoxarife','admin')),
  created_at timestamptz default now()
);

-- Catálogo de itens
create table itens (
  id bigint generated always as identity primary key,
  nome text not null,
  categoria text not null check (categoria in ('Papel','Toner','Mouse','Teclado','Outros')),
  unidade text not null,              -- 'resma', 'un', 'cartucho'
  estoque_minimo int not null default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Saldo atual (derivado de movimentacoes; mantido por trigger para performance)
create table saldos (
  item_id bigint primary key references itens(id),
  quantidade int not null default 0 check (quantidade >= 0)
);

-- Requisições
create table requisicoes (
  id bigint generated always as identity primary key,
  solicitante_id uuid not null references perfis(id),
  item_id bigint not null references itens(id),
  quantidade int not null check (quantidade > 0),
  justificativa text not null,
  setor_destino text not null,
  status text not null default 'pendente'
        check (status in ('pendente','aprovada','rejeitada','entregue','cancelada')),
  aprovador_id uuid references perfis(id),
  motivo_rejeicao text,
  created_at timestamptz default now(),
  aprovado_em timestamptz,
  entregue_em timestamptz
);

-- Entradas de estoque (compras)
create table entradas (
  id bigint generated always as identity primary key,
  item_id bigint not null references itens(id),
  quantidade int not null check (quantidade > 0),
  observacao text,
  responsavel_id uuid not null references perfis(id),
  created_at timestamptz default now()
);

-- Movimentações (auditoria imutável)
create table movimentacoes (
  id bigint generated always as identity primary key,
  item_id bigint not null references itens(id),
  tipo text not null check (tipo in ('entrada','saida')),
  quantidade int not null,
  requisicao_id bigint references requisicoes(id),
  usuario_id uuid not null references perfis(id),
  created_at timestamptz default now()
);
```

**Regras no banco (triggers/funções):**

1. `trg_entrada`: ao inserir em `entradas`, incrementa `saldos` e grava `movimentacoes` (tipo `entrada`).
2. `trg_entrega`: ao atualizar requisição para `entregue`, decrementa `saldos` (com verificação de saldo ≥ quantidade, senão lança exceção) e grava `movimentacoes` (tipo `saida`). Atômico em transação.
3. Índices: `requisicoes(solicitante_id, item_id, status)`, `movimentacoes(item_id, created_at)`, `requisicoes(status)`.

---

## 8. Segurança — Row Level Security (RLS)

Todas as tabelas com RLS habilitado. Políticas essenciais:

| Tabela | Política |
| --- | --- |
| `perfis` | Usuário lê próprio registro; Admin lê/todos. |
| `itens` / `saldos` | Leitura para qualquer usuário autenticado; escrita apenas `almoxarife`/`admin`. |
| `requisicoes` | Solicitante: INSERT (próprio id) e SELECT próprio. Aprovador: SELECT e UPDATE do seu setor onde `status='pendente'`. Almoxarife: SELECT/UPDATE para entrega. |
| `entradas` | INSERT/SELECT apenas `almoxarife`/`admin`. |
| `movimentacoes` | Leitura `almoxarife`/`admin`; INSERT somente via funções `security definer` (triggers). Nenhum UPDATE/DELETE. |

> ⚠️ A anti-duplicidade (RF-11) **não pode depender só do frontend**: validação final feita numa RPC `criar_requisicao()` no banco, que verifica requisição ativa do mesmo item antes de inserir.

---

## 9. Fluxos Principais

### 9.1 Fluxo de Requisição (feliz)

```javascript
Solicitante cria requisição → RPC valida duplicidade → status 'pendente'
   → Aprovador recebe na fila → Aprova → Almoxarife registra entrega
   → Trigger baixa saldo + grava movimentação → status 'entregue' + e-mail
```

### 9.2 Fluxo de Rejeição

```javascript
Aprovador rejeita (motivo obrigatório) → status 'rejeitada' → e-mail ao solicitante
```

### 9.3 Fluxo de Compra (Entrada)

```javascript
Almoxarife registra entrada → Trigger soma saldo + movimentação → Item abaixo do mínimo gera alerta
```

---

## 10. Telas (Wireframes de alto nível)

1. **Login** — e-mail/senha, link "esqueci a senha".
2. **Dashboard** — cards: minhas requisições pendentes, saldos críticos (alerta), atalho "Nova Requisição".
3. **Nova Requisição** — select de item (com saldo visível), quantidade, setor, justificativa; aviso de duplicidade exibido em tempo real.
4. **Minhas Requisições** — tabela com status colorido e histórico.
5. **Fila de Aprovação** — tabela com ações Aprovar/Rejeitar (modal com motivo).
6. **Estoque** — tabela de saldos com destaque para itens ≤ estoque mínimo.
7. **Entradas** — formulário de compra + histórico de entradas.
8. **Relatórios** — filtros de período/item/colaborador + exportação CSV.
9. **Admin** — gestão de usuários e perfis.

---

## 11. Deploy (GitHub Pages)

1. Criar repositório público (ou privado com GitHub Pages do plano adequado) no GitHub.
2. Publicar código na branch `main`, pasta raiz.
3. **Settings → Pages → Source:** `main` / `/ (root)` → URL final: `https://<usuario>.github.io/<repo>/`.
4. No Supabase: **Authentication → URL Configuration** → adicionar a URL do GitHub Pages em *Site URL* e *Redirect URLs*.
5. Configurar credenciais via `assets/js/config.js` (ou `window.ENV`): `SUPABASE_URL` + `SUPABASE_ANON_KEY` (chave pública, protegida por RLS — seguro para expor em frontend estático).
6. Aplicar migrations: `supabase db push` ou colar SQL no SQL Editor (primeira vez).

---

## 12. Roadmap de Entregas

| Sprint | Entrega |
| --- | --- |
| 1 | Setup Supabase (schema, RLS, Auth) + Login + Catálogo de itens |
| 2 | Requisição com validação anti-duplicidade + Minhas Requisições |
| 3 | Fluxo de aprovação + e-mails |
| 4 | Entradas de estoque + baixa automática + alertas de estoque mínimo |
| 5 | Relatórios + auditoria + Deploy final em GitHub Pages |

---

## 13. Critérios de Aceite

- [ ] Login funcionando com e-mail corporativo e senha.
- [ ] Solicitante não consegue criar requisição duplicada do mesmo item enquanto houver uma ativa.
- [ ] Nenhuma baixa de estoque sem requisição aprovada (garantido por trigger, não só pela UI).
- [ ] Aprovador só vê requisições do seu setor.
- [ ] Saldo nunca fica negativo (constraint + trigger).
- [ ] Itens com saldo ≤ mínimo exibem alerta.
- [ ] Sistema acessível via URL pública do GitHub Pages, em desktop e mobile.