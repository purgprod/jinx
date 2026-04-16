-- migrations/renomear_ranking_para_liga.sql
-- Renomeia a coluna `ranking` da tabela `carteiras` para `liga`.
-- O campo armazena o tier/nível da liga do usuário (ex: "Cobre I", "Bronze V").

ALTER TABLE carteiras
    CHANGE ranking liga VARCHAR(50) NULL DEFAULT NULL;
