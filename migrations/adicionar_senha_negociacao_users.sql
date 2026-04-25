ALTER TABLE users
  ADD COLUMN senha_negociacao VARCHAR(255) DEFAULT NULL,
  ADD COLUMN senha_negociacao_tentativas INT NOT NULL DEFAULT 0,
  ADD COLUMN senha_negociacao_bloqueio_ate DATETIME DEFAULT NULL;
