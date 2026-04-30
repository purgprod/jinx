// services/compra_diaria_pins_service.js
// Orquestra a compra diária de Pins para todos os usuários ativos.
// Chamado pelo controller de rotina E pelo serviço de venda de Pins (após a venda completa).

'use strict';

const logger = require('../logger');
const BuscarUsuariosCarteirasModel = require('../models/rotinas/model_poppy_buscar_usuarios_e_carteiras');
const { processarUsuario } = require('./compra_pins_usuario_service');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executa a compra diária de Pins para todos os usuários ativos.
 * Processa Pro primeiro (ordem decrescente de pontos), depois Basic.
 *
 * @returns {{ usuariosPro: Array, usuariosBasic: Array }}
 */
async function executarCompraDiariaPins() {
    logger.info('[COMPRA] Iniciando compra diária de Pins para todos os usuários');

    const usuariosCarteiras = await BuscarUsuariosCarteirasModel.getUsuariosCarteiras();

    if (!usuariosCarteiras.length) {
        logger.warn('[COMPRA] Nenhum usuário ativo encontrado');
        return { usuariosPro: [], usuariosBasic: [] };
    }

    const usuariosPro   = [];
    const usuariosBasic = [];

    for (const usuario of usuariosCarteiras) {
        switch (usuario.assinatura) {
            case 'Poppy Pro':   usuariosPro.push(usuario);   break;
            case 'Poppy Basic': usuariosBasic.push(usuario); break;
        }
    }

    usuariosPro.sort((a, b) => b.pontos - a.pontos);
    usuariosBasic.sort((a, b) => b.pontos - a.pontos);

    logger.info(`[COMPRA] Usuários Pro: ${usuariosPro.length} | Basic: ${usuariosBasic.length}`);

    const resultados = { usuariosPro: [], usuariosBasic: [] };

    for (const usuario of usuariosPro) {
        try {
            const processado = await processarUsuario(usuario);
            await sleep(5000);
            resultados.usuariosPro.push(processado);
        } catch (error) {
            logger.error(`[COMPRA] Erro ao processar usuário Pro ${usuario.usuario_id}: ${error.message}`);
            resultados.usuariosPro.push({ ...usuario, error: 'Erro ao processar o usuário' });
        }
    }

    for (const usuario of usuariosBasic) {
        try {
            const processado = await processarUsuario(usuario);
            await sleep(5000);
            resultados.usuariosBasic.push(processado);
        } catch (error) {
            logger.error(`[COMPRA] Erro ao processar usuário Basic ${usuario.usuario_id}: ${error.message}`);
            resultados.usuariosBasic.push({ ...usuario, error: 'Erro ao processar o usuário' });
        }
    }

    logger.info(`[COMPRA] Compra diária concluída. Pro: ${resultados.usuariosPro.length} | Basic: ${resultados.usuariosBasic.length}`);
    return resultados;
}

module.exports = { executarCompraDiariaPins };
