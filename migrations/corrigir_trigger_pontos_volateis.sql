-- migrations/corrigir_trigger_pontos_volateis.sql
-- Corrige o trigger trg_carteiras_before_update que ignorava pontos_volateis
-- ao recalcular carteiras.pontos quando saldo ou investido mudava.
-- O trigger anterior fazia: pontos = SUM(objetivo_pontos completados)
-- O correto é:              pontos = SUM(objetivo_pontos completados) + pontos_volateis

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
        SET NEW.pontos = GREATEST(1, total_obj + NEW.pontos_volateis);

    END IF;
END //
DELIMITER ;
