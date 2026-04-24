-- Adiciona coluna valor_unico à tabela depositos.
-- Essa coluna armazena o valor exato (com centavos aleatórios 1-99) que o usuário
-- deve pagar para que o webhook possa identificar o depósito sem txid (Pix estático).
ALTER TABLE depositos
    ADD COLUMN valor_unico DECIMAL(10,2) NULL AFTER valor_deposito,
    ADD INDEX idx_depositos_valor_unico (valor_unico);
