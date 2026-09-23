# SRCI — Sistema de Requisição e Controle de Insumos Internos

O **SRCI** é uma aplicação web estática (HTML5, CSS3 puro e JavaScript Vanilla) integrada diretamente ao **Supabase** (PostgreSQL, Auth e Row Level Security), pronta para ser hospedada estaticamente no **GitHub Pages**.

O sistema oferece gestão centralizada e imutável para solicitações de materiais (papel A4, toners, mouses, teclados, etc.), garantindo controle rígido de saldo em estoque, aprovação por setor e prevenção contra pedidos duplicados.

---

## 🚀 Principais Funcionalidades

- **Autenticação & RBAC (RF-01, RF-04):** Controle de acesso por perfil (`Solicitante`, `Aprovador`, `Almoxarife` e `Admin`).
- **Trava Anti-Duplicidade (RF-11):** Validação em tempo real e através da procedure atômica do banco (`criar_requisicao`), impedindo solicitações duplicadas do mesmo item com pedido ativo.
- **Fluxo de Aprovação por Setor (RF-14, RF-15):** Fila exclusiva para gestores aprovarem ou rejeitarem (com motivo obrigatório) pedidos do seu setor.
- **Baixa Atômica e Alerta de Estoque Mínimo (RF-17, RF-18, RF-21):** O almoxarife confirma a entrega liberando baixa atômica no estoque. Alerta visual em vermelho para insumos abaixo do estoque de segurança (`vw_estoque`).
- **Entradas e Compras (RF-08, RF-09):** Registro de reposições pelo almoxarife com incremento automático no saldo e auditoria.
- **Relatórios & Auditoria (RF-19, RF-20, RF-22):** Extrato completo de movimentações imutáveis, consumo agrupado por colaborador e exportação dos dados em formato **CSV**.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (Design System responsivo conforme `design.md`) e Vanilla JavaScript (sem frameworks e sem bundlers/build step).
- **Backend as a Service:** Supabase (`@supabase/supabase-js@2` via CDN)
- **Hospedagem:** GitHub Pages

---

## ⚙️ Instruções de Setup do Projeto (Do Zero)

### 1. Configuração do Banco de Dados no Supabase

1. Acesse o console do [Supabase](https://supabase.com/).
2. Abra o **SQL Editor** do seu projeto.
3. Copie todo o conteúdo do arquivo `supabase/schema_srci.sql` presente neste repositório.
4. Cole no SQL Editor e clique em **Run**. Isto criará as tabelas, índices, triggers de atualização de estoque, políticas RLS e procedures atômicas (`criar_requisicao`, `avaliar_requisicao`, `entregar_requisicao`, `cancelar_requisicao`).

### 2. Configuração de Credenciais da Aplicação

1. Na raiz da pasta `assets/js/`, copie o arquivo `config.example.js` para `config.js`:
   ```bash
   cp assets/js/config.example.js assets/js/config.js
   ```
2. Abra `assets/js/config.js` e insira suas credenciais públicas (Anon/Publishable Key) do Supabase:
   ```javascript
   window.SRCI_CONFIG = {
     SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
     SUPABASE_ANON_KEY: "SUA_ANON_KEY_PUBLICA"
   };
   ```

### 3. Criação do Primeiro Usuário Administrador (Admin TI)

1. No painel do Supabase, vá em **Authentication → Users → Add User → Create User**.
2. Insira o e-mail corporativo (ex.: `admin.ti@empresa.com.br`) e defina a senha.
3. No modal ou via SQL Editor, garanta que o perfil seja configurado como `admin` na tabela `public.perfis`:
   ```sql
   UPDATE public.perfis
      SET perfil = 'admin', setor = 'TI'
    WHERE email = 'admin.ti@empresa.com.br';
   ```

### 4. Configuração de URLs de Autenticação (Supabase Auth)

1. No Supabase, vá em **Authentication → URL Configuration**.
2. Adicione a URL da sua aplicação no **Site URL** e em **Redirect URLs** (ex.: `https://seu-usuario.github.io/srci/`).

---

## 🌐 Deploy no GitHub Pages

1. Faça o commit das alterações na branch `main`.
2. Vá nas configurações do seu repositório no GitHub: **Settings → Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
4. Salve. Em instantes, o site estará publicado na URL pública `https://<usuario>.github.io/<repositorio>/`.

---

## 📁 Estrutura do Repositório

```
/
├── index.html                  → Login corporativo e redefinição de senha
├── dashboard.html              → Painel geral e indicadores por perfil
├── requisitar.html             → Formulário com trava anti-duplicidade em tempo real
├── minhas-requisicoes.html     → Histórico de pedidos do solicitante e cancelamento
├── aprovacoes.html             → Fila de aprovação por setor (Aprovador/Gestor)
├── estoque.html                → Consulta do inventário com alertas de estoque crítico
├── entradas.html               → Registro de compras e confirmação de entregas
├── relatorios.html             → Extrato de movimentações, consumo e exportação CSV
├── admin.html                  → Gestão de perfis (RBAC) e lotações
├── assets/
│   ├── css/styles.css          → Design system único e responsivo
│   └── js/
│       ├── config.example.js   → Template de configuração das chaves
│       ├── config.js           → Chaves reais (ignorado no .gitignore)
│       ├── supabase-client.js  → Inicializador do cliente Supabase
│       ├── auth.js             → Guard de sessão, RBAC e menu comum
│       ├── dashboard.js
│       ├── requisitar.js
│       ├── minhas-requisicoes.js
│       ├── aprovacoes.js
│       ├── estoque.js
│       ├── entradas.js
│       ├── relatorios.js
│       └── admin.js
└── supabase/
    └── schema_srci.sql         → DDL, Triggers, RLS e RPCs
```

---

## 📄 Licença

Este projeto é disponibilizado sob a licença [MIT](LICENSE).
