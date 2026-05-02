-- migrations/sincronizar_apelido_users_ranking.sql
-- Sincroniza users.apelido → ranking.apelido quando o apelido for alterado.

DROP TRIGGER IF EXISTS trg_users_after_update_apelido;

DELIMITER $$

CREATE TRIGGER trg_users_after_update_apelido
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NOT (NEW.apelido <=> OLD.apelido) THEN
        UPDATE ranking
        SET apelido = NEW.apelido
        WHERE usuario_id = NEW.usuario_id;
    END IF;
END$$

DELIMITER ;
