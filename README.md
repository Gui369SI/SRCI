# SRCI — Sistema de Requisição e Controle de Insumos Internos

O **SRCI (Sistema de Requisição e Controle de Insumos Internos)** é uma solução web corporativa focada na otimização da gestão de materiais e insumos administrativos e operacionais (como papéis A4/A3, cartuchos de toner, periféricos de informática e materiais de escritório).

O sistema foi concebido para eliminar desperdícios, gargalos operacionais e a falta de rastreabilidade na distribuição de materiais entre setores organizacionais.

## 🎯 Objetivo do Sistema

Oferecer um fluxo centralizado e transparente para a solicitação, aprovação e entrega de insumos, garantindo controle rigoroso de saldo em estoque e total auditabilidade das movimentações.

### Problemas Resolvidos

* **Pedidos em Duplicidade:** Impedimento de novas solicitações para um mesmo item enquanto houver um pedido pendente ou aprovado ativo para o mesmo colaborador.

* **Entregas Sem Aprovação:** Exigência de fluxo de autorização da gestão/chefia de setor antes da liberação e baixa do material.

* **Desconhecimento de Estoque:** Monitoramento de saldo em tempo real com alertas visuais automáticos para nível crítico ou mínimo de segurança.

* **Falta de Histórico:** Registro imutável de todas as entradas (reposições) e saídas (entregas) para composição de relatórios de consumo por setor.

## 👥 Perfis de Acesso (RBAC)

O SRCI opera com um modelo de controle de acesso baseado em funções (Role-Based Access Control):

| **Perfil** | **Descrição & Responsabilidades** | 
| **Solicitante** | Colaborador padrão do setor. Pode visualizar o catálogo de itens, realizar requisições de insumos e acompanhar o status dos seus pedidos. | 
| **Aprovador** | Chefia ou gestor de setor. Responsável por analisar, aprovar ou rejeitar as requisições feitas pelos colaboradores da sua área. | 
| **Almoxarife** | Responsável pela gestão do estoque físico. Realiza a entrega dos itens aprovados (com baixa automática de saldo) e o registro de novas entradas/compras. | 
| **Admin** | Administrador do sistema/TI. Gerencia usuários, perfis de acesso, setores e parametrizações gerais da aplicação. | 

## 🔄 Fluxo Operacional da Requisição

```
[ Solicitante ] ──(Solicita Insumo)──► [ Validação Anti-Duplicidade ]
                                                     │
                                                     ▼
[ Almoxarife ]  ◄──(Baixa no Estoque)──  [ Aprovador / Gestor ]
  (Entrega)          (Aprovado)              (Avalia Pedido)

```

1. **Solicitação:** O colaborador escolhe o insumo e a quantidade. O sistema valida se o usuário já possui um pedido em andamento para aquele item.

2. **Aprovação:** O pedido entra na fila de aprovação do gestor responsável pelo setor.

3. **Baixa e Entrega:** Após a aprovação, o pedido é liberado para o Almoxarife, que realiza a entrega física e confirma a baixa atômica no estoque.

## 🚀 Principais Funcionalidades

* **Catálogo de Insumos Dinâmico:** Consulta de materiais disponíveis, especificações e disponibilidade.

* **Trava de Segurança Anti-Duplicidade:** Regra atômica no banco de dados para evitar requisições redundantes de um mesmo item por colaborador.

* **Fila de Aprovação por Setor:** Painel dedicado para gestores visualizarem e despacharem pendências da sua equipe.

* **Gestão e Alerta de Estoque Mínimo:** Painel de saldos com indicativos visuais automáticos de escassez (Estoque Mínimo).

* **Registro de Entradas (Reposicionamento):** Módulo para o Almoxarife dar entrada em notas fiscais/compras de reposição.

* **Relatórios de Consumo & Exportação:** Visualização de extratos de movimentação e exportação de relatórios em formato CSV.

* **Painel Administrativo:** Gestão completa de contas de usuários, redefinição de papéis e manutenção do catálogo.

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (Design System próprio, responsivo) e JavaScript Vanilla.

* **Backend as a Service (BaaS):** Supabase (Autenticação, Row Level Security, Triggers e Stored Procedures em PostgreSQL).

* **Hospedagem:** GitHub Pages.

## 📄 Licença

Este projeto é disponibilizado sob a licença [MIT](LICENSE).
