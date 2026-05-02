-- migrations/adicionar_avatar_id_ranking.sql
-- Adiciona avatar_id na tabela ranking, atualiza o trigger de reconstrução
-- e cria o trigger de sincronização quando users.avatar_id for alterado.

ALTER TABLE ranking ADD COLUMN avatar_id INT DEFAULT NULL AFTER liga;

-- Recria trg_ranking_atualizar para incluir avatar_id na reconstrução
DROP TRIGGER IF EXISTS trg_ranking_atualizar;

DELIMITER $$

CREATE TRIGGER trg_ranking_atualizar
AFTER UPDATE ON carteiras
FOR EACH ROW
BEGIN
    IF NEW.pontos <> OLD.pontos OR (NEW.liga IS NOT NULL AND NEW.liga <> OLD.liga) THEN
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
END$$

-- Sincroniza users.avatar_id → ranking.avatar_id quando o avatar for alterado
DROP TRIGGER IF EXISTS trg_users_after_update_avatar_id$$

CREATE TRIGGER trg_users_after_update_avatar_id
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NOT (NEW.avatar_id <=> OLD.avatar_id) THEN
        UPDATE ranking
        SET avatar_id = NEW.avatar_id
        WHERE usuario_id = NEW.usuario_id;
    END IF;
END$$

DELIMITER ;
