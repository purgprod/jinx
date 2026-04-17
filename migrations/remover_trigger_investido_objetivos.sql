-- migrations/remover_trigger_investido_objetivos.sql
-- Remove o trigger trg_carteiras_after_update_investido.
--
-- Motivo: o trigger marcava metas como objetivo_completo = 1 comparando
-- carteiras.investido (valor total em pins) com objetivos.objetivo_investir
-- (meta de alocação de saldo em R$) — métricas diferentes. Além disso,
-- nunca chamava adicionarPontosPermanentes, fazendo com que metas concluídas
-- via trigger não gerassem pontos permanentes para o usuário.
-- A conclusão de metas é responsabilidade exclusiva do service
-- objetivos_service.js (_alocarNasMetas), que trata os dois passos
-- (concluirMeta + adicionarPontosPermanentes) dentro da mesma transação.

DROP TRIGGER IF EXISTS trg_carteiras_after_update_investido;
