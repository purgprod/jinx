-- migrations/adicionar_avatar_id_users.sql
-- Adiciona campo avatar_id na tabela users para armazenar o avatar escolhido pelo usuário.

ALTER TABLE users ADD COLUMN avatar_id INT DEFAULT NULL AFTER tema;
