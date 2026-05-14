ALTER TABLE notificacoes
MODIFY COLUMN tipo ENUM(
    'deposito_confirmado',
    'saque_confirmado',
    'saque_falhou',
    'meta_atingida',
    'meta_mensal_incompleta',
    'resumo_semanal',
    'cadastro_concluido'
) NOT NULL;
