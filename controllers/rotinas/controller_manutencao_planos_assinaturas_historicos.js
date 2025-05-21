const BuscarPlanosModel = require('../../models/rotinas/model_manutencao_buscar_planos_assinaturas');
const PlanosAssinaturasInsertModel = require('../../models/rotinas/model_manutencao_insert_planos_assinaturas');
const logger = require('../../logger');

/**
 * Controller responsável por buscar histórico de planos e assinaturas
 */
const ManutencaoPlanosAssinaturasHistoricosController = {
    /**
     * Busca histórico de planos e assinaturas
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async executeManutencaoPlanosAssinaturasHistoricos(req, res) {
        try {
            // Etapa 1: Busca os planos de assinaturas dos usuários
            const planos = await BuscarPlanosModel.getPlanos();
            logger.info(`Planos encontrados: ${JSON.stringify(planos)}`);

            if (planos.length === 0) {
                logger.info('Nenhum plano encontrado');
                return res.status(200).json({ 
                    message: 'Nenhum plano encontrado',
                    results: [] 
                });
            }

            // Etapa 2: Somar os valores de "Poppy Basic" e "Poppy Pro"
            const totalPoppyBasic = planos.reduce((total, plano) => {
                return plano.assinatura === 'Poppy Basic' ? total + 1 : total;
            }, 0);

            const totalPoppyPro = planos.reduce((total, plano) => {
                return plano.assinatura === 'Poppy Pro' ? total + 1 : total;
            }, 0);

            logger.info(`Total Poppy Basic: ${totalPoppyBasic}`);
            logger.info(`Total Poppy Pro: ${totalPoppyPro}`);

            // Etapa 3: Fazer o insert dos totais
            await PlanosAssinaturasInsertModel.insertPlanos(totalPoppyBasic, totalPoppyPro);
            logger.info('Totais inseridos com sucesso no banco de dados');

            // Processa os planos (aqui você pode adicionar lógica adicional de processamento)
            const processedPlanos = planos.map(plano => {
                return {
                    assinatura: plano.assinatura,
                    status: 'sucesso',
                    message: 'Plano encontrado com sucesso'
                };
            });

            // Retorno com os totais
            res.status(200).json({
                message: 'Busca e inserção de planos realizada com sucesso',
                totals: {
                    poppyBasic: totalPoppyBasic,
                    poppyPro: totalPoppyPro
                },
                results: processedPlanos
            });

        } catch (error) {
            logger.error('Erro ao buscar ou inserir histórico de planos e assinaturas:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar ou inserir histórico de planos e assinaturas',
                message: error.message 
            });
        }
    }
};

module.exports = ManutencaoPlanosAssinaturasHistoricosController;

