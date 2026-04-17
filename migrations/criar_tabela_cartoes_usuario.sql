-- migrations/criar_tabela_cartoes_usuario.sql
-- Armazena o token de cartão de crédito gerado pelo JS SDK do Efí Bank (client-side).
-- Purg nunca toca os dados sensíveis do cartão — apenas o payment_token retornado pelo Efí.

CREATE TABLE IF NOT EXISTS cartoes_usuario (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT          NOT NULL,
    payment_token   VARCHAR(500) NOT NULL,
    bandeira        VARCHAR(20),
    ultimos_digitos VARCHAR(4),
    nome_titular    VARCHAR(255),
    mes_validade    VARCHAR(2),
    ano_validade    VARCHAR(4),
    ativo           TINYINT(1)   NOT NULL DEFAULT 1,
    criado_em       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_ativo (usuario_id, ativo),
    CONSTRAINT fk_cartoes_usuario FOREIGN KEY (usuario_id)
        REFERENCES users(usuario_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
