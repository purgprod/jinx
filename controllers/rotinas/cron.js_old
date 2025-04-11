const cron = require('node-cron');
const axios = require('axios');
const logger = require('../../logger');

// Agendar execução da rotina de histórico de free float dos tokens às 00:01 todos os dias
cron.schedule('01 00 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina de histórico de free float dos tokens agendada às 00:01');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/tokens-historico-free-float';
        
        // Chamar o endpoint principal
        const mainResponse = await axios.post(mainUrl);
        
        logger.info(`Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
            // Chamar o primeiro endpoint adicional (POST)
            const executarUrl = 'http://localhost:3000/api/rotinas/1/executar';
            const executarResponse = await axios.post(executarUrl);
            
            logger.info(`Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
            
            // Chamar o segundo endpoint adicional (POST)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/1/atualizar-execucao';
            const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        }
    } catch (error) {
        logger.error(`Erro ao executar tarefa agendada:`, error);
    }
});

logger.info('Agendador iniciado com sucesso');
