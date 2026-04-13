-- ============================================================
-- Migração: Correções de bugs nos Pins de Emblema (EMB)
-- Data: 2026-04-12
-- Pré-requisito: emblemas_para_pins.sql deve ter sido executado
--
-- Problemas corrigidos:
--   1. dias_vencimento dos tokens EMB estava em 0 (a rotina de
--      checagem decrementava EMB junto com os demais Pins),
--      fazendo a rotina de vencidos zerar as posições dos clientes.
--
--   2. Purg (usuario_id = 1) acumulava tokens EMB em usuario_tokens,
--      o que era incorreto — Purg nunca deve ter saldo de EMB.
--      A compra diária agora busca tokens EMB diretamente da tabela
--      tokens, sem passar pelo estoque da Purg.
--
-- Alterações de código associadas (deploy junto com esta migração):
--   - controllers/rotinas/controller_poppy_pagamento_emblemas_diario.js
--       Dedução de 15% de IR no cálculo do rendimento_token diário.
--   - controllers/rotinas/controller_poppy_compra_diaria_pins.js
--       Busca tokens EMB diretamente de tokens (não de usuario_tokens da Purg).
--       Loop residual de saldo não decrementa mais IPO de EMB.
--   - models/rotinas/model_poppy_buscar_pins_vencidos.js
--       Filtro AND risco != 'EMB' — EMB nunca expira.
--   - models/rotinas/model_poppy_buscar_pins_sinistro.js
--       Filtro AND t.risco != 'EMB' — sinistro não processa EMB.
--   - models/rotinas/model_historico_tokens_por_usuario.js
--       carteira_dia exclui EMB (evita dupla contagem com emblemas_dia).
--   - models/endpoints/model_emblemas.js
--       Total de Emblemas calculado via usuario_tokens (coluna emblemas
--       não existe em carteiras — bug removido).
--   - models/endpoints/model_saque_buscar_tokens.js
--       JOIN com tokens para expor campo risco ao controller de saque.
--   - controllers/endpoints/controller_saque.js
--       ETAPA 7: tokens EMB não são devolvidos ao estoque da Purg no saque.
-- ============================================================


-- ============================================================
-- 1. Corrigir dias_vencimento dos tokens EMB
--    Tokens EMB não vencem — vencimento fixado em 2099-12-31.
--    A rotina de checagem (controller_poppy_checagem_pins_diaria.js)
--    decrementava dias_vencimento para todos os tokens, incluindo EMB,
--    fazendo o valor chegar a 0 e disparando a rotina de vencidos.
--    O código já foi corrigido para excluir EMB, mas os dados
--    precisam ser restaurados ao valor correto.
-- ============================================================
UPDATE tokens
SET dias_vencimento = DATEDIFF('2099-12-31', CURDATE())
WHERE risco = 'EMB';


-- ============================================================
-- 2. Zerar posição de EMB da Purg (usuario_id = 1)
--    Purg nunca deve ter saldo de tokens EMB.
--    A compra diária passou a buscar tokens EMB diretamente da
--    tabela tokens; o acúmulo via usuario_tokens da Purg é um
--    resquício do modelo anterior e deve ser zerado.
-- ============================================================
UPDATE usuario_tokens
SET quantidade_tokens = 0,
    rendimento_token  = 0
WHERE usuario_id = 1
  AND token_id IN (
      SELECT id_token
      FROM tokens
      WHERE risco = 'EMB'
  );


-- ============================================================
-- Rollback (executar manualmente se necessário):
--
-- Não há rollback seguro para o passo 1 (dias_vencimento),
-- pois o valor original era 0 — resultado de um bug.
-- Para fins de rollback forçado:
--
-- UPDATE tokens SET dias_vencimento = 0 WHERE risco = 'EMB';
--
-- Para o passo 2, o rollback apenas restauraria um estado
-- incorreto intencionalmente zerado:
--
-- (não há rollback recomendado — restaurar Purg com EMB
--  seria reinstaurar o bug)
-- ============================================================
