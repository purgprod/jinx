const pool = require('../../database/database_purg');
const util = require('util');
const logger = require('../../logger');

// Promisify the pool.execute method
const executePromise = util.promisify(pool.execute.bind(pool));

exports.findUserByEmail = async (email) => {
    try {
        logger.info(`Buscando usuário Purg com e-mail: ${email}`);
        const query = 'SELECT * FROM users WHERE email = ?';
        logger.debug(`Query executada: ${query}`);
        logger.debug(`Parâmetro(s) da query: ${email}`);

        const [results] = await executePromise(query, [email]);
        logger.debug(`Resultados da query: ${Array.isArray(results) ? results.length + " registro(s)" : "affectedRows=" + (results?.affectedRows ?? "?")}`);

        let user = null;

        // Verifica se os resultados são um array
        if (Array.isArray(results)) {
            if (results.length > 0) {
                user = results[0];
            }
        }
        // Caso results seja um objeto único
        else if (results && typeof results === 'object') {
            user = results;
        }

        if (user) {
            logger.info(`Usuário encontrado: ${JSON.stringify(user)}`);
            return user;
        } else {
            logger.info('Nenhum usuário Purg encontrado com este e-mail.');
            return null;
        }
    } catch (error) {
        logger.error(`Erro ao consultar o banco de dados da Purg: ${error.message}`);
        logger.error(`Erro completo: ${error}`);
        throw error;
    }
};

