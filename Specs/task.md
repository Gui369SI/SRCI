# TASK — Implementação do SRCI (Sistema de Requisição e Controle de Insumos Internos)

## Objetivo da Task
Implementar o frontend completo do sistema descrito no arquivo `SPEC_Sistema_Requisicao_Insumos.md`, usando **HTML + CSS + JavaScript (vanilla) + Supabase**, preparado para deploy estático no **GitHub Pages**. O backend (schema, RLS, RPCs) já está pronto e definido no arquivo `schema_srci.sql` — **não altere o schema**; o frontend deve consumir exatamente as tabelas, views e funções RPC descritas nele.

---

## Contexto
Empresa está perdendo dinheiro por falta de controle de insumos internos (resmas de papel somem, toners secam no estoque, mouses/teclados solicitados em duplicidade). O sistema dá rastreabilidade total: catálogo de itens → requisição com validação anti-duplicidade → aprovação por setor → entrega com baixa automática de estoque → auditoria e relatórios.

---

## Restrições obrigatórias

1. **Sem frameworks e sem build step** — apenas HTML, CSS e JS vanilla. Nada de React, Vue, npm, bundlers ou Node. O site deve abrir direto no GitHub Pages.
2. **Supabase via CDN:** usar `@supabase/supabase-js@2` via `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>`.
3. **Credenciais** em arquivo único `assets/js/config.js` (não versionar valores reais — versionar `config.example.js` e instruir no README a copiar e preencher):
   ```js
   window.SRCI_CONFIG = {
     SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
     SUPABASE_ANON_KEY: "SUA_ANON_KEY"
   };
   ```
4. **Toda lógica de negócio via RPC** — o frontend **nunca** faz INSERT direto em `requisicoes` nem UPDATE de status. Usar exclusivamente:
   - `criar_requisicao(p_item_id, p_quantidade, p_justificativa, p_setor_destino)`
   - `avaliar_requisicao(p_requisicao_id, p_aprovar, p_motivo)`
   - `entregar_requisicao(p_requisicao_id)`
   - `cancelar_requisicao(p_requisicao_id)`
5. Exibir mensagens de erro das RPCs ao usuário (`error.message` já vem legível em pt-BR).
6. **Nunca** usar `service_role key` no frontend.
7. Código e toda a UI em **português (pt-BR)**.
8. Não adicionar dependências externas além do CDN do Supabase (opcional: nenhuma outra).

---

## Estrutura de entrega (repositório)

```
/
├── index.html                  → Login (e-mail/senha + "esqueci a senha")
├── dashboard.html              → Visão geral por perfil
├── requisitar.html             → Nova requisição
├── minhas-requisicoes.html     → Histórico do solicitante
├── aprovacoes.html             → Fila de aprovação (perfil aprovador)
├── estoque.html                → Saldos com alerta de mínimo (todos os perfis)
├── entradas.html               → Registro de compras (almoxarife/admin)
├── relatorios.html             → Movimentações e consumo (almoxarife/admin)
├── admin.html                  → Gestão de usuários e perfis (admin)
├── assets/
│   ├── css/styles.css          → design system único, responsivo
│   └── js/
│       ├── config.example.js
│       ├── supabase-client.js  → init do client + helpers
│       ├── auth.js             → login, logout, guards de sessão/perfil
│       └── (módulos por tela)
├── supabase/
│   └── schema_srci.sql         → copiar o schema fornecido, sem alterações
└── README.md                   → setup passo a passo (Supabase + GitHub Pages)
```

---

## Requisitos de implementação por tela

### Autenticação (todas as páginas)
- Guard de sessão: redirecionar para `index.html` se não autenticado.
- Após login, redirecionar por perfil: `solicitante` → dashboard; `aprovador` → aprovacoes; `almoxarife/admin` → dashboard com menus extras.
- Botão de logout em todas as páginas internas.
- Menu de navegação exibido condicionalmente conforme o perfil (helper `meu_perfil()` via RPC ou leitura da tabela `perfis`).

### index.html — Login
- Form e-mail/senha usando `supabase.auth.signInWithPassword`.
- Link "Esqueci a senha" → `supabase.auth.resetPasswordForEmail`.
- Exibir erros de autenticação de forma amigável.

### dashboard.html
- Cards: requisições pendentes do usuário, itens em alerta de estoque mínimo (consultar view `vw_estoque`), atalho "Nova Requisição".
- Para aprovador: card com contagem da fila de aprovação do seu setor.

### requisitar.html
- Select de item populado de `itens` (ativos) com saldo atual visível ao lado de cada item (join com `saldos` ou via `vw_estoque`).
- Campos: item, quantidade, setor destino, justificativa (obrigatória).
- **Aviso de duplicidade em tempo real:** ao escolher o item, verificar via `select` em `requisicoes` se o usuário já tem requisição ativa (`pendente`/`aprovada`) daquele item e exibir aviso destacado (a RPC fará a validação final).
- Chamar `criar_requisicao` e exibir sucesso/erro.

### minhas-requisicoes.html
- Tabela com: item, quantidade, status (badge colorido), data, motivo de rejeição (se houver).
- Botão "Cancelar" apenas quando status = `pendente` → `cancelar_requisicao`.

### aprovacoes.html
- Tabela das requisições `pendente` do setor do aprovador (filtrar por `setor_destino`).
- Ações: Aprovar (direto) / Rejeitar (modal com motivo obrigatório) → `avaliar_requisicao`.

### estoque.html
- Tabela da view `vw_estoque`: nome, categoria, unidade, saldo, estoque mínimo.
- Destaque visual (cor/ícone) quando `alerta_minimo = true`.

### entradas.html (almoxarife/admin)
- Form: item, quantidade, observação → INSERT direto em `entradas` (permitido por RLS para gestores).
- Histórico das últimas entradas.

### relatorios.html (almoxarife/admin)
- Tabela de `movimentacoes` com filtros: período (data inicial/final), item, tipo (entrada/saia).
- Tabela de consumo: saídas agrupadas por colaborador (`solicitante_id`) — pode ser feita client-side ou com view; se precisar criar view auxiliar, documentar no README como SQL opcional adicional.
- Botão **Exportar CSV**.

### admin.html (admin)
- Listar usuários da tabela `perfis`.
- Editar: nome, setor e perfil (`solicitante`/`aprovador`/`almoxarife`/`admin`).
- Aviso claro de que novos logins são criados pelo Admin TI no painel do Supabase (Auth).

---

## Design / UX
- Layout limpo corporativo, sidebar ou navbar superior com identificação do usuário logado.
- Totalmente **responsivo** (mobile-first, breakpoints simples).
- Feedback visual para todas as ações: loading (spinner/desabilitar botão), sucesso (toast/mensagem verde), erro (mensagem vermelha com texto da RPC).
- Tabela vazias com mensagem amigável ("Nenhuma requisição encontrada.").
- Paleta neutra com uma cor de destaque; badges de status: pendente (amarelo), aprovada (azul), entregue (verde), rejeitada/cancelada (vermelho/cinza).

---

## README.md obrigatório
1. O que é o sistema.
2. Passo a passo: criar projeto no Supabase → rodar `supabase/schema_srci.sql` no SQL Editor → copiar `config.example.js` → `config.js` → preencher URL e anon key → abrir no GitHub Pages.
3. Como criar o primeiro usuário admin (Supabase Auth → Add user → inserir `raw_user_meta_data` com `perfil: "admin"` no signup, ou atualizar na tabela `perfis`).
4. Configurar Authentication → URL Configuration com a URL do GitHub Pages.

---

## Critérios de aceite (Definition of Done)

- [ ] Todas as 9 telas implementadas e navegáveis conforme perfil de acesso.
- [ ] Nenhum INSERT/UPDATE direto em `requisicoes` — somente RPCs.
- [ ] Erros das RPCs exibidos ao usuário em pt-BR.
- [ ] Aviso de duplicidade em tempo real na tela de requisição.
- [ ] Alerta visual de estoque mínimo na tela de estoque.
- [ ] Guard de autenticação em todas as páginas internas.
- [ ] Layout responsivo (testar em largura de celular ~375px).
- [ ] `config.example.js` versionado; `config.js` no `.gitignore`.
- [ ] README completo com setup do zero.
- [ ] Zero dependências além do CDN do Supabase.
- [ ] Site funciona abrindo os arquivos estáticos sem servidor (exceto chamadas ao Supabase).

---

## Arquivos de referência anexados à task
- `SPEC_Sistema_Requisicao_Insumos.md` — especificação completa (requisitos, arquitetura, modelo de dados, RLS).
- `schema_srci.sql` — schema final do banco com RLS e RPCs. **Fonte da verdade do backend. Não modificar.**
