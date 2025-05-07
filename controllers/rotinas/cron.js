const cron = require('node-cron');
const axios = require('axios');
const logger = require('../../logger');

//----------------------------------------------
// ROTINAS EXCLUSIVAS DE MANUTENÇÃO DO ECOSSISTEMA
// ---------------------------------------------

// Agendar execução da rotina de histórico de free float dos Pins às 00:01:00 todos os dias
cron.schedule('01 00 * * *', async () => {
    try {
        logger.info('[Manutenção] - Iniciando execução da rotina de [Manutenção] - Histórico de free float dos Pins agendada às 00:01:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/tokens-historico-free-float';
        
        // Chamar o endpoint principal (POST)
        const mainResponse = await axios.post(mainUrl);
        
        logger.info(`[Manutenção] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/1/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/1/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/1/manutencao-atualizar-ultima-execucao';
	    const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
    
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

// Agendar execução da rotina de histórico do valor investido e rendimentos por usuário às 00:30:00 todos os dias
cron.schedule('30 0 * * *', async () => {
    try {
        logger.info('[Manutenção] - Iniciando execução da rotina [Manutenção] -Histórico do valor investido e rendimentos por usuário agendada às 00:30:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/investimento-rendimento-historico';
        
        // Chamar o endpoint principal (POST)
        const mainResponse = await axios.post(mainUrl);
        
        logger.info(`[Manutenção] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/2/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/2/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/2/manutencao-atualizar-ultima-execucao';
	    const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});


// Agendar execução da rotina para gerenciamento do Sinistro dos Pins às 01:00:00 todos os dias
cron.schedule('45 0 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Manutenção] - Checagem de Pins em modo sinistro agendada às 00:45:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/checagem-pins-sinistro';
        
        // Chamar o endpoint principal (PUT)
        const mainResponse = await axios.put(mainUrl);
        
        logger.info(`[Manutenção] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/3/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/3/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/3/manutencao-atualizar-ultima-execucao';
	    const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

// Agendar execução da rotina para gerenciamento da data de vencimento dos resultados financeiros às 01:00:00 todos os dias
cron.schedule('0 1 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Manutenção] - Checagem de Resultados Financeiros vencidos agendada às 01:00:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/manutencao-inativar-resultado-financeiro-vencido';
        
        // Chamar o endpoint principal (PUT)
        const mainResponse = await axios.put(mainUrl);
        
        logger.info(`[Manutenção] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);     
            
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/4/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/4/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/4/manutencao-atualizar-ultima-execucao';
	    const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

// Agendar execução da rotina de manutenção para update do ranking dos usuários às 16:00:00 todos os dias
cron.schedule('0 16 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Manutenção] - Atualizar o ranking dos usuários às 16:00:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/manutencao-ranking-usuarios';
        
        // Chamar o endpoint principal (PUT)
        const mainResponse = await axios.put(mainUrl);
        
        logger.info(`[Manutenção] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
       
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/8/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/8/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/8/manutencao-atualizar-ultima-execucao';
            const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

// Agendar execução da rotina de manutenção para update no status_execucao de todas as rotinas para Pendente às 23:58:00 todos os dias
cron.schedule('58 23 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Manutenção] - Atualizar o status execução para Pendente às 23:58:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/manutencao-update-status-execucao-pendente';
        
        // Chamar o endpoint principal (GET)
        const mainResponse = await axios.get(mainUrl);
        
        logger.info(`[Manutenção] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
       
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/9/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/9/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/9/manutencao-atualizar-ultima-execucao';
	    const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

//----------------------------------------------
// ROTINAS EXCLUSIVAS DA POPPY
// ---------------------------------------------

// Agendar execução da rotina para recompra dos Pins em modo sinistro às 15:00:00 todos os dias
cron.schedule('0 15 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Poppy] - Recompra de Pins em modo sinistro agendada às 15:00:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/poppy-recompra-pins-sinistro';
        
        // Chamar o endpoint principal (PUT)
        const mainResponse = await axios.put(mainUrl);
        
        logger.info(`[Poppy] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/5/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/5/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/5/manutencao-atualizar-ultima-execucao';
	    const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

// Agendar execução da rotina para recompra dos Pins vencidos 15:10:00 todos os dias
cron.schedule('10 15 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Poppy] - Recompra de Pins vencidos agendada às 15:10:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/poppy-recompra-pins-vencidos';
        
        // Chamar o endpoint principal (PUT)
        const mainResponse = await axios.put(mainUrl);
        
        logger.info(`[Poppy] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/6/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/6/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/6/manutencao-atualizar-ultima-execucao';
            const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});


// Agendar execução da rotina para pagamento dos rendimentos diário 15:15:00 todos os dias
cron.schedule('15 15 * * *', async () => {
    try {
        logger.info('Iniciando execução da rotina [Poppy] - Pagamento dos rendimentos diário agendada às 15:15:00');
        
        // Configurar o endpoint principal
        const mainUrl = 'http://localhost:3000/api/rotinas/poppy-pagamento-rendimento-diario';
        
        // Chamar o endpoint principal (PUT)
        const mainResponse = await axios.put(mainUrl);
        
        logger.info(`[Poppy] - Execução das regras de negócio da rotina concluída com sucesso. Resposta: ${mainResponse.data.message}`);
        
        // Chamar o primeiro endpoint adicional (POST)
        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
        const executarUrl = 'http://localhost:3000/api/rotinas/7/manutencao-status-execucao-sucesso';
        const executarResponse = await axios.post(executarUrl);
    
        logger.info(`[Manutenção] - Status da última execução da rotina alterado com sucesso. Resposta: ${executarResponse.data.message}`);
        } else {
        // Caso a resposta não seja 'Rotinas executadas com sucesso', executar o seguinte endpoint
                const falhaUrl = 'http://localhost:3000/api/rotinas/7/manutencao-status-execucao-falha';
                const falhaResponse = await axios.put(falhaUrl);
    
                logger.info(`[Manutenção] - Status da execução com falha atualizado com sucesso. Resposta: ${falhaResponse.data.message}`);
                } 
       // Chamar o segundo endpoint adicional (PUT)
            const atualizarUrl = 'http://localhost:3000/api/rotinas/7/manutencao-atualizar-ultima-execucao';
            const atualizarResponse = await axios.put(atualizarUrl);
            
            logger.info(`[Manutenção] - Último horário de execução da rotina alterado com sucesso. Resposta: ${atualizarResponse.data.message}`);
        
    } catch (error) {
        logger.error(`[Manutenção] - Erro ao executar tarefa agendada:`, error);
    }
});

logger.info('Agendador iniciado com sucesso');
