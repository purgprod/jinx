const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../../logger');

const BASE_URL = 'http://localhost:3000';

// Executa uma rotina e atualiza seu status de manutenção.
// Erros são capturados internamente — a cadeia sequencial nunca é interrompida.
async function executarRotina({ id, nome, method, url }) {
    logger.info(`Iniciando execução: ${nome}`);
    try {
        const mainResponse = await axios[method](url);
        logger.info(`Execução concluída: ${nome}. Resposta: ${mainResponse.data.message}`);

        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
            const r = await axios.post(`${BASE_URL}/api/rotinas/${id}/manutencao-status-execucao-sucesso`);
            logger.info(`Status de execução alterado para Sucesso: ${nome}. Resposta: ${r.data.message}`);
        } else {
            const r = await axios.put(`${BASE_URL}/api/rotinas/${id}/manutencao-status-execucao-falha`);
            logger.info(`Status de execução alterado para Falha: ${nome}. Resposta: ${r.data.message}`);
        }

        const r = await axios.put(`${BASE_URL}/api/rotinas/${id}/manutencao-atualizar-ultima-execucao`);
        logger.info(`Última execução atualizada: ${nome}. Resposta: ${r.data.message}`);
    } catch (error) {
        logger.error(`Erro ao executar rotina ${nome} (id: ${id}):`, { message: error.message, stack: error.stack });
    }
}

// Ordem de execução definida pelo horário original de cada rotina (crescente).
const ROTINAS_SEQUENCIAIS = [
    { id: 1,  nome: '[Manutenção] Histórico de free float dos Pins',            method: 'post', url: `${BASE_URL}/api/rotinas/tokens-historico-free-float` },
    { id: 3,  nome: '[Manutenção] Checagem de Pins em modo sinistro',           method: 'put',  url: `${BASE_URL}/api/rotinas/checagem-pins-sinistro` },
    { id: 4,  nome: '[Manutenção] Checagem de Resultados Financeiros vencidos', method: 'put',  url: `${BASE_URL}/api/rotinas/manutencao-inativar-resultado-financeiro-vencido` },
    { id: 5,  nome: '[Poppy] Recompra de Pins em modo sinistro',                method: 'put',  url: `${BASE_URL}/api/rotinas/poppy-recompra-pins-sinistro` },
    { id: 6,  nome: '[Poppy] Recompra de Pins vencidos',                        method: 'put',  url: `${BASE_URL}/api/rotinas/poppy-recompra-pins-vencidos` },
    { id: 12, nome: '[Poppy] Atualizar rendimento diário dos Pins de Emblema',  method: 'put',  url: `${BASE_URL}/api/rotinas/poppy-pagamento-emblema-diario` },
    { id: 7,  nome: '[Poppy] Pagamento dos rendimentos diário',                 method: 'put',  url: `${BASE_URL}/api/rotinas/poppy-pagamento-rendimento-diario` },
    { id: 8,  nome: '[Poppy] Pagamento das assinaturas diário',                 method: 'put',  url: `${BASE_URL}/api/rotinas/poppy-pagamento-assinatura-diario` },
    { id: 15, nome: '[Lulu] Amortização diária de taxa de cartão',             method: 'put',  url: `${BASE_URL}/api/rotinas/lulu-amortizacao-diaria` },
    { id: 16, nome: '[Lulu] Snapshot diário do painel',                        method: 'put',  url: `${BASE_URL}/api/rotinas/lulu-snapshot-diario` },
    { id: 2,  nome: '[Manutenção] Histórico do valor investido e rendimentos',  method: 'post', url: `${BASE_URL}/api/rotinas/investimento-rendimento-historico` },
    { id: 9,  nome: '[Manutenção] Atualizar a liga dos usuários',               method: 'put',  url: `${BASE_URL}/api/rotinas/manutencao-liga-usuarios` },
    { id: 10, nome: '[Manutenção] Atualizar o sinistro dos usuários',           method: 'put',  url: `${BASE_URL}/api/rotinas/manutencao-sinistro-usuarios` },
    { id: 11, nome: '[Poppy] Compra diária de Pins',                            method: 'put',  url: `${BASE_URL}/api/rotinas/poppy-compra-diaria-pins` },
    { id: 13, nome: '[Manutenção] Histórico dos planos dos usuários',           method: 'post', url: `${BASE_URL}/api/rotinas/manutencao-planos-assinaturas-historico` },
    { id: 18, nome: '[Depositos] Cancelar PIX expirados',                      method: 'post', url: `${BASE_URL}/api/rotinas/cancelar-depositos-expirados` },
];

//----------------------------------------------
// CADEIA SEQUENCIAL — dispara às 00:01, cada rotina inicia somente após a anterior concluir
//----------------------------------------------
cron.schedule('01 00 * * *', async () => {
    logger.info('Iniciando cadeia de rotinas sequenciais');
    for (const rotina of ROTINAS_SEQUENCIAIS) {
        await executarRotina(rotina);
    }
    logger.info('Cadeia de rotinas sequenciais concluída');
});

//----------------------------------------------
// ROTINA INDEPENDENTE — executa no próprio horário sem depender da cadeia
//----------------------------------------------

// Atualizar o status_execucao de todas as rotinas para Pendente às 23:58 todos os dias
cron.schedule('58 23 * * *', async () => {
    logger.info('Iniciando execução: [Manutenção] Atualizar o status execução para Pendente');
    try {
        const mainResponse = await axios.get(`${BASE_URL}/api/rotinas/manutencao-update-status-execucao-pendente`);
        logger.info(`Execução concluída: [Manutenção] Atualizar o status execução para Pendente. Resposta: ${mainResponse.data.message}`);

        if (mainResponse.data.message === 'Rotinas executadas com sucesso') {
            const r = await axios.post(`${BASE_URL}/api/rotinas/14/manutencao-status-execucao-sucesso`);
            logger.info(`Status de execução alterado para Sucesso. Resposta: ${r.data.message}`);
        } else {
            const r = await axios.put(`${BASE_URL}/api/rotinas/14/manutencao-status-execucao-falha`);
            logger.info(`Status de execução alterado para Falha. Resposta: ${r.data.message}`);
        }

        const r = await axios.put(`${BASE_URL}/api/rotinas/14/manutencao-atualizar-ultima-execucao`);
        logger.info(`Última execução atualizada. Resposta: ${r.data.message}`);
    } catch (error) {
        logger.error('[Manutenção] - Erro ao executar rotina manutencao-update-status-execucao-pendente (23:58)', { message: error.message, stack: error.stack });
    }
});

//----------------------------------------------
// ROTINA MENSAL — dia 25 de cada mês às 07:00
// Cobra no cartão de crédito o valor total das metas ativas de cada usuário
//----------------------------------------------
cron.schedule('00 07 25 * *', async () => {
    logger.info('Iniciando rotina mensal: [Poppy] Cobrança das metas — Cartão de Crédito');
    try {
        const r = await axios.put(`${BASE_URL}/api/rotinas/poppy-cobranca-metas-cartao`);
        logger.info(`Rotina mensal concluída. Resposta: ${r.data.message}`);
    } catch (error) {
        logger.error('[Poppy] Erro na rotina mensal de cobrança de cartão:', { message: error.message });
    }
});

//----------------------------------------------
// ROTINA DIÁRIA — todos os dias às 09:00
// Notifica usuários com metas mensais incompletas (1, 5, 10, 20 e 29 dias após data_limite)
//----------------------------------------------
cron.schedule('00 09 * * *', async () => {
    logger.info('Iniciando rotina diária: [Nami] Metas mensais incompletas');
    try {
        const r = await axios.post(`${BASE_URL}/api/rotinas/nami-meta-mensal-incompleta`);
        logger.info(`Rotina diária concluída — enfileirados=${r.data.enfileirados}, ignorados=${r.data.ignorados}`);
    } catch (error) {
        logger.error('[Nami] Erro na rotina diária de metas incompletas (09:00):', { message: error.message, stack: error.stack });
    }
});

//----------------------------------------------
// ROTINA DIÁRIA — todos os dias às 10:00
// Notifica usuários com metas vencidas há mais de 10 dias sem conclusão
//----------------------------------------------
cron.schedule('00 10 * * *', async () => {
    logger.info('Iniciando rotina diária: [Nami] Metas vencidas há mais de 10 dias');
    try {
        const r = await axios.post(`${BASE_URL}/api/rotinas/nami-meta-vencida`);
        logger.info(`Rotina diária concluída — enfileirados=${r.data.enfileirados}, ignorados=${r.data.ignorados}`);
    } catch (error) {
        logger.error('[Nami] Erro na rotina diária de metas vencidas (10:00):', { message: error.message, stack: error.stack });
    }
});

//----------------------------------------------
// ROTINA SEMANAL — todo domingo às 08:00
// Enfileira resumo semanal na fila Nami para todos os usuários ativos
//----------------------------------------------
cron.schedule('00 08 * * 0', async () => {
    await executarRotina({ id: 17, nome: '[Nami] Resumo semanal', method: 'post', url: `${BASE_URL}/api/rotinas/nami-resumo-semanal` });
});

//----------------------------------------------
// LIMPEZA DE LOGS — diariamente às 03:00, remove arquivos com mais de 60 dias
//----------------------------------------------
cron.schedule('00 03 * * *', async () => {
    const logDir = path.join(os.homedir(), 'dados', 'logs');
    const RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - RETENTION_MS;
    let removidos = 0;

    logger.info('[Manutenção] Iniciando limpeza de logs antigos');
    try {
        const arquivos = await fs.readdir(logDir);
        for (const arquivo of arquivos) {
            const fullPath = path.join(logDir, arquivo);
            const stat = await fs.stat(fullPath);
            if (stat.isFile() && stat.mtimeMs < cutoff) {
                await fs.unlink(fullPath);
                removidos++;
            }
        }
        logger.info(`[Manutenção] Limpeza de logs concluída — ${removidos} arquivo(s) removido(s)`);
    } catch (error) {
        logger.error('[Manutenção] Erro na limpeza de logs:', { message: error.message });
    }
});

logger.info('Agendador iniciado com sucesso');
