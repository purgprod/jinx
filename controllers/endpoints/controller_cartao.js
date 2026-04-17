// controllers/endpoints/controller_cartao.js
// Gerencia o cartão de crédito tokenizado do usuário.
//
// POST /api/v1/cartao/:id      — salva (ou substitui) o token do cartão
// GET  /api/v1/cartao/:id      — retorna os dados públicos do cartão ativo (sem token)
// DELETE /api/v1/cartao/:id    — desativa o cartão cadastrado

const logger = require('../../logger');
const CartaoSalvarModel  = require('../../models/cartoes/model_cartao_salvar');
const CartaoBuscarModel  = require('../../models/cartoes/model_cartao_buscar');
const CartaoRemoverModel = require('../../models/cartoes/model_cartao_remover');

const CartaoController = {

    async salvarCartao(req, res) {
        const { id } = req.params;
        const usuarioId = parseInt(id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const { payment_token, bandeira, ultimos_digitos, nome_titular, mes_validade, ano_validade } = req.body;

        if (!payment_token) {
            return res.status(400).json({ error: 'payment_token é obrigatório.' });
        }

        try {
            await CartaoSalvarModel.salvarCartao({
                usuarioId,
                paymentToken:   payment_token,
                bandeira:       bandeira        || null,
                ultimosDigitos: ultimos_digitos || null,
                nomeTitular:    nome_titular    || null,
                mesValidade:    mes_validade    || null,
                anoValidade:    ano_validade    || null
            });

            logger.info(`[Cartao] Cartão salvo. userId=${usuarioId}, bandeira=${bandeira}`);
            return res.status(200).json({ message: 'Cartão salvo com sucesso.' });

        } catch (err) {
            logger.error(`[Cartao] Erro ao salvar cartão. userId=${usuarioId}`, { erro: err.message });
            return res.status(500).json({ error: 'Erro ao salvar cartão.' });
        }
    },

    async buscarCartao(req, res) {
        const { id } = req.params;
        const usuarioId = parseInt(id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        try {
            const cartao = await CartaoBuscarModel.getCartaoAtivo(usuarioId);
            if (!cartao) {
                return res.status(404).json({ error: 'Nenhum cartão cadastrado.' });
            }
            return res.status(200).json({ cartao });

        } catch (err) {
            logger.error(`[Cartao] Erro ao buscar cartão. userId=${usuarioId}`, { erro: err.message });
            return res.status(500).json({ error: 'Erro ao buscar cartão.' });
        }
    },

    async removerCartao(req, res) {
        const { id } = req.params;
        const usuarioId = parseInt(id, 10);

        if (req.session.user.id !== usuarioId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        try {
            const afetados = await CartaoRemoverModel.removerCartao(usuarioId);
            if (!afetados) {
                return res.status(404).json({ error: 'Nenhum cartão ativo encontrado.' });
            }
            logger.info(`[Cartao] Cartão removido. userId=${usuarioId}`);
            return res.status(200).json({ message: 'Cartão removido com sucesso.' });

        } catch (err) {
            logger.error(`[Cartao] Erro ao remover cartão. userId=${usuarioId}`, { erro: err.message });
            return res.status(500).json({ error: 'Erro ao remover cartão.' });
        }
    }
};

module.exports = CartaoController;
