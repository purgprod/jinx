// controllers/rotinas/controller_poppy_compra_diaria_pins.js
//
// Perfil de compra fixo para todos os usuários:
//   50% do saldo → Pins de Emblema (EMB)
//   50% do saldo → distribuído igualitariamente entre todos os outros Pins disponíveis

const logger = require('../../logger');
const { executarCompraDiariaPins } = require('../../services/compra_diaria_pins_service');

const CompraDiariaPinsController = {
    async executarCompraDiariaPins(req, res) {
        logger.info('Iniciando a coleta e processamento sequencial de usuários');

        try {
            const resultados = await executarCompraDiariaPins();

            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                usuariosPro:        resultados.usuariosPro,
                usuariosBasic:      resultados.usuariosBasic,
                totalUsuariosPro:   resultados.usuariosPro.length,
                totalUsuariosBasic: resultados.usuariosBasic.length,
            });
        } catch (error) {
            logger.error('Erro ao processar os usuários:', error);
            return res.status(500).json({
                error: 'Erro ao processar os usuários',
                message: 'Ocorreu um erro ao processar os usuários sequencialmente',
            });
        }
    }
};

module.exports = CompraDiariaPinsController;
