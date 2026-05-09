-- migrations/criar_view_ranking_dados.sql
-- View pública (autenticada) com dados não sensíveis do ranking por usuário.

CREATE OR REPLACE VIEW ranking_dados AS
SELECT
    r.posicao,
    r.usuario_id,
    r.apelido,
    r.pontos,
    r.liga,
    r.avatar_id,
    u.created_at,
    u.estado
FROM ranking r
JOIN users u ON u.usuario_id = r.usuario_id
WHERE u.status_ativo = 1;
