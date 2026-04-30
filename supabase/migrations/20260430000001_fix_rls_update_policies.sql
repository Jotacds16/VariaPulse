-- Corrige UPDATE de analises: adiciona WITH CHECK para impedir troca de usuario_id
drop policy "usuarios atualizam suas analises" on analises;
create policy "usuarios atualizam suas analises"
  on analises for update
  using    ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

-- Adiciona UPDATE em medicoes (estava ausente)
create policy "usuarios atualizam suas medicoes"
  on medicoes for update
  using    ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

-- Adiciona UPDATE em relatorios (estava ausente)
create policy "usuarios atualizam seus relatorios"
  on relatorios for update
  using    ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
