-- migrations/adicionar_termos_users.sql
-- Adiciona campos de aceite de política de privacidade e termos de riscos na tabela users.

ALTER TABLE users
    ADD COLUMN termos_de_privacidade            TINYINT(1) NOT NULL DEFAULT 1 AFTER termos_de_uso,
    ADD COLUMN termos_de_riscos_da_plataforma   TINYINT(1) NOT NULL DEFAULT 1 AFTER termos_de_privacidade;
