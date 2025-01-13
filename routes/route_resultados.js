const express = require('express');
const router = express.Router();
const connection = require('../database/connection');
const logger = require('../logger'); // Assegure-se de importar o logger

// Função para carregar resultados financeiros
router.get('/api/resultados-financeiros', (req, res) => {
    logger.info('Consulta iniciada para resultados financeiros');

    const sqlQuery = 'SELECT * FROM resultados_financeiros WHERE status_ativo = 1'; // Nome correto da tabela

    connection.query(sqlQuery, (error, results) => {
        if (error) {
            logger.error('Erro ao consultar a tabela resultados_financeiros:', error);
            return res.status(500).json({ error: 'Erro ao consultar resultados financeiros' });
        }

        logger.info(`Resultados financeiros obtidos: ${JSON.stringify(results)}`);
        res.json(results); // Retorna os dados como JSON
    });
});

module.exports = router;

