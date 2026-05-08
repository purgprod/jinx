-- migrations/corrigir_pontos_indicacao_carteiras.sql
-- Recalcula carteiras.pontos para todos os usuários incluindo pontos_indicacao,
-- que antes era ignorado nas fórmulas de atualização de pontos.
-- Nova fórmula: pontos = pontos_permanentes + pontos_volateis + pontos_indicacao

UPDATE carteiras
SET pontos = pontos_permanentes + pontos_volateis + pontos_indicacao
WHERE pontos_indicacao > 0
  AND pontos <> pontos_permanentes + pontos_volateis + pontos_indicacao;
