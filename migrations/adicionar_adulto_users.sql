-- migrations/adicionar_adulto_users.sql
-- Adiciona campo adulto (0 ou 1) na tabela users, calculado automaticamente
-- por triggers com base em data_nascimento vs data atual.

ALTER TABLE users ADD COLUMN adulto TINYINT(1) NOT NULL DEFAULT 0 AFTER data_nascimento;

-- Popula o campo para os usuários já existentes
UPDATE users SET adulto = CASE
    WHEN data_nascimento IS NOT NULL AND TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) >= 18 THEN 1
    ELSE 0
END;

DELIMITER $$

-- Trigger de INSERT: calcula adulto no momento do cadastro
DROP TRIGGER IF EXISTS trg_users_before_insert_adulto$$

CREATE TRIGGER trg_users_before_insert_adulto
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.data_nascimento IS NOT NULL THEN
        SET NEW.adulto = IF(TIMESTAMPDIFF(YEAR, NEW.data_nascimento, CURDATE()) >= 18, 1, 0);
    ELSE
        SET NEW.adulto = 0;
    END IF;
END$$

-- Trigger de UPDATE: recalcula adulto quando data_nascimento for alterada
DROP TRIGGER IF EXISTS trg_users_before_update_adulto$$

CREATE TRIGGER trg_users_before_update_adulto
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NOT (NEW.data_nascimento <=> OLD.data_nascimento) THEN
        IF NEW.data_nascimento IS NOT NULL THEN
            SET NEW.adulto = IF(TIMESTAMPDIFF(YEAR, NEW.data_nascimento, CURDATE()) >= 18, 1, 0);
        ELSE
            SET NEW.adulto = 0;
        END IF;
    END IF;
END$$

DELIMITER ;
