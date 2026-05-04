-- =============================================================================
-- VariaPulse — Schema consolidado (fonte única de verdade)
-- Gerado em 2026-05-04. Representa o estado real do banco em produção.
-- Substitui: 0001_schema_inicial.sql, 20260430000000_initial_schema.sql,
--            20260430000001_fix_rls_update_policies.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- analises
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analises (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id           uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  criada_em            timestamptz NOT NULL DEFAULT now(),
  nome                 text        NOT NULL,
  fonte                text        NOT NULL
    CHECK (fonte IN ('consultorio', 'mrpa', 'mapa_24h', 'monitorizacao_continua')),
  medicoes_total       integer     NOT NULL CHECK (medicoes_total >= 0),
  medicoes_validas     integer     NOT NULL CHECK (medicoes_validas >= 0),
  periodos_disponiveis text[]      NOT NULL DEFAULT '{}',
  linear               jsonb,
  nao_linear           jsonb,
  relatorio_gerado     boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS analises_usuario_id_idx
  ON analises (usuario_id);

CREATE INDEX IF NOT EXISTS analises_criada_em_idx
  ON analises (usuario_id, criada_em DESC);

ALTER TABLE analises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem apenas suas analises"
  ON analises FOR SELECT
  USING ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios criam suas analises"
  ON analises FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios atualizam suas analises"
  ON analises FOR UPDATE
  USING    ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios deletam suas analises"
  ON analises FOR DELETE
  USING ((SELECT auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- medicoes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS medicoes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  analise_id  uuid        NOT NULL REFERENCES analises ON DELETE CASCADE,
  usuario_id  uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  timestamp   timestamptz NOT NULL,
  pas         smallint    NOT NULL CHECK (pas BETWEEN 30 AND 350),
  pad         smallint    NOT NULL CHECK (pad BETWEEN 20 AND 250),
  fc          smallint    CHECK (fc BETWEEN 20 AND 300),
  periodo     text        CHECK (periodo IN ('total', 'diurno', 'noturno', 'manha_despertar')),
  valida      boolean     NOT NULL DEFAULT true,
  flags       text[]      NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS medicoes_analise_id_idx
  ON medicoes (analise_id);

CREATE INDEX IF NOT EXISTS medicoes_usuario_id_idx
  ON medicoes (usuario_id);

CREATE INDEX IF NOT EXISTS medicoes_validas_idx
  ON medicoes (analise_id, periodo)
  WHERE valida = true;

ALTER TABLE medicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem apenas suas medicoes"
  ON medicoes FOR SELECT
  USING ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios criam suas medicoes"
  ON medicoes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios atualizam suas medicoes"
  ON medicoes FOR UPDATE
  USING    ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios deletam suas medicoes"
  ON medicoes FOR DELETE
  USING ((SELECT auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- relatorios
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS relatorios (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  analise_id          uuid        NOT NULL REFERENCES analises ON DELETE CASCADE,
  usuario_id          uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  gerado_em           timestamptz NOT NULL DEFAULT now(),
  periodos_incluidos  text[]      NOT NULL DEFAULT '{}',
  conteudo            jsonb       NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS relatorios_analise_id_idx
  ON relatorios (analise_id);

CREATE INDEX IF NOT EXISTS relatorios_usuario_id_idx
  ON relatorios (usuario_id);

ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem apenas seus relatorios"
  ON relatorios FOR SELECT
  USING ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios criam seus relatorios"
  ON relatorios FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios atualizam seus relatorios"
  ON relatorios FOR UPDATE
  USING    ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id);

CREATE POLICY "usuarios deletam seus relatorios"
  ON relatorios FOR DELETE
  USING ((SELECT auth.uid()) = usuario_id);

-- ---------------------------------------------------------------------------
-- Privilégios de roles
-- anon não tem acesso a nenhuma tabela de dados clínicos.
-- authenticated tem apenas as operações que a aplicação usa.
-- ---------------------------------------------------------------------------

REVOKE ALL ON analises   FROM anon;
REVOKE ALL ON medicoes   FROM anon;
REVOKE ALL ON relatorios FROM anon;

REVOKE TRUNCATE, TRIGGER, REFERENCES ON analises   FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON medicoes   FROM authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON relatorios FROM authenticated;
