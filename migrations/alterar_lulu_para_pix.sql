-- Estende o sistema Lulu para suportar taxas de PIX normal e PIX automático.

-- 1. lulu_taxas: torna cobranca_cartao_id nullable, adiciona deposito_id e tipo
ALTER TABLE lulu_taxas
    MODIFY COLUMN cobranca_cartao_id INT NULL,
    ADD COLUMN deposito_id INT NULL AFTER cobranca_cartao_id,
    ADD COLUMN tipo ENUM('cartao', 'pix', 'pix_automatico') NOT NULL DEFAULT 'cartao' AFTER deposito_id,
    ADD CONSTRAINT fk_lulu_taxas_deposito FOREIGN KEY (deposito_id) REFERENCES depositos(id);

-- 2. lulu_config: adiciona configurações de PIX
ALTER TABLE lulu_config
    ADD COLUMN percentual_deducao_pix    DECIMAL(5,2) NOT NULL DEFAULT 25.00 AFTER taxa_cartao_percentual,
    ADD COLUMN taxa_pix_percentual       DECIMAL(5,2) NOT NULL DEFAULT 1.19  AFTER percentual_deducao_pix,
    ADD COLUMN taxa_pix_automatico_valor DECIMAL(10,2) NOT NULL DEFAULT 3.50 AFTER taxa_pix_percentual;
