-- Adiciona a alíquota de IR configurável na tabela de configuração dos emblemas.
-- Valor padrão: 0.1500 (15%), mantendo o comportamento atual.
ALTER TABLE porcentagem_emblemas
    ADD COLUMN taxa_ir DECIMAL(5,4) NOT NULL DEFAULT 0.1500
        COMMENT 'Alíquota de IR aplicada sobre o rendimento dos Pins de Emblema (ex: 0.1500 = 15%)';

-- Garante que a linha id=1 já existe com o valor padrão caso a coluna seja NULL
UPDATE porcentagem_emblemas SET taxa_ir = 0.1500 WHERE id = 1 AND taxa_ir IS NULL;
