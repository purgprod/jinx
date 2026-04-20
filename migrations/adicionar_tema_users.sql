-- migrations/adicionar_tema_users.sql
-- Adiciona preferência de tema (claro/escuro) na tabela users.

ALTER TABLE users ADD COLUMN tema ENUM('claro', 'escuro') NOT NULL DEFAULT 'claro';
