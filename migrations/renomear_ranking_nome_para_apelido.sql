-- migrations/renomear_ranking_nome_para_apelido.sql
-- Renomeia a coluna nome para apelido na tabela ranking e recria o trigger
-- para preencher o campo com users.apelido em vez de users.nome_completo.

ALTER TABLE ranking CHANGE nome apelido VARCHAR(255) NOT NULL;

DROP TRIGGER IF EXISTS trg_ranking_atualizar;

CREATE TRIGGER trg_ranking_atualizar
AFTER UPDATE ON carteiras
FOR EACH ROW
BEGIN
    IF NEW.pontos <> OLD.pontos OR (NEW.liga IS NOT NULL AND NEW.liga <> OLD.liga) THEN
        DELETE FROM ranking;

        INSERT INTO ranking (posicao, usuario_id, apelido, pontos, liga)
        SELECT
            ROW_NUMBER() OVER (ORDER BY c.pontos DESC, c.usuario_id ASC) AS posicao,
            c.usuario_id,
            u.apelido,
            c.pontos,
            c.liga
        FROM carteiras c
        INNER JOIN users u ON u.usuario_id = c.usuario_id
        WHERE c.status_ativo = 1
          AND c.usuario_id <> 1
          AND c.pontos > 0;
    END IF;
END;
