const logger = require('../../logger');
const BuscarSinistrosModel = require('../../models/rotinas/model_manutencao_buscar_carteiras');
const UpdateSinistroUsuariosModel = require('../../models/rotinas/model_manutencao_update_sinistro_usuarios');
const rankings = require('./sinistro'); // Importe o arquivo de rankings

const ManutencaoSinistroUsuariosController = {
    async executeManutencaoSinistroUsuarios(req, res) {
        try {
            logger.info('Iniciando manutenção de sinistros');

            // Etapa 1: Buscar sinistros
            const sinistros = await BuscarSinistrosModel.getCarteiras();

            if (!sinistros || sinistros.length === 0) {
                logger.warn('Nenhum sinistro encontrado');
                return res.status(200).json({
                    message: 'Nenhum sinistro encontrado',
                    sinistros: []
                });
            }

            // Etapa 2: Processar os dados
            logger.info('Processando dados dos sinistros');

            try {
                for (const sinistro of sinistros) {
                    logger.info(`Dados do sinistro do usuário ${sinistro.usuario_id}:`);
                    logger.info(`Ranking: ${sinistro.ranking}`);
                    logger.info('----------------------------------------');
                }

                logger.info('Processamento de dados concluído com sucesso');

                // Etapa 3: Definir valor do sinistro com base no ranking
                logger.info('Iniciando definição do valor do sinistro');

                for (const sinistro of sinistros) {
                    if (sinistro.ranking === null) {
                        sinistro.sinistro = 0;
                        logger.info(`Valor do sinistro definido como ${sinistro.sinistro} para o usuário ${sinistro.usuario_id} (Ranking não encontrado)`);
                        continue;
                    }

                    const rankingEncontrado = rankings.find(r => r.nomeRanking === sinistro.ranking);
                    if (rankingEncontrado) {
                        sinistro.sinistro = rankingEncontrado.sinistro;
                        logger.info(`Valor do sinistro definido como ${sinistro.sinistro} para o usuário ${sinistro.usuario_id}`);
                    } else {
                        sinistro.sinistro = 0;
                        logger.info(`Valor do sinistro definido como ${sinistro.sinistro} para o usuário ${sinistro.usuario_id} (Ranking não encontrado)`);
                    }
                }

                logger.info('Definição do valor do sinistro concluída com sucesso');

                // Etapa 4: Atualizar os valores no banco de dados
                logger.info('Iniciando atualização dos valores no banco de dados');

                for (const sinistro of sinistros) {
                    try {
                        await UpdateSinistroUsuariosModel.executarUpdate(sinistro.sinistro, sinistro.usuario_id);
                        logger.info(`Valor do sinistro atualizado com sucesso para o usuário ${sinistro.usuario_id}`);
                    } catch (error) {
                        logger.error(`Erro ao atualizar o sinistro para o usuário ${sinistro.usuario_id}: ${error.message}`);
                        // Continua executando mesmo que um update falhe
                    }
                }

                logger.info('Atualização dos valores no banco de dados concluída com sucesso');

                // Resposta final com os dados processados
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    sinistros: sinistros
                });

            } catch (error) {
                logger.error(`Erro ao processar os dados: ${error.message}`);
                return res.status(500).json({
                    error: 'Erro interno',
                    message: 'Ocorreu um erro ao processar os dados dos sinistros'
                });
            }

        } catch (error) {
            logger.error(`Erro inesperado: ${error.message}`);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a execução da rotina'
            });
        }
    }
};

module.exports = ManutencaoSinistroUsuariosController;

