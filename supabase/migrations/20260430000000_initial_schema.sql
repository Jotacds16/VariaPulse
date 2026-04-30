-- ============================================================================
-- VariaPulse — Schema inicial
-- ============================================================================
-- Tabelas: analises, medicoes, relatorios
-- RLS:     todas as tabelas isoladas por usuario_id = auth.uid()
-- Enums:   fonte_dados, periodo, flag_validacao
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type fonte_dados as enum (
  'consultorio',
  'mrpa',
  'mapa_24h',
  'monitorizacao_continua'
);

create type periodo as enum (
  'total',
  'diurno',
  'noturno',
  'manha_despertar'
);

create type flag_validacao as enum (
  'valor_improvavel',
  'intervalo_curto',
  'intervalo_longo',
  'fc_improvavel',
  'pulso_negativo',
  'duplicata'
);

-- ----------------------------------------------------------------------------
-- analises
-- ----------------------------------------------------------------------------

create table analises (
  id                    uuid        primary key default gen_random_uuid(),
  usuario_id            uuid        not null references auth.users(id) on delete cascade,
  criada_em             timestamptz not null default now(),
  nome                  text        not null,
  fonte                 fonte_dados not null,
  medicoes_total        integer     not null check (medicoes_total >= 0),
  medicoes_validas      integer     not null check (medicoes_validas >= 0),
  periodos_disponiveis  periodo[]   not null default '{}',
  linear                jsonb,
  nao_linear            jsonb,
  relatorio_gerado      boolean     not null default false
);

-- Índice principal para listagem do usuário (RLS + ordenação)
create index analises_usuario_id_criada_em_idx
  on analises (usuario_id, criada_em desc);

-- ----------------------------------------------------------------------------
-- medicoes
-- ----------------------------------------------------------------------------

create table medicoes (
  id          uuid          primary key default gen_random_uuid(),
  analise_id  uuid          not null references analises(id) on delete cascade,
  usuario_id  uuid          not null references auth.users(id) on delete cascade,
  timestamp   timestamptz   not null,
  pas         smallint      not null check (pas > 0),
  pad         smallint      not null check (pad > 0),
  fc          smallint      check (fc > 0),
  periodo     periodo,
  valida      boolean       not null default true,
  flags       flag_validacao[] not null default '{}'
);

-- Índice para busca por análise (join e agregações)
create index medicoes_analise_id_idx
  on medicoes (analise_id);

-- Índice para RLS (filtragem por usuario_id)
create index medicoes_usuario_id_idx
  on medicoes (usuario_id);

-- ----------------------------------------------------------------------------
-- relatorios
-- ----------------------------------------------------------------------------

create table relatorios (
  id                  uuid        primary key default gen_random_uuid(),
  analise_id          uuid        not null references analises(id) on delete cascade,
  usuario_id          uuid        not null references auth.users(id) on delete cascade,
  gerado_em           timestamptz not null default now(),
  periodos_incluidos  periodo[]   not null default '{}',
  conteudo            jsonb       not null default '[]'
);

-- Índice para busca por análise
create index relatorios_analise_id_idx
  on relatorios (analise_id);

-- Índice para RLS
create index relatorios_usuario_id_idx
  on relatorios (usuario_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table analises  enable row level security;
alter table medicoes  enable row level security;
alter table relatorios enable row level security;

-- analises
create policy "analises: usuario le proprias"
  on analises for select
  using (usuario_id = auth.uid());

create policy "analises: usuario insere proprias"
  on analises for insert
  with check (usuario_id = auth.uid());

create policy "analises: usuario atualiza proprias"
  on analises for update
  using (usuario_id = auth.uid());

create policy "analises: usuario deleta proprias"
  on analises for delete
  using (usuario_id = auth.uid());

-- medicoes
create policy "medicoes: usuario le proprias"
  on medicoes for select
  using (usuario_id = auth.uid());

create policy "medicoes: usuario insere proprias"
  on medicoes for insert
  with check (usuario_id = auth.uid());

create policy "medicoes: usuario atualiza proprias"
  on medicoes for update
  using (usuario_id = auth.uid());

create policy "medicoes: usuario deleta proprias"
  on medicoes for delete
  using (usuario_id = auth.uid());

-- relatorios
create policy "relatorios: usuario le proprios"
  on relatorios for select
  using (usuario_id = auth.uid());

create policy "relatorios: usuario insere proprios"
  on relatorios for insert
  with check (usuario_id = auth.uid());

create policy "relatorios: usuario atualiza proprios"
  on relatorios for update
  using (usuario_id = auth.uid());

create policy "relatorios: usuario deleta proprios"
  on relatorios for delete
  using (usuario_id = auth.uid());
