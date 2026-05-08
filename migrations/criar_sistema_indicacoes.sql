-- migrations/criar_sistema_indicacoes.sql
-- Sistema de Indicação: código único por usuário e tabela de vínculos permanentes.

-- Adiciona código de indicação único a cada usuário
ALTER TABLE users ADD COLUMN IF NOT EXISTS codigo_indicacao VARCHAR(8) UNIQUE DEFAULT NULL;

-- Popula usuários existentes com um código derivado do usuario_id
UPDATE users
SET codigo_indicacao = LOWER(SUBSTRING(MD5(CONCAT(usuario_id, 'purg_indic_2026')), 1, 8))
WHERE codigo_indicacao IS NULL;

-- Vínculo permanente entre quem indicou (indicador) e quem foi indicado (indicado).
-- Um usuário só pode ter um indicador (UNIQUE em indicado_id).
CREATE TABLE IF NOT EXISTS indicacoes (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    indicador_id  INT NOT NULL,
    indicado_id   INT NOT NULL,
    criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_indicado (indicado_id),
    INDEX idx_indicador (indicador_id),
    CONSTRAINT fk_indicacao_indicador FOREIGN KEY (indicador_id) REFERENCES users(usuario_id),
    CONSTRAINT fk_indicacao_indicado  FOREIGN KEY (indicado_id)  REFERENCES users(usuario_id)
);
