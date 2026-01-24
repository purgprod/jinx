const connection = require('../../database/database_purg');
const logger = require('../../logger');
const util = require('util');

// Promisificamos apenas o método que vamos usar
const queryPromise = util.promisify(connection.query).bind(connection);

const BuscarHistoricoSaqueUsuarioModel = {
    async getHistoricoSaqueUsuario(usuario_id) {
        const sqlQuery = `
            SELECT * 
            FROM saques 
            WHERE usuario_id = ? 
            ORDER BY data_criacao DESC;
        `;

        try {
            // Agora a chamada retorna uma Promise que resolve diretamente nos resultados (rows)
            const results = await queryPromise(sqlQuery, [usuario_id]);
            
            return results || []; 
        } catch (error) {
            logger.error(`Database Error [getHistoricoSaqueUsuario]: ${error.message}`);
            throw error; 
        }
    }
};

module.exports = BuscarHistoricoSaqueUsuarioModel;
