-- Padroniza os status de depósitos e saques para apenas 4 valores:
-- 'Processando', 'Executado', 'Cancelado', 'Rejeitado'
--
-- Mapeamento:
--   depositos: 'Analisando' → 'Processando'
--   saques:    'Analisando' → 'Processando', 'Falhou' → 'Cancelado'

-- 1. Migrar dados existentes
UPDATE depositos SET status_deposito = 'Processando' WHERE status_deposito = 'Analisando';
UPDATE saques    SET status_saque    = 'Processando' WHERE status_saque    = 'Analisando';
UPDATE saques    SET status_saque    = 'Cancelado'   WHERE status_saque    = 'Falhou';

-- 2. Ajustar ENUMs das colunas
ALTER TABLE depositos
    MODIFY COLUMN status_deposito
        ENUM('Processando','Executado','Cancelado','Rejeitado')
        NOT NULL DEFAULT 'Processando';

ALTER TABLE saques
    MODIFY COLUMN status_saque
        ENUM('Processando','Executado','Cancelado','Rejeitado')
        NOT NULL DEFAULT 'Processando';
