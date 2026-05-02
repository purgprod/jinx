-- migrations/adicionar_visualizacao_valores_users.sql
-- Adiciona campo visualizacao_valores na tabela users.
-- 1 = usuário quer ver os valores financeiros, 0 = oculto. Padrão: 1.

ALTER TABLE users ADD COLUMN visualizacao_valores TINYINT(1) NOT NULL DEFAULT 1 AFTER avatar_id;
