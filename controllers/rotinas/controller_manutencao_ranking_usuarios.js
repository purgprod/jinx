const logger = require('../../logger');
const BuscarCarteirasModel = require('../../models/rotinas/model_manutencao_buscar_carteiras');
const BuscarUsuariosModel = require('../../models/rotinas/model_manutencao_buscar_usuarios');
const UpdateRankingUsuariosModel = require('../../models/rotinas/model_manutencao_update_ranking_usuarios');
const rankings = require('./rankings');
const { sincronizarPontosUsuario } = require('../../services/objetivos_service');

const ManutencaoRankingUsuariosController = {
    async executeManutencaoRankingUsuarios(req, res) {
        try {
            logger.info('Iniciando manutenção de ranking de usuários');

            // Etapa 1: Buscar carteiras
            const carteiras = await BuscarCarteirasModel.getCarteiras();
            if (!carteiras || carteiras.length === 0) {
                logger.warn('Nenhuma carteira encontrada');
                return res.status(200).json({
                    message: 'Rotinas executadas com sucesso',
                    carteiras: []
                });
            }

            // Etapa 2: Buscar dados dos usuários
            const usuarios = await BuscarUsuariosModel.getUsuarios();
            const usuariosMap = {};
            usuarios.forEach(u => { usuariosMap[u.usuario_id] = u; });

            // Etapa 3: Recalcular e sincronizar pontos de cada usuário com base nas metas
            logger.info('Sincronizando pontos de cada usuário a partir do progresso real das metas');
            const usuariosProcessados = {};

            for (const carteira of carteiras) {
                const usuarioId = carteira.usuario_id;

                try {
                    const pontos = await sincronizarPontosUsuario(usuarioId);

                    usuariosProcessados[usuarioId] = {
                        pontos_total: pontos,
                        valor_total:  pontos
                    };

                    logger.info(`Usuário ${usuarioId} → Pontos sincronizados: ${pontos}`);
                    logger.info('----------------------------------------');
                } catch (errSync) {
                    logger.error(`Erro ao sincronizar pontos do usuário ${usuarioId}: ${errSync.message}`);
                }
            }

            logger.info('Sincronização de pontos concluída com sucesso');

            // Etapa 4: Verificar o ranking de cada usuário
            logger.info('Iniciando verificação do ranking dos usuários');
            const rankingsOrdenados = [...rankings].sort((a, b) => b.valorMinimo - a.valorMinimo);

            for (const usuarioId in usuariosProcessados) {
                const valorTotal = usuariosProcessados[usuarioId].valor_total;
                let nomeRanking = 'Cobre I'; // padrão mais baixo

                const usuario = usuariosMap[usuarioId];
                if (usuario) {
                    logger.info(`Assinatura do usuário ${usuarioId}: ${usuario.assinatura}`);
                    if (usuario.assinatura === 'Poppy Basic') {
                        nomeRanking = 'Cobre I';
                    } else {
                        for (const ranking of rankingsOrdenados) {
                            if (valorTotal >= ranking.valorMinimo) {
                                nomeRanking = ranking.nomeRanking;
                                break;
                            }
                        }
                    }
                } else {
                    logger.warn(`Usuário ${usuarioId} não encontrado nos dados de usuários.`);
                }

                logger.info(`Verificação do ranking para o usuário ${usuarioId}:`);
                logger.info(`Pontos totais (valor para ranking): ${valorTotal.toFixed(2)}`);
                logger.info(`Ranking determinado: ${nomeRanking}`);
                logger.info('----------------------------------------');

                usuariosProcessados[usuarioId].nomeRanking = nomeRanking;
            }

            // Etapa 5: Atualizar o ranking no banco de dados
            logger.info('Iniciando atualização do ranking dos usuários no banco de dados');
            const promessasUpdate = Object.entries(usuariosProcessados).map(
                ([usuarioId, dados]) =>
                    UpdateRankingUsuariosModel.executarUpdate(dados.nomeRanking, usuarioId)
            );
            await Promise.all(promessasUpdate);
            logger.info('Atualização do ranking dos usuários concluída com sucesso');

            return res.status(200).json({
                message: 'Rotinas executadas com sucesso',
                carteiras,
                usuarios_processados: usuariosProcessados
            });

        } catch (error) {
            logger.error(`Erro inesperado: ${error.message}`);
            return res.status(500).json({
                error: 'Erro interno',
                message: 'Ocorreu um erro inesperado durante a execução da rotina'
            });
        }
    }
};

module.exports = ManutencaoRankingUsuariosController;

