-- migrations/ranking_pontos.sql
-- Tabela de ranking por pontos e trigger de atualização automática.
--
-- A tabela ranking_pontos é reconstruída integralmente toda vez que
-- o campo `pontos` de qualquer linha da tabela `carteiras` é alterado.
-- Isso garante que a classificação seja sempre consistente sem exigir
-- um job agendado separado.
--
-- Pré-requisitos: MySQL 8+ (ROW_NUMBER() OVER ...).
-- Executar como root ou usuário com TRIGGER privilege.

-- ----------------------------------------------------------------
-- 1. Tabela
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ranking_pontos (
    posicao     INT UNSIGNED    NOT NULL,
    usuario_id  INT             NOT NULL,
    nome        VARCHAR(255)    NOT NULL,
    pontos      INT             NOT NULL DEFAULT 0,
    atualizado_em DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    UNIQUE KEY uk_posicao (posicao)
);

-- ----------------------------------------------------------------
-- 2. Trigger: reconstrói o ranking sempre que carteiras.pontos muda
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ranking_pontos_atualizar;

DELIMITER //

CREATE TRIGGER trg_ranking_pontos_atualizar
AFTER UPDATE ON carteiras
FOR EACH ROW
BEGIN
    IF NEW.pontos <> OLD.pontos THEN
        -- DELETE é necessário (TRUNCATE não é permitido em triggers MySQL)
        DELETE FROM ranking_pontos;

        INSERT INTO ranking_pontos (posicao, usuario_id, nome, pontos)
        SELECT
            ROW_NUMBER() OVER (ORDER BY c.pontos DESC, c.usuario_id ASC) AS posicao,
            c.usuario_id,
            u.nome_completo AS nome,
            c.pontos
        FROM carteiras c
        INNER JOIN users u ON u.usuario_id = c.usuario_id
        WHERE c.status_ativo = 1
          AND c.usuario_id <> 1   -- exclui Purg (ID 1 = tesouro interno)
          AND c.pontos > 0;       -- apenas usuários com pontuação acima de zero
    END IF;
END //

DELIMITER ;

-- ----------------------------------------------------------------
-- 3. Carga inicial (popula a tabela com o estado atual do banco)
-- ----------------------------------------------------------------
DELETE FROM ranking_pontos;

INSERT INTO ranking_pontos (posicao, usuario_id, nome, pontos)
SELECT
    ROW_NUMBER() OVER (ORDER BY c.pontos DESC, c.usuario_id ASC) AS posicao,
    c.usuario_id,
    u.nome_completo AS nome,
    c.pontos
FROM carteiras c
INNER JOIN users u ON u.usuario_id = c.usuario_id
WHERE c.status_ativo = 1
  AND c.usuario_id <> 1
  AND c.pontos > 0;
