// models/emblemas/model_buscar_pagamento_emblemas_total.js

const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class EmblemasTotalModel {

    // Método para obter o total investido em Pins de Emblema (risco = 'EMB') no ecossistema
    static async getEmblemasTotal(usuarioId) {
        const query = `
            SELECT
                SUM(ut.quantidade_tokens * 0.01) AS emblemas
            FROM usuario_tokens ut
            INNER JOIN tokens t ON ut.token_id = t.id_token
            WHERE t.risco = 'EMB'
              AND ut.quantidade_tokens > 0
              AND ut.usuario_id != ?
        `;
        logger.info('Recuperando total investido em Pins de Emblema para o ecossistema');
        try {
            const [rows] = await connection.promise().query(query, [usuarioId]);
            return rows;
        } catch (error) {
            logger.error(`Erro ao buscar total de Pins de Emblema para o ecossistema: ${error.message}`);
            throw error;
        }
    }
}

module.exports = EmblemasTotalModel;

