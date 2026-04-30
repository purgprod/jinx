-- Migration: remover_suitability
-- Remove tabelas e colunas de suitability do banco de dados.
-- O perfil de compra de pins passou a ser fixo para todos os usuários:
-- 50% Emblemas / 50% distribuído igualitariamente entre os demais pins.

-- Remover colunas da tabela users
ALTER TABLE users DROP COLUMN suitability;
ALTER TABLE users DROP COLUMN suitability_complementar;
ALTER TABLE users DROP COLUMN aceite_alteracao_suitability_poppy;

-- Remover triggers de suitability na tabela users
DROP TRIGGER IF EXISTS trg_users_after_insert_suitability;
DROP TRIGGER IF EXISTS trg_users_after_insert_suitability_complementar;

-- Remover tabelas de suitability
DROP TABLE IF EXISTS suitability_complementar;
DROP TABLE IF EXISTS suitability;
