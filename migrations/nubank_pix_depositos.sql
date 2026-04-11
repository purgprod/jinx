-- Migration: Adiciona suporte à integração Nubank Pix na tabela depositos
-- Data: 2026-04-11
-- Descrição: Novos campos para armazenar o txid da cobrança, QR Code e string
--            copia e cola gerados pelo Nubank, além do status Rejeitado para
--            depósitos com CPF divergente.

-- 1. Adiciona os campos Pix na tabela depositos
ALTER TABLE depositos
    ADD COLUMN txid           VARCHAR(35)   NULL DEFAULT NULL COMMENT 'Identificador único da cobrança Pix (padrão BACEN)' AFTER valor_deposito,
    ADD COLUMN qr_code        TEXT          NULL DEFAULT NULL COMMENT 'URL do QR Code gerado pelo Nubank (location)' AFTER txid,
    ADD COLUMN pix_copia_cola TEXT          NULL DEFAULT NULL COMMENT 'String EMV copia e cola gerada pelo Nubank' AFTER qr_code;

-- 2. Índice único no txid para buscas eficientes pelo webhook
ALTER TABLE depositos
    ADD UNIQUE INDEX idx_depositos_txid (txid);

-- 3. Garante que o ENUM de status_deposito inclua o valor 'Rejeitado'
--    (Executar apenas se a coluna for ENUM — verifique o tipo antes)
-- ALTER TABLE depositos MODIFY COLUMN status_deposito ENUM('Analisando','Executado','Cancelado','Rejeitado') NOT NULL DEFAULT 'Analisando';

-- Rollback (caso precise desfazer):
-- ALTER TABLE depositos DROP INDEX idx_depositos_txid;
-- ALTER TABLE depositos DROP COLUMN pix_copia_cola, DROP COLUMN qr_code, DROP COLUMN txid;
