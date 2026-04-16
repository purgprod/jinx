const logger = require('../../logger');
const BuscarSinistrosModel = require('../../models/rotinas/model_manutencao_buscar_carteiras');
const UpdateSinistroUsuariosModel = require('../../models/rotinas/model_manutencao_update_sinistro_usuarios');
const ligas = require('./sinistro'); // Importa o arquivo de ligas

const ManutencaoSinistroUsuariosController = {
    async executeManutencaoSinistroUsuarios(req, res) {
        try {
            logger.info('Iniciando manutenção de sinistros');

            // Etapa 1: Buscar sinistros
            const sinistros = await BuscarSinistrosModel.getCarteiras();

            if (!sinistros || sinistros.length === 0) {
                logger.warn('Nenhum sinistro encontrado');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    sinistros: []
                });
            }

            // Etapa 2: Processar os dados
            logger.info('Processando dados dos sinistros');

            try {
                for (const sinistro of sinistros) {
                    logger.info(`Dados do sinistro do usuário ${sinistro.usuario_id}:`);
                    logger.info(`Liga: ${sinistro.liga}`);
                    logger.info('----------------------------------------');
                }

                logger.info('Processamento de dados concluído com sucesso');

                // Etapa 3: Definir valor do sinistro com base na liga
                logger.info('Iniciando definição do valor do sinistro');

                for (const sinistro of sinistros) {
                    if (sinistro.liga === null) {
                        sinistro.sinistro = 0;
                        logger.info(`Valor do sinistro definido de ${sinistro.sinistro}% para o usuário ${sinistro.usuario_id} (Liga não encontrada)`);
                        continue;
                    }

                    const ligaEncontrada = ligas.find(r => r.nomeLiga === sinistro.liga);
                    if (ligaEncontrada) {
                        sinistro.sinistro = ligaEncontrada.sinistro;
                        logger.info(`Valor do sinistro definido de ${sinistro.sinistro}% para o usuário ${sinistro.usuario_id}`);
                    } else {
                        sinistro.sinistro = 0;
                        logger.info(`Valor do sinistro definido de ${sinistro.sinistro}% para o usuário ${sinistro.usuario_id} (Liga não encontrada)`);
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

