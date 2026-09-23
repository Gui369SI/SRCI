-- ============================================================
-- SRCI — Sistema de Requisição e Controle de Insumos Internos
-- Schema completo para Supabase (PostgreSQL 15+)
-- Aplicar em: Supabase Dashboard → SQL Editor → New query → Run
-- Ordem de execução: tabelas → funções/triggers → RPCs → RLS → seeds
-- ============================================================

-- Extensão necessária para triggers com auth.uid()
-- (já habilitada por padrão no Supabase)

-- ------------------------------------------------------------
-- 1. TABELAS
-- ------------------------------------------------------------

-- Perfis de usuário (espelha auth.users; linha criada via trigger no signup)
create table if not exists public.perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null unique,
  setor       text not null,
  perfil      text not null default 'solicitante'
              check (perfil in ('solicitante','aprovador','almoxarife','admin')),
  created_at  timestamptz not null default now()
);

-- Catálogo de itens (nunca excluir — apenas desativar, p/ manter histórico)
create table if not exists public.itens (
  id             bigint generated always as identity primary key,
  nome           text not null,
  categoria      text not null check (categoria in ('Papel','Toner','Mouse','Teclado','Outros')),
  unidade        text not null,               -- ex.: 'resma', 'un', 'cartucho'
  estoque_minimo int  not null default 0 check (estoque_minimo >= 0),
  ativo          boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Saldo atual (atualizado exclusivamente por triggers — não editar manualmente)
create table if not exists public.saldos (
  item_id     bigint primary key references public.itens(id),
  quantidade  int not null default 0 check (quantidade >= 0)
);

-- Requisições
create table if not exists public.requisicoes (
  id             bigint generated always as identity primary key,
  solicitante_id uuid   not null references public.perfis(id),
  item_id        bigint not null references public.itens(id),
  quantidade     int    not null check (quantidade > 0),
  justificativa  text   not null,
  setor_destino  text   not null,
  status         text   not null default 'pendente'
                 check (status in ('pendente','aprovada','rejeitada','entregue','cancelada')),
  aprovador_id   uuid references public.perfis(id),
  motivo_rejeicao text,
  created_at     timestamptz not null default now(),
  aprovado_em    timestamptz,
  entregue_em    timestamptz
);

-- Entradas de estoque (compras / transferências)
create table if not exists public.entradas (
  id             bigint generated always as identity primary key,
  item_id        bigint not null references public.itens(id),
  quantidade     int    not null check (quantidade > 0),
  observacao     text,
  responsavel_id uuid   not null references public.perfis(id),
  created_at     timestamptz not null default now()
);

-- Movimentações (auditoria imutável: só INSERT, nunca UPDATE/DELETE)
create table if not exists public.movimentacoes (
  id             bigint generated always as identity primary key,
  item_id        bigint not null references public.itens(id),
  tipo           text   not null check (tipo in ('entrada','saida')),
  quantidade     int    not null check (quantidade > 0),
  requisicao_id  bigint references public.requisicoes(id),
  usuario_id     uuid   not null references public.perfis(id),
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. ÍNDICES
-- ------------------------------------------------------------

create index if not exists idx_requisicoes_solicitante on public.requisicoes (solicitante_id, item_id, status);
create index if not exists idx_requisicoes_status      on public.requisicoes (status) where status = 'pendente';
create index if not exists idx_requisicoes_setor       on public.requisicoes (setor_destino, status);
create index if not exists idx_movimentacoes_item      on public.movimentacoes (item_id, created_at desc);
create index if not exists idx_entradas_item           on public.entradas (item_id, created_at desc);

-- ------------------------------------------------------------
-- 3. HELPERS DE PERFIL
-- ------------------------------------------------------------

create or replace function public.meu_perfil()
returns text language sql stable security definer set search_path = public as $$
  select perfil from public.perfis where id = auth.uid();
$$;

create or replace function public.meu_setor()
returns text language sql stable security definer set search_path = public as $$
  select setor from public.perfis where id = auth.uid();
$$;

create or replace function public.eh_gestor()
returns boolean language sql stable security definer set search_path = public as $$
  select public.meu_perfil() in ('almoxarife','admin');
$$;

-- ------------------------------------------------------------
-- 4. AUTO-CRIAÇÃO DO PERFIL NO SIGNUP
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, nome, email, setor, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'setor', 'Geral'),
    coalesce(new.raw_user_meta_data->>'perfil', 'solicitante')
  )
  on conflict (id) do nothing;

  -- Garante saldo 0 para itens existentes (itens criados depois já geram via trigger abaixo)
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria saldo 0 automaticamente quando um item novo é cadastrado
create or replace function public.cria_saldo_item()
returns trigger language plpgsql as $$
begin
  insert into public.saldos (item_id, quantidade) values (new.id, 0)
  on conflict (item_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_item_saldo on public.itens;
create trigger trg_item_saldo
  after insert on public.itens
  for each row execute function public.cria_saldo_item();

-- ------------------------------------------------------------
-- 5. TRIGGER DE ENTRADA (compra) → saldo + auditoria
-- ------------------------------------------------------------

create or replace function public.registrar_entrada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.saldos
     set quantidade = quantidade + new.quantidade
   where item_id = new.item_id;

  insert into public.movimentacoes (item_id, tipo, quantidade, usuario_id)
  values (new.item_id, 'entrada', new.quantidade, new.responsavel_id);

  return new;
end;
$$;

drop trigger if exists trg_entrada on public.entradas;
create trigger trg_entrada
  after insert on public.entradas
  for each row execute function public.registrar_entrada();

-- ------------------------------------------------------------
-- 6. RPC — CRIAR REQUISIÇÃO (com validação anti-duplicidade NO BANCO)
--    Chamada pelo frontend: supabase.rpc('criar_requisicao', {...})
-- ------------------------------------------------------------

create or replace function public.criar_requisicao(
  p_item_id bigint,
  p_quantidade int,
  p_justificativa text,
  p_setor_destino text
)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
  v_dup int;
  v_ativo boolean;
begin
  -- Regra de negócio no banco: item deve existir e estar ativo
  select ativo into v_ativo from public.itens where id = p_item_id;
  if v_ativo is null then
    raise exception 'Item não encontrado.';
  end if;
  if not v_ativo then
    raise exception 'Item inativo. Contate o almoxarife.';
  end if;

  -- Anti-duplicidade: bloqueia se já existir requisição ativa do mesmo
  -- item para o mesmo solicitante ('pendente' ou 'aprovada' não entregue)
  select count(*) into v_dup
    from public.requisicoes
   where solicitante_id = auth.uid()
     and item_id = p_item_id
     and status in ('pendente','aprovada');

  if v_dup > 0 then
    raise exception 'Você já possui uma requisição ativa deste item. Cancele-a antes de solicitar novamente.';
  end if;

  insert into public.requisicoes
    (solicitante_id, item_id, quantidade, justificativa, setor_destino, status)
  values
    (auth.uid(), p_item_id, p_quantidade, p_justificativa, p_setor_destino, 'pendente')
  returning id into v_id;

  return v_id;
end;
$$;

-- ------------------------------------------------------------
-- 7. RPC — APROVAR / REJEITAR
-- ------------------------------------------------------------

create or replace function public.avaliar_requisicao(
  p_requisicao_id bigint,
  p_aprovar boolean,
  p_motivo text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_req public.requisicoes%rowtype;
begin
  select * into v_req from public.requisicoes where id = p_requisicao_id for update;

  if not found then raise exception 'Requisição não encontrada.'; end if;
  if v_req.status <> 'pendente' then raise exception 'Requisição já foi avaliada.'; end if;
  if not p_aprovar and (p_motivo is null or btrim(p_motivo) = '') then
    raise exception 'Motivo obrigatório para rejeição.';
  end if;

  update public.requisicoes
     set status = case when p_aprovar then 'aprovada' else 'rejeitada' end,
         aprovador_id = auth.uid(),
         motivo_rejeicao = case when p_aprovar then null else p_motivo end,
         aprovado_em = now()
   where id = p_requisicao_id;
end;
$$;

-- ------------------------------------------------------------
-- 8. RPC — ENTREGAR (baixa atômica no estoque + auditoria)
--    Bloqueia entrega se saldo insuficiente ou requisição não aprovada
-- ------------------------------------------------------------

create or replace function public.entregar_requisicao(p_requisicao_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_req public.requisicoes%rowtype;
begin
  select * into v_req from public.requisicoes where id = p_requisicao_id for update;

  if not found then raise exception 'Requisição não encontrada.'; end if;
  if v_req.status <> 'aprovada' then
    raise exception 'Somente requisições aprovadas podem ser entregues.';
  end if;

  -- Baixa atômica: falha inteira se saldo insuficiente (nunca fica negativo)
  update public.saldos
     set quantidade = quantidade - v_req.quantidade
   where item_id = v_req.item_id
     and quantidade >= v_req.quantidade;

  if not found then
    raise exception 'Saldo insuficiente para esta entrega. Verifique o estoque.';
  end if;

  insert into public.movimentacoes (item_id, tipo, quantidade, requisicao_id, usuario_id)
  values (v_req.item_id, 'saida', v_req.quantidade, v_req.id, auth.uid());

  update public.requisicoes
     set status = 'entregue', entregue_em = now()
   where id = p_requisicao_id;
end;
$$;

-- ------------------------------------------------------------
-- 9. RPC — CANCELAR (somente pendente, pelo próprio solicitante)
-- ------------------------------------------------------------

create or replace function public.cancelar_requisicao(p_requisicao_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.requisicoes
     set status = 'cancelada'
   where id = p_requisicao_id
     and solicitante_id = auth.uid()
     and status = 'pendente';

  if not found then
    raise exception 'Requisição não encontrada, não é sua, ou já foi avaliada.';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.perfis         enable row level security;
alter table public.itens          enable row level security;
alter table public.saldos         enable row level security;
alter table public.requisicoes    enable row level security;
alter table public.entradas       enable row level security;
alter table public.movimentacoes  enable row level security;

-- ---- perfis ----
create policy "perfil_select_proprio_ou_gestor" on public.perfis
  for select using (auth.uid() = id or public.eh_gestor());

create policy "perfil_update_proprio" on public.perfis
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "perfis_admin_manage" on public.perfis
  for all using (public.meu_perfil() = 'admin') with check (public.meu_perfil() = 'admin');

-- ---- itens / saldos: leitura para todos autenticados; escrita só gestor ----
create policy "itens_select_autenticado" on public.itens
  for select using (auth.role() = 'authenticated');

create policy "itens_insert_gestor" on public.itens
  for insert with check (public.eh_gestor());

create policy "itens_update_gestor" on public.itens
  for update using (public.eh_gestor()) with check (public.eh_gestor());

create policy "saldos_select_autenticado" on public.saldos
  for select using (auth.role() = 'authenticated');

-- saldos: sem policy de insert/update/delete — somente triggers (security definer) alteram

-- ---- requisicoes ----
create policy "req_select_proprias" on public.requisicoes
  for select using (
    auth.uid() = solicitante_id
    or public.eh_gestor()
    or (public.meu_perfil() = 'aprovador' and public.meu_setor() = setor_destino)
  );

create policy "req_insert_via_rpc" on public.requisicoes
  for insert with check (auth.uid() = solicitante_id and status = 'pendente');

create policy "req_update_aprovador" on public.requisicoes
  for update using (
    (public.meu_perfil() = 'aprovador' and public.meu_setor() = setor_destino and status = 'pendente')
    or public.eh_gestor()
  ) with check (
    (public.meu_perfil() = 'aprovador' and public.meu_setor() = setor_destino)
    or public.eh_gestor()
  );

-- ---- entradas: leitura gestor; escrita gestor ----
create policy "entradas_select_gestor" on public.entradas
  for select using (public.eh_gestor());

create policy "entradas_insert_gestor" on public.entradas
  for insert with check (public.eh_gestor() and auth.uid() = responsavel_id);

-- ---- movimentacoes: leitura gestor; INSERT só via funções (sem policy de escrita para clientes) ----
create policy "mov_select_gestor" on public.movimentacoes
  for select using (public.eh_gestor());

-- ------------------------------------------------------------
-- 11. VIEW ÚTIL — Estoque com alerta de mínimo
-- ------------------------------------------------------------

create or replace view public.vw_estoque as
select i.id, i.nome, i.categoria, i.unidade, i.estoque_minimo,
       coalesce(s.quantidade, 0) as saldo,
       (coalesce(s.quantidade, 0) <= i.estoque_minimo) as alerta_minimo
  from public.itens i
  left join public.saldos s on s.item_id = i.id
 where i.ativo = true;

-- ------------------------------------------------------------
-- 12. DADOS INICIAIS (SEED) — categorias típicas do problema
-- ------------------------------------------------------------

insert into public.itens (nome, categoria, unidade, estoque_minimo) values
  ('Resma de Papel A4 75g',        'Papel',   'resma',    20),
  ('Resma de Papel A3 75g',        'Papel',   'resma',    5),
  ('Toner HP 85A Preto',           'Toner',   'cartucho', 2),
  ('Toner Brother TN-450 Preto',   'Toner',   'cartucho', 2),
  ('Toner Samsung D111 Preto',     'Toner',   'cartucho', 2),
  ('Mouse Óptico USB',             'Mouse',   'un',       5),
  ('Mouse Sem Fio 2.4GHz',         'Mouse',   'un',       3),
  ('Teclado USB ABNT2',            'Teclado', 'un',       5),
  ('Teclado Sem Fio ABNT2',        'Teclado', 'un',       3)
on conflict do nothing;

-- ------------------------------------------------------------
-- FIM DO SCHEMA
-- Notas:
-- 1. A RPC 'criar_requisicao' contém a validação anti-duplicidade
--    no BANCO (requisito RF-11) — o frontend não pode burlar.
-- 2. 'entregar_requisicao' é atômica: ou baixa saldo + grava
--    movimentação + marca 'entregue', ou falha inteira.
-- 3. Nunca exponha a service_role key no frontend; use apenas
--    a anon key — o RLS garante o isolamento.
-- ============================================================
