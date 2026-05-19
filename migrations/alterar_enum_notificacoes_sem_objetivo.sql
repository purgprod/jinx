-- Adiciona o tipo sem_objetivo ao ENUM de notificações.
-- Como a coluna prioridade é GENERATED e depende de tipo, é necessário
-- recriá-la após alterar o ENUM para evitar erros de dependência.

-- 1. Remove a coluna gerada (o índice idx_prioridade é removido automaticamente)
ALTER TABLE notificacoes DROP COLUMN prioridade;

-- 2. Adiciona sem_objetivo ao ENUM
ALTER TABLE notificacoes
MODIFY COLUMN tipo ENUM(
    'deposito_confirmado',
    'saque_confirmado',
    'saque_falhou',
    'meta_atingida',
    'meta_mensal_incompleta',
    'resumo_semanal',
    'cadastro_concluido',
    'meta_vencida',
    'novo_usuario',
    'novo_objetivo',
    'sem_objetivo'
) NOT NULL;

-- 3. Recria a coluna gerada (sem_objetivo cai no ELSE → 'normal')
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
