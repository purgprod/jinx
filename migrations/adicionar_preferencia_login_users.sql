-- migrations/adicionar_preferencia_login_users.sql
-- Adiciona preferência de login (senha ou biometria) na tabela users.
-- NULL indica que o usuário ainda não definiu preferência.

ALTER TABLE users ADD COLUMN preferencia_login ENUM('senha', 'biometria') NULL DEFAULT NULL AFTER tema;
