const connection = require('../../database/database_purg');
const logger = require('../../logger');

const FlagSinistroResultadoModel = {
    /**
     * Atualiza o flag_sinistro do resultado financeiro com base na data_sinistro
     * @param {Number} id_resultado - ID do resultado financeiro
     * @param {String|null} data_sinistro - Data do sinistro no formato ISO ou null
     */
    async updateFlagSinistro(id_resultado, data_sinistro) {
        const sqlQuery = `UPDATE resultados_financeiros
            SET flag_sinistro = ? 
            WHERE id_resultado = ?;`;
            
        // Nova query para atualizar o status_ativo na tabela tokens
        const sqlUpdateStatus = `
            UPDATE tokens t
            INNER JOIN resultados_financeiros rf
            ON t.id_resultado = rf.id_resultado
            SET t.status_ativo = rf.status_ativo
            WHERE t.status_ativo != rf.status_ativo
            AND rf.flag_sinistro = 0
            AND rf.data_sinistro IS NULL;`;

        return new Promise((resolve, reject) => {
            // Define o valor do flag_sinistro com base na data_sinistro
            const today = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD

            let formattedDate = null;
            let flag = 0;

            if (data_sinistro) {
                // Converte a data_sinistro para o formato YYYY-MM-DD
                const date = new Date(data_sinistro);
                formattedDate = date.toISOString().split('T')[0];
                
                if (formattedDate <= today) {
                    flag = 1;
                }
            }

            logger.info(`Preparando atualização do flag_sinistro`);
            logger.info(`Dados da atualização:
                id_resultado: ${id_resultado}
                data_sinistro: ${data_sinistro}
                formattedDate: ${formattedDate}
                flag_sinistro: ${flag}`);

            // Obtém uma conexão do pool
            connection.getConnection((err, conn) => {
                if (err) {
                    logger.error('Erro ao obter conexão:', err);
                    reject(new Error('Erro ao obter conexão'));
                    return;
                }

                // Configurações para retry
                const MAX_RETRIES = 3;
                let retries = 0;

                const executeTransaction = async (conn) => {
                    try {
                        // Inicia a transação
                        await new Promise((resolve, reject) => {
                            conn.beginTransaction((err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });

                        // Executa a primeira atualização
                        const firstUpdate = await new Promise((resolve, reject) => {
                            conn.query(sqlQuery, [flag, id_resultado], (error, results) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(results);
                                }
                            });
                        });

                        // Executa a segunda atualização do status_ativo
                        const secondUpdate = await new Promise((resolve, reject) => {
                            conn.query(sqlUpdateStatus, (error) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve();
                                }
                            });
                        });

                        // Confirma a transação
                        await new Promise((resolve, reject) => {
                            conn.commit((commitError) => {
                                if (commitError) {
                                    reject(commitError);
                                } else {
                                    resolve();
                                }
                            });
                        });

                        logger.info(`Atualização concluída com sucesso para o resultado ${id_resultado}`);
                        conn.release();
                        resolve(firstUpdate);

                    } catch (error) {
                        if (error.code === 'ELOCK' || error.message.includes('Deadlock')) {
                            if (retries < MAX_RETRIES) {
                                retries++;
                                logger.info(`Tentativa ${retries} falhou devido a deadlock. Nova tentativa em 500ms...`);
                                setTimeout(() => executeTransaction(conn), 500);
                            } else {
                                logger.error(`Falha após ${MAX_RETRIES} tentativas`);
                                conn.release();
                                reject(error);
                            }
                        } else {
                            logger.error('Erro ao executar transação:', error);
                            conn.release();
                            reject(error);
                        }
                    }
                };

                executeTransaction(conn).catch(reject);
            });
        });
    }
};

module.exports = FlagSinistroResultadoModel;

