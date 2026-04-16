-- migrations/renomear_ranking_pontos_para_ranking.sql
-- Renomeia a tabela ranking_pontos para ranking,
-- adiciona a coluna liga (tier do usuário),
-- popula liga a partir de carteiras.liga,
-- e recria o trigger para manter a tabela atualizada.

-- ----------------------------------------------------------------
-- 1. Renomear tabela
-- ----------------------------------------------------------------
RENAME TABLE ranking_pontos TO ranking;

-- ----------------------------------------------------------------
-- 2. Adicionar coluna liga
-- ----------------------------------------------------------------
ALTER TABLE ranking
    ADD COLUMN liga VARCHAR(50) NULL DEFAULT NULL AFTER pontos;

-- ----------------------------------------------------------------
-- 3. Popular liga com o valor atual de carteiras.liga
-- ----------------------------------------------------------------
UPDATE ranking r
    JOIN carteiras c ON c.usuario_id = r.usuario_id
SET r.liga = c.liga;

-- ----------------------------------------------------------------
-- 4. Recriar trigger (tabela foi renomeada e liga foi adicionada)
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ranking_pontos_atualizar;

DELIMITER //

CREATE TRIGGER trg_ranking_atualizar
AFTER UPDATE ON carteiras
FOR EACH ROW
BEGIN
    IF NEW.pontos <> OLD.pontos OR (NEW.liga IS NOT NULL AND NEW.liga <> OLD.liga) THEN
        DELETE FROM ranking;

        INSERT INTO ranking (posicao, usuario_id, nome, pontos, liga)
        SELECT
            ROW_NUMBER() OVER (ORDER BY c.pontos DESC, c.usuario_id ASC) AS posicao,
            c.usuario_id,
            u.nome_completo AS nome,
            c.pontos,
            c.liga
        FROM carteiras c
        INNER JOIN users u ON u.usuario_id = c.usuario_id
        WHERE c.status_ativo = 1
          AND c.usuario_id <> 1
          AND c.pontos > 0;
    END IF;
END //

DELIMITER ;
