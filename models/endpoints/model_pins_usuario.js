const connection = require('../../database/database_purg');
const logger = require('../../logger');

class PinsUsuarioModel {

    /**
     * Obtém a lista de ativos (tokens) vinculados a um usuário.
     * @param {number|string} usuario_id 
     * @returns {Promise<Array|null>}
     */
    static async getPinsUsuario(usuario_id) {
        const sql = `
            SELECT 
                rf.id_resultado,
                rf.razao_social,
                rf.juros_a_a,
                rf.vencimento,
                rf.risco,
                rf.prazo,
                rf.historico_com_nexoos,
                rf.flag_sinistro,
                rf.data_sinistro,
                t.dias_vencimento,
                t.rendimento_token AS rendimento_token_unitario,
                ut.quantidade_tokens AS quantidade_tokens_total_usuario,
                ut.rendimento_token AS rendimento_token_total_usuario   
            FROM 
                usuario_tokens ut
            INNER JOIN 
                tokens t ON ut.token_id = t.id_token
            INNER JOIN 
                resultados_financeiros rf ON t.id_resultado = rf.id_resultado
            WHERE 
                ut.usuario_id = ?
        `;

        try {
            // Utilizando destructuring para pegar apenas o primeiro elemento (rows) do retorno do mysql2
            const [rows] = await connection.promise().query(sql, [usuario_id]);

            if (!rows || rows.length === 0) {
                logger.warn(`[PinsUsuarioModel] Nenhum pin encontrado para o usuario_id: ${usuario_id}`);
                return []; // Retornar array vazio é semântica correta para coleções não encontradas
            }

            logger.info(`[PinsUsuarioModel] ${rows.length} pins recuperados para o usuario_id: ${usuario_id}`);
            return rows; 

        } catch (error) {
            logger.error(`[PinsUsuarioModel] Erro na query getPinsUsuario para ID ${usuario_id}: ${error.message}`);
            // Não tentamos logar 'rows' aqui pois o erro ocorreu antes ou durante a atribuição
            throw error; // Re-throw para o Controller tratar (Error Handling centralizado)
        }
    }
}

module.exports = PinsUsuarioModel;
