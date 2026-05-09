-- migrations/corrigir_triggers_carteiras_ranking.sql

-- Correção 1: trg_carteiras_before_update
--   - Incluir pontos_indicacao na fórmula de pontos
--   - Remover GREATEST(1,...) que dava pelo menos 1 ponto para qualquer usuário com depósito
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

        SET NEW.pontos_permanentes = total_obj;
        SET NEW.pontos = total_obj + NEW.pontos_volateis + NEW.pontos_indicacao;

    END IF;
END //
DELIMITER ;

-- Correção 2: trg_ranking_atualizar
--   - Usar <=> (NULL-safe) para comparar liga, corrigindo o caso NULL → valor que não disparava
DROP TRIGGER IF EXISTS trg_ranking_atualizar;

DELIMITER //
CREATE TRIGGER trg_ranking_atualizar
AFTER UPDATE ON carteiras
FOR EACH ROW
BEGIN
    IF NEW.pontos <> OLD.pontos OR NOT (NEW.liga <=> OLD.liga) THEN
        DELETE FROM ranking;

        INSERT INTO ranking (posicao, usuario_id, apelido, pontos, liga, avatar_id)
        SELECT
            ROW_NUMBER() OVER (ORDER BY c.pontos DESC, c.usuario_id ASC) AS posicao,
            c.usuario_id,
            u.apelido,
            c.pontos,
            c.liga,
            u.avatar_id
        FROM carteiras c
        INNER JOIN users u ON u.usuario_id = c.usuario_id
        WHERE c.status_ativo = 1
          AND c.usuario_id <> 1
          AND c.pontos > 0;
    END IF;
END //
DELIMITER ;

-- Rebuild imediato do ranking com os valores atuais de liga e pontos
DELETE FROM ranking;

INSERT INTO ranking (posicao, usuario_id, apelido, pontos, liga, avatar_id)
SELECT
    ROW_NUMBER() OVER (ORDER BY c.pontos DESC, c.usuario_id ASC) AS posicao,
    c.usuario_id,
    u.apelido,
    c.pontos,
    c.liga,
    u.avatar_id
FROM carteiras c
INNER JOIN users u ON u.usuario_id = c.usuario_id
WHERE c.status_ativo = 1
  AND c.usuario_id <> 1
  AND c.pontos > 0;
