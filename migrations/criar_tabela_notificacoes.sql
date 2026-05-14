CREATE TABLE IF NOT EXISTS notificacoes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id   INT NOT NULL,
    tipo         ENUM('deposito_confirmado','saque_confirmado','saque_falhou','meta_atingida','resumo_semanal') NOT NULL,
    payload      JSON NOT NULL,
    status       ENUM('pendente','enviado','falhou') DEFAULT 'pendente' NOT NULL,
    data_envio   DATETIME DEFAULT NULL,
    tentativas   TINYINT DEFAULT 0 NOT NULL,
    INDEX idx_status (status),
    INDEX idx_usuario_id (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES users(usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
