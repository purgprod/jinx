-- migrations/criar_tabela_cobrancas_cartao.sql
-- Registra cada tentativa de cobrança mensal no cartão de crédito do usuário.
-- referencia_mes (primeiro dia do mês) é usado para garantir idempotência:
-- apenas uma cobrança Aprovada ou Processando por usuário por mês.

CREATE TABLE IF NOT EXISTS cobrancas_cartao (
    id              INT           AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT           NOT NULL,
    charge_id       INT,
    valor           DECIMAL(10,2) NOT NULL,
    status          VARCHAR(50)   NOT NULL DEFAULT 'Processando',
    motivo          TEXT,
    referencia_mes  DATE          NOT NULL,
    criado_em       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario      (usuario_id),
    INDEX idx_referencia   (referencia_mes),
    CONSTRAINT fk_cobrancas_usuario FOREIGN KEY (usuario_id)
        REFERENCES users(usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
