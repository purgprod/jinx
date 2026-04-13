-- ============================================================
-- Migração: Emblemas → Pins do tipo EMB
-- Data: 2026-04-12
-- Descrição:
--   Emblemas deixam de ser um acumulador separado em carteiras
--   e passam a ser Pins do tipo EMB, tratados como renda fixa.
--   O saldo investido em EMB passa a constar em usuario_tokens,
--   unificando tudo em "investido".
--
-- TRIGGERS em cascata (já existem no banco):
--   INSERT em resultados_financeiros → cria token em tokens
--   INSERT em tokens               → cria usuario_tokens (usuario_id = 1)
--   UPDATE em usuario_tokens       → atualiza carteiras.investido
--   UPDATE em carteiras            → trg_carteiras_before_update (referencia OLD.emblemas)
--
-- IMPORTANTE: o trigger trg_carteiras_before_update deve ser corrigido
-- ANTES de dropar a coluna emblemas, pois ele é disparado em cascata.
-- ============================================================


-- ============================================================
-- 1. Corrigir o trigger trg_carteiras_before_update
--    Remove a referência a OLD.emblemas / NEW.emblemas que
--    causaria erro após o drop da coluna.
-- ============================================================
DROP TRIGGER IF EXISTS trg_carteiras_before_update;

DELIMITER //
CREATE TRIGGER trg_carteiras_before_update
BEFORE UPDATE ON carteiras
FOR EACH ROW
BEGIN
    DECLARE total_obj INT DEFAULT 0;

    IF (OLD.saldo <> NEW.saldo OR
        OLD.investido <> NEW.investido) THEN

        SELECT COALESCE(SUM(CASE WHEN objetivo_completo = 1 THEN objetivo_pontos ELSE 0 END), 0)
        INTO total_obj
        FROM objetivos
        WHERE usuario_id = NEW.usuario_id;

        SET NEW.pontos = GREATEST(1, total_obj);

    END IF;
END //
DELIMITER ;

-- ============================================================
-- 2. Remover colunas de emblemas da tabela carteiras
--    (os valores históricos continuam disponíveis na tabela emblemas)
-- ============================================================
ALTER TABLE carteiras DROP COLUMN IF EXISTS emblemas;
ALTER TABLE carteiras DROP COLUMN IF EXISTS flag_emblemas;

-- ============================================================
-- 3. Criar o resultado financeiro base para os Pins de Emblema.
--    O trigger trg_resultados_financeiros_after_insert cria o token
--    automaticamente usando a fórmula:
--      quantidade_tokens = FLOOR(valor_financiado_purg / 1000) * 100000
--      rendimento_token  = ((resultado_financeiro - valor_financiado_purg)
--                           / quantidade_tokens) / dias_vencimento
--
--    Valores escolhidos:
--      valor_financiado_purg = 100000  → 10.000.000 tokens (10M × R$0,01)
--      resultado_financeiro  = 100000  → rendimento = 0 (ajustado no passo 4)
-- ============================================================
INSERT INTO resultados_financeiros (
    razao_social,
    cnpj,
    juros_a_a,
    vencimento,
    risco,
    prazo,
    valor_financiado_purg,
    resultado_financeiro,
    historico_com_nexoos,
    cobertura_sinistro,
    flag_sinistro,
    status_ativo
) VALUES (
    'Emblem Series A',
    '00.000.000/0001-00',
    12.00,
    '2099-12-31',
    'EMB',
    36500,
    100000.00,
    100000.00,
    'S/A',
    0,
    0,
    1
);

-- ============================================================
-- 4. Ajustar o rendimento_token do token EMB criado pelo trigger.
--    Fórmula: (12% a.a. / 365 dias) * R$0,01 por token ≈ 0.00000329
-- ============================================================
UPDATE tokens
SET rendimento_token = 0.00000329
WHERE risco = 'EMB'
ORDER BY id_token DESC
LIMIT 1;

-- ============================================================
-- 5. Atualizar a descrição da rotina id:12 na tabela rotinas
-- ============================================================
UPDATE rotinas
SET descricao = '[Poppy] - Atualizar rendimento dos Pins de Emblema'
WHERE id = 12;

-- ============================================================
-- 6. Índices para otimizar queries dos Pins de Emblema (EMB)
--    Queries da cron filtram tokens.risco = 'EMB' diariamente;
--    sem índice o MySQL faz full table scan em tokens e usuario_tokens.
-- ============================================================
ALTER TABLE tokens
    ADD INDEX IF NOT EXISTS idx_tokens_risco (risco(64));

ALTER TABLE usuario_tokens
    ADD INDEX IF NOT EXISTS idx_ut_quantidade (quantidade_tokens);

-- ============================================================
-- 7. Garantir que a coluna emblemas_dia exista em
--    usuarios_dados_financeiros_diarios (pode já existir com
--    dados históricos do sistema anterior — não recria se existir)
-- ============================================================
ALTER TABLE usuarios_dados_financeiros_diarios
    ADD COLUMN IF NOT EXISTS emblemas_dia DECIMAL(18,8) NOT NULL DEFAULT 0.00000000;

-- ============================================================
-- Rollback (executar manualmente se necessário):
--
-- DELETE FROM usuario_tokens
--   WHERE token_id = (SELECT id_token FROM tokens WHERE risco = 'EMB' ORDER BY id_token DESC LIMIT 1);
-- DELETE FROM tokens WHERE risco = 'EMB';
-- DELETE FROM resultados_financeiros WHERE risco = 'EMB';
-- ALTER TABLE carteiras ADD COLUMN emblemas DECIMAL(18,8) NOT NULL DEFAULT 0.00000000;
-- ALTER TABLE carteiras ADD COLUMN flag_emblemas TINYINT(1) NOT NULL DEFAULT 0;
-- UPDATE rotinas SET descricao = '[Poppy] - Pagamento dos emblemas diário' WHERE id = 12;
-- ALTER TABLE tokens DROP INDEX IF EXISTS idx_tokens_risco;
-- ALTER TABLE usuario_tokens DROP INDEX IF EXISTS idx_ut_quantidade;
-- ALTER TABLE usuarios_dados_financeiros_diarios DROP COLUMN IF EXISTS emblemas_dia;
--
-- Recriar trigger original (com OLD.emblemas):
-- DROP TRIGGER IF EXISTS trg_carteiras_before_update;
-- CREATE TRIGGER trg_carteiras_before_update
-- BEFORE UPDATE ON carteiras FOR EACH ROW
-- BEGIN
--     IF (OLD.saldo <> NEW.saldo OR OLD.investido <> NEW.investido OR OLD.emblemas <> NEW.emblemas) THEN
--         BEGIN
--             DECLARE total_obj INT DEFAULT 0;
--             SELECT COALESCE(SUM(CASE WHEN objetivo_completo = 1 THEN objetivo_pontos ELSE 0 END), 0)
--             INTO total_obj FROM objetivos WHERE usuario_id = NEW.usuario_id;
--             SET NEW.pontos = GREATEST(1, total_obj);
--         END;
--     END IF;
-- END;
-- ============================================================
