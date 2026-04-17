-- migrations/renomear_users_nome_para_apelido.sql
-- Renomeia a coluna nome para apelido na tabela users.

ALTER TABLE users CHANGE nome apelido TEXT DEFAULT NULL;
