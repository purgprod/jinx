// models/usuarios/model_coletar_suitability_usuario.js

const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class ColetarSuitabilityUsuarioModel {

    static async obterSuitabilityUsuario(usuario_id) {
        const sqlQuery = `
            SELECT 
                qual_objetivo,
                quanto_tempo,
                qual_necessidade,
                qual_percentual,
                oscilacoes_mercado,
                formacao,
                experiencia,
                expectativa_5_anos,
                operacoes_derivativos,
                volume_frequencia_renda_fixa_basica,
                volume_frequencia_outros,
                volume_frequencia_renda_variavel_basica,
                volume_frequencia_derivativos
            FROM suitability
            WHERE usuario_id = ?
        `;

        logger.info(`Buscando respostas do usuário com ID: ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar respostas do usuário ${usuario_id}:`, error);
                    reject(error);
                } else {
                    if (results.length === 0) {
                        resolve({});
                    } else {
                        resolve(results[0]);
                    }
                }
            });
        });
    }
}

module.exports = ColetarSuitabilityUsuarioModel;

