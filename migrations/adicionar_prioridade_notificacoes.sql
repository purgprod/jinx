-- Adiciona coluna prioridade derivada automaticamente do tipo da notificação.
-- urgente: deposito_confirmado, saque_confirmado, saque_falhou
-- normal:  todos os demais tipos
ALTER TABLE notificacoes
    ADD COLUMN prioridade VARCHAR(7) AS (
        CASE tipo
            WHEN 'deposito_confirmado' THEN 'urgente'
            WHEN 'saque_confirmado'    THEN 'urgente'
            WHEN 'saque_falhou'        THEN 'urgente'
            ELSE 'normal'
        END
    ) PERSISTENT,
    ADD INDEX idx_prioridade (prioridade);
