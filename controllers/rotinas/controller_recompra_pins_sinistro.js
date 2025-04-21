// controllers/rotinas/controller_recompra_pins_sinistro.js
const logger = require('../../logger');
const BuscarPinsSinistroModel = require('../../models/rotinas/model_buscar_pins_sinistro');
const BuscarUsuariosPinsSinistroModel = require('../../models/rotinas/model_buscar_usuarios_com_pins_sinistro');
const ZerarPinsSinistroModel = require('../../models/rotinas/model_zerar_pins_sinistro_para_clientes');

const MAX_USUARIOS_LOG = process.env.MAX_USUARIOS_LOG || 100;

const RecompraPinsSinistroController = {
    /**
     * Executa a rotina de recompra‑pins‑sinistro.
     * 1. Busca tokens em sinistro;
     * 2. Para cada token, busca usuários impactados;
     * 3. Zera os tokens para os usuários;
     * 4. Retorna estrutura consolidada.
     */
    async executeRecompraPinsSinistro(req, res) {
        logger.info('Iniciando recompra‑pins‑sinistro');

        try {
            /* ------------------------------------------------------------------
             * 1) Tokens em sinistro
             * ------------------------------------------------------------------ */
            const pinsSinistro = await BuscarPinsSinistroModel.getPinsSinistro();

            if (!pinsSinistro.length) {
                logger.warn('Nenhum Pin em sinistro encontrado');
                return res.status(200).json({
                    mensagem: 'Nenhum Pin em sinistro.',
                    pinsSinistro: [],
                    usuariosPorToken: {},
                });
            }

            // Extraí os IDs dos tokens
            const idTokens = [];
            for (const pin of pinsSinistro) {
                const tokenId = parseInt(pin.id_token, 10);
                logger.info(`token_id extraído do pin: ${pin.id_token}`);
                logger.info(`token_id processado: ${tokenId} (${typeof tokenId})`);
                
                if (!isNaN(tokenId)) {
                    idTokens.push(tokenId);
                } else {
                    logger.warn(`Token ID inválido: ${pin.id_token}`);
                }
            }

            logger.info(`Pins em sinistro localizados: ${idTokens.length}`);
            logger.info(`Pins: ${idTokens}`);

            /* ------------------------------------------------------------------
             * 2) Usuários por token
             * ------------------------------------------------------------------ */
            const usuariosPorToken = {};

            // Use um loop for...of para processar cada token
            for (const tokenId of idTokens) {
                try {
                    logger.info(`Iniciando busca de usuários para o Pin ${tokenId}`);
                    const usuarios = await BuscarUsuariosPinsSinistroModel.getUsuariosPinsSinistro(tokenId);
                    logger.info(`Resultado da busca para o Pin ${tokenId}: ${usuarios.length} usuários encontrados`);
                    logger.info(`Primeiros 5 usuários: ${JSON.stringify(usuarios.slice(0, 5))}`);

                    usuariosPorToken[tokenId] = usuarios;

                } catch (usuarioErr) {
                    logger.error(`Erro ao buscar usuários para o Pin ${tokenId}:`, usuarioErr);
                    logger.error(`Detalhes do erro: ${usuarioErr.message}`);
                    usuariosPorToken[tokenId] = [];
                }
            }

            if (Object.keys(usuariosPorToken).length === 0) {
                logger.warn('Nenhum usuário encontrado para os pins em sinistro');
                return res.status(200).json({
                    mensagem: 'Nenhum usuário encontrado para os pins em sinistro.',
                    pinsSinistro: pinsSinistro,
                    usuariosPorToken: {},
                });
            }

            /* ------------------------------------------------------------------
             * 3) Zerar os tokens para os usuários - USANDO FOR LOOP
             * ------------------------------------------------------------------ */
            logger.info('Iniciando processo de zerar tokens para usuários');

            const usuariosAFazerZerar = [];
            for (const tokenId in usuariosPorToken) {
                usuariosAFazerZerar.push(...usuariosPorToken[tokenId]);
            }

            if (usuariosAFazerZerar.length === 0) {
                logger.warn('Nenhum usuário para zerar tokens');
            } else {
                logger.info(`Lista de usuários para zerar tokens: ${JSON.stringify(usuariosAFazerZerar)}`);
                logger.info(`Total de usuários para zerar tokens: ${usuariosAFazerZerar.length}`);
                logger.info(`Primeiros 5 usuários a serem processados: ${JSON.stringify(usuariosAFazerZerar.slice(0, 5))}`);

                for (const usuario of usuariosAFazerZerar) {
                    try {
                        logger.info(`Iniciando processo de zerar tokens para o usuário ${usuario.usuario_id}`);
                        
                        // Verifica se o token_id do usuário é válido
                        let token = usuario.token_id;
                        
                        // Garanta que o token seja um número
                        if (typeof token === 'string') {
                            token = parseInt(token, 10);
                        }
                        
                        if (typeof token !== 'number' || isNaN(token)) {
                            logger.warn(`Usuário com token inválido: ${JSON.stringify(usuario)}`);
                            continue;
                        }

                        const resultado = await ZerarPinsSinistroModel.zerarPinsSinistro(token);
                        logger.info(`Tokens zerados com sucesso para o usuário ${usuario.usuario_id}`);
                        logger.info(`Resultado da atualização: ${JSON.stringify(resultado)}`);
                    } catch (erro) {
                        logger.error(`Erro ao zerar tokens para o usuário ${usuario.usuario_id}:`, erro);
                        logger.error(`Mensagem do erro: ${erro.message}`);
                        // Aqui você pode decidir se quer continuar com outros usuários ou não
                    }
                }

                logger.info(`Processo de zerar tokens concluído com sucesso`);
            }

            /* ------------------------------------------------------------------
             * 4) Resposta consolidada
             * ------------------------------------------------------------------ */
            logger.info('Rotina recompra‑pins‑sinistro concluída com sucesso');
            return res.status(200).json({
                pinsSinistro: pinsSinistro,
                usuariosPorToken: usuariosPorToken,
                mensagem: 'Tokens zerados com sucesso para os usuários afetados.'
            });
        } catch (error) {
            logger.error('Erro geral na rotina de recompra‑pins‑sinistro:', error);
            logger.error(`Mensagem do erro: ${error.message}`);
            logger.error(`Stack do erro: ${error.stack}`);

            return res.status(500).json({
                error: 'Erro interno ao processar a rotina.',
                mensagem: 'A rotina não foi concluída com sucesso.',
            });
        }
    },
};

module.exports = RecompraPinsSinistroController;

