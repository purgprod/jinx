-- Tabela de linha única para guardar a taxa CDI de mercado atual.
-- Atualizada manualmente pelo painel Jinx.
CREATE TABLE IF NOT EXISTS taxa_cdi (
    id            TINYINT      NOT NULL DEFAULT 1,
    valor         DECIMAL(6,4) NOT NULL DEFAULT 0.0000 COMMENT 'Percentual ao ano ex: 10.6500 para 10,65% a.a.',
    atualizado_em TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT taxa_cdi_single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO taxa_cdi (id, valor) VALUES (1, 0.0000);
