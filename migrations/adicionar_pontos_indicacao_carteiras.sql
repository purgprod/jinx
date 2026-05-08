-- migrations/adicionar_pontos_indicacao_carteiras.sql
-- Acumula os pontos recebidos via bônus de indicação (10% dos pontos do indicado).
-- Não substitui pontos_permanentes — é apenas um contador separado para analytics.

ALTER TABLE carteiras ADD COLUMN IF NOT EXISTS pontos_indicacao INT NOT NULL DEFAULT 0;
