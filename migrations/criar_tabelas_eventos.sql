CREATE TABLE IF NOT EXISTS eventos (
    id         INT          NOT NULL AUTO_INCREMENT,
    tipo       ENUM('informativo', 'interativo') NOT NULL,
    titulo     VARCHAR(255) NOT NULL,
    mensagem   TEXT         NOT NULL,
    acao       VARCHAR(100) NULL,
    payload    JSON         NULL,
    usuario_id INT          NULL,
    criado_em  DATETIME     NOT NULL DEFAULT NOW(),
    expira_em  DATETIME     NULL,
    ativo      TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    INDEX idx_usuario_ativo (usuario_id, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS eventos_usuarios (
    id            INT        NOT NULL AUTO_INCREMENT,
    evento_id     INT        NOT NULL,
    usuario_id    INT        NOT NULL,
    interagiu     TINYINT(1) NOT NULL DEFAULT 0,
    interagido_em DATETIME   NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_evento_usuario (evento_id, usuario_id),
    CONSTRAINT fk_eu_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
