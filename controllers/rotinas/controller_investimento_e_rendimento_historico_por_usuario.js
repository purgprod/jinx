const UsuariosModel = require('../../models/rotinas/model_usuarios_ativos');
const InvestimentoRendimentoUsuarioModel = require('../../models/rotinas/model_historico_tokens_por_usuario');
const InvestimentoRendimentoInsertModel = require('../../models/rotinas/model_historico_tokens_por_usuario_insert');
const logger = require('../../logger');

/**
 * Controller responsável por buscar histórico de investimentos e rendimentos por usuário
 */
const InvestimentoRendimentoHistoricoController = {
    /**
     * Busca histórico de investimentos e rendimentos para cada usuário ativo e insere no banco
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    async executeInvestimentoRendimentoHistorico(req, res) {
        try {
            // Busca os usuários ativos
            const activeUsers = await UsuariosModel.getActiveUsers();
            logger.info(`Usuários ativos encontrados: ${activeUsers.length}`);

            if (activeUsers.length === 0) {
                logger.info('Nenhum usuário ativo encontrado');
                return res.status(200).json({ message: 'Nenhum usuário ativo encontrado' });
            }

            // Cria uma data no formato correto para o Banco de Dados
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const hour = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;

            // Processa cada usuário para buscar os valores e inserir no histórico
            const processedUsers = await Promise.all(
                activeUsers.map(async (user) => {
                    try {
                        const userValues = await InvestimentoRendimentoUsuarioModel.getValoresByUsuarioId(user.usuario_id);

                        // Verifica se os valores são válidos
                        if (userValues.carteira_dia === null || userValues.rendimento_dia === null) {
                            logger.info(`Usuário ${user.usuario_id} não tem valores válidos`);
                            return {
                                usuario_id: user.usuario_id,
                                status: 'sem_valores',
                                message: 'Usuário não tem valores válidos'
                            };
                        }

                        // Prepara os dados para insert
                        const insertData = {
                            data: formattedDate,
                            usuario_id: user.usuario_id,
                            carteira_dia: userValues.carteira_dia,
                            rendimento_dia: userValues.rendimento_dia
                        };

                        // Insere o histórico
                        await InvestimentoRendimentoInsertModel.insertHistorico(insertData);

                        return {
                            usuario_id: user.usuario_id,
                            carteira_dia: insertData.carteira_dia,
                            rendimento_dia: insertData.rendimento_dia,
                            status: 'sucesso',
                            data_criacao: insertData.data
                        };
                    } catch (error) {
                        logger.error(`Erro ao processar usuário ${user.usuario_id}:`, error);
                        return {
                            usuario_id: user.usuario_id,
                            status: 'erro',
                            message: 'Erro ao processar usuário'
                        };
                    }
                })
            );

            res.status(200).json({
                message: 'Histórico processado com sucesso',
                results: processedUsers
            });

        } catch (error) {
            logger.error('Erro ao processar histórico de investimentos e rendimentos:', error);
            res.status(500).json({ error: 'Erro ao processar histórico de investimentos e rendimentos' });
        }
    }
};

module.exports = InvestimentoRendimentoHistoricoController;
