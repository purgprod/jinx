-- migrations/criar_tabela_convites_guardiao.sql
-- Tabela para convites enviados pelo tutelado para um potencial guardião.

CREATE TABLE familia_convites_guardiao (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tutelado_id     INT NOT NULL,
    email_convidado VARCHAR(255) NOT NULL,
    token_convite   VARCHAR(128) NOT NULL,
    status          ENUM('pendente', 'aceito', 'expirado', 'cancelado') DEFAULT 'pendente',
    expira_em       DATETIME NOT NULL,
    criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token (token_convite),
    KEY idx_tutelado_email (tutelado_id, email_convidado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
