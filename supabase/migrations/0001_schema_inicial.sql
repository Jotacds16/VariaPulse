-- =============================================================================
-- VariaPulse — Schema inicial
-- =============================================================================

-- ---------------------------------------------------------------------------
-- analises
-- Armazena metadados e resultados computados de cada análise.
-- Os resultados (linear, nao_linear) são JSONB: sempre carregados juntos
-- e nunca consultados por campo interno — não há ganho em normalizar.
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
  -- Record<Periodo, AnaliseLinear> — null até o cálculo ser concluído
  linear               jsonb,
  -- Record<Periodo, AnaliseNaoLinear> — null até o cálculo ser concluído
  nao_linear           jsonb,
  relatorio_gerado     boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS analises_usuario_id_idx
  ON analises (usuario_id);

CREATE INDEX IF NOT EXISTS analises_criada_em_idx
  ON analises (usuario_id, criada_em DESC);

-- RLS
ALTER TABLE analises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem apenas suas analises"
  ON analises FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuarios criam suas analises"
  ON analises FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "usuarios atualizam suas analises"
  ON analises FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuarios deletam suas analises"
  ON analises FOR DELETE
  USING (auth.uid() = usuario_id);


-- ---------------------------------------------------------------------------
-- medicoes
-- Medições individuais vinculadas a uma análise.
-- PAS/PAD como smallint (mmHg — valores entre ~30 e ~300).
-- FC como smallint (bpm — valores entre ~20 e ~250).
-- flags como text[] para manter flexibilidade sem enum rígido.
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

-- Índice parcial — medições inválidas raramente são consultadas
CREATE INDEX IF NOT EXISTS medicoes_validas_idx
  ON medicoes (analise_id, periodo)
  WHERE valida = true;

-- RLS
ALTER TABLE medicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem apenas suas medicoes"
  ON medicoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuarios criam suas medicoes"
  ON medicoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "usuarios deletam suas medicoes"
  ON medicoes FOR DELETE
  USING (auth.uid() = usuario_id);


-- ---------------------------------------------------------------------------
-- relatorios
-- Relatório clínico gerado a partir de uma análise.
-- conteudo é JSONB (SecaoRelatorio[]) — estrutura de seções e texto narrativo.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS relatorios (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  analise_id          uuid        NOT NULL REFERENCES analises ON DELETE CASCADE,
  usuario_id          uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  gerado_em           timestamptz NOT NULL DEFAULT now(),
  periodos_incluidos  text[]      NOT NULL DEFAULT '{}',
  -- SecaoRelatorio[] — título, conteúdo narrativo, alertas opcionais
  conteudo            jsonb       NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS relatorios_analise_id_idx
  ON relatorios (analise_id);

CREATE INDEX IF NOT EXISTS relatorios_usuario_id_idx
  ON relatorios (usuario_id);

-- RLS
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios veem apenas seus relatorios"
  ON relatorios FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuarios criam seus relatorios"
  ON relatorios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "usuarios deletam seus relatorios"
  ON relatorios FOR DELETE
  USING (auth.uid() = usuario_id);
