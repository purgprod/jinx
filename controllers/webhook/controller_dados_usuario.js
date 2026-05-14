const DadosUsuarioModel = require('../../models/webhook/model_dados_usuario');
const logger = require('../../logger');

const DadosUsuarioController = {
    async get(req, res) {
        const usuario_id = parseInt(req.params.usuario_id);
        if (!usuario_id || usuario_id <= 0) {
            return res.status(400).json({ error: 'usuario_id inválido.' });
        }

        try {
            const [base, objetivosRows, tokens, depositos, saques] = await Promise.all([
                DadosUsuarioModel.buscarBase(usuario_id),
                DadosUsuarioModel.buscarObjetivos(usuario_id),
                DadosUsuarioModel.buscarTokens(usuario_id),
                DadosUsuarioModel.buscarDepositos(usuario_id),
                DadosUsuarioModel.buscarSaques(usuario_id),
            ]);

            if (!base) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }

            // Agrupa metas por objetivo
            const objetivosMap = new Map();
            for (const row of objetivosRows) {
                if (!objetivosMap.has(row.objetivo_id)) {
                    objetivosMap.set(row.objetivo_id, {
                        objetivo_descricao:   row.objetivo_descricao,
                        primeiro_aporte_feito: row.primeiro_aporte_feito,
                        metas: [],
                    });
                }
                if (row.objetivo_investir !== null) {
                    objetivosMap.get(row.objetivo_id).metas.push({
                        objetivo_investir: parseFloat(row.objetivo_investir),
                        data_limite:       row.data_limite,
                        objetivo_completo: row.objetivo_completo,
                        saldo_alocado:     parseFloat(row.saldo_alocado),
                    });
                }
            }

            res.json({
                usuario: {
                    apelido:      base.apelido,
                    cpf:          base.cpf,
                    celular:      base.celular,
                    pix_cpf:      base.pix_cpf,
                    pix_celular:  base.pix_celular,
                    pix_email:    base.pix_email,
                    pix_chave:    base.pix_chave,
                    nami_ativo:   base.nami_ativo,
                    saldo:        parseFloat(base.saldo   ?? 0),
                    investido:    parseFloat(base.investido ?? 0),
                    pontos:       base.pontos   ?? 0,
                    liga:         base.liga,
                    posicao:      base.posicao  ?? null,
                },
                objetivos: [...objetivosMap.values()],
                tokens: tokens.map(t => ({
                    token_id:          t.token_id,
                    quantidade_tokens: t.quantidade_tokens,
                    rendimento_token:  parseFloat(t.rendimento_token),
                    razao_social:      t.razao_social,
                    risco:             t.risco,
                })),
                depositos: depositos.map(d => ({
                    data_criacao:    d.data_criacao,
                    valor_deposito:  parseFloat(d.valor_deposito),
                    status_deposito: d.status_deposito,
                    motivo:          d.motivo,
                })),
                saques: saques.map(s => ({
                    data_criacao: s.data_criacao,
                    valor_saque:  parseFloat(s.valor_saque),
                    chave_pix:    s.chave_pix,
                    status_saque: s.status_saque,
                    motivo:       s.motivo,
                })),
            });

        } catch (error) {
            logger.error(`[Webhook] Erro ao buscar dados usuario_id=${usuario_id}:`, error);
            res.status(500).json({ error: 'Erro interno.' });
        }
    },
};

module.exports = DadosUsuarioController;
