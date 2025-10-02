// models/usuarios/model_coletar_suitability_complementar_usuario.js

const mysql = require('mysql2');
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class ColetarSuitabilityComplementarUsuarioModel {

    static async obterSuitabilityComplementarUsuario(usuario_id) {
        const sqlQuery = `
            SELECT 
                tolerancia_risco,
                expectativa_retorno,
                reacao_mudanca_mercado,
                abordagem_diversificacao,
                influencia_oscilacoes_mercado,
                nivel_conforto_renda_variavel,
                tempo_resiliencia_perdas,
                busca_novas_oportunidades
            FROM suitability_complementar
            WHERE usuario_id = ?
        `;

        logger.info(`Buscando respostas complementares do usuário com ID: ${usuario_id}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, [usuario_id], (error, results) => {
                if (error) {
                    logger.error(`Erro ao buscar respostas complementares do usuário ${usuario_id}:`, error);
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

module.exports = ColetarSuitabilityComplementarUsuarioModel;

