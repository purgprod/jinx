const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const BiometriaModel = require('../../models/endpoints/model_biometria');
const logger = require('../../logger');

const RP_ID   = process.env.WEBAUTHN_RP_ID   || 'purg.com.br';
const RP_NAME = process.env.WEBAUTHN_RP_NAME  || 'Purg';
const ORIGIN  = process.env.WEBAUTHN_ORIGIN   || 'https://purg.com.br';

const BiometriaController = {

    /**
     * POST /api/v1/biometria/cadastro/iniciar
     * Gera as opções de registro WebAuthn. Requer sessão autenticada.
     */
    async cadastroIniciar(req, res) {
        try {
            const { id: usuario_id, email, nome_completo } = req.session.user;

            const credenciaisExistentes = await BiometriaModel.buscarCredenciaisPorUsuario(usuario_id);
            const excludeCredentials = credenciaisExistentes.map(c => ({
                id:   c.credential_id,
                type: 'public-key'
            }));

            const options = await generateRegistrationOptions({
                rpName:    RP_NAME,
                rpID:      RP_ID,
                userID:    String(usuario_id),
                userName:  email,
                userDisplayName: nome_completo,
                attestation: 'none',
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',   // apenas biometria do dispositivo
                    userVerification:        'required',   // exige verificação (digital/face)
                    residentKey:             'preferred'
                },
                excludeCredentials,
                timeout: 60000
            });

            // Guarda o challenge na sessão para validar na etapa seguinte
            req.session.biometriaChallenge = options.challenge;

            logger.info(`[Biometria] Opções de cadastro geradas — usuario_id: ${usuario_id}, email: ${email}, rpID: ${RP_ID}, origin: ${ORIGIN}`);
            return res.status(200).json(options);

        } catch (error) {
            logger.error(`[Biometria] Erro em cadastroIniciar: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao iniciar cadastro biométrico' });
        }
    },

    /**
     * POST /api/v1/biometria/cadastro/concluir
     * Verifica a resposta do dispositivo e persiste a credencial. Requer sessão autenticada.
     */
    async cadastroConcluir(req, res) {
        try {
            const { id: usuario_id } = req.session.user;
            const challenge = req.session.biometriaChallenge;

            if (!challenge) {
                return res.status(400).json({ error: 'Cadastro não iniciado. Chame /cadastro/iniciar primeiro.' });
            }

            const originRecebido = JSON.parse(Buffer.from(req.body.response.clientDataJSON, 'base64').toString()).origin;
            logger.info(`[Biometria] Tentativa de cadastro — usuario_id: ${usuario_id}, origin recebido: ${originRecebido}, origin esperado: ${ORIGIN}, rpID: ${RP_ID}`);

            const verificacao = await verifyRegistrationResponse({
                response:             req.body,
                expectedChallenge:    challenge,
                expectedOrigin:       ORIGIN,
                expectedRPID:         RP_ID,
                requireUserVerification: true
            });

            if (!verificacao.verified || !verificacao.registrationInfo) {
                logger.warn(`[Biometria] Verificação de cadastro reprovada — usuario_id: ${usuario_id}, origin recebido: ${originRecebido}`);
                return res.status(400).json({ error: 'Verificação biométrica não passou' });
            }

            const { credentialID, credentialPublicKey, counter, credentialDeviceType } =
                verificacao.registrationInfo;

            await BiometriaModel.salvarCredencial({
                usuario_id,
                credential_id: Buffer.from(credentialID).toString('base64url'),
                public_key:    Buffer.from(credentialPublicKey).toString('base64url'),
                counter,
                device_type:   credentialDeviceType
            });

            delete req.session.biometriaChallenge;

            logger.info(`[Biometria] Credencial registrada com sucesso — usuario_id: ${usuario_id}`);
            return res.status(200).json({ success: true, message: 'Biometria cadastrada com sucesso' });

        } catch (error) {
            logger.error(`[Biometria] Erro em cadastroConcluir: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao concluir cadastro biométrico' });
        }
    },

    /**
     * POST /api/v1/biometria/login/iniciar
     * Rota pública. Recebe o e-mail e retorna o desafio de autenticação.
     */
    async loginIniciar(req, res) {
        try {
            const email = (req.body.email || '').trim().toLowerCase();
            logger.info(`[Biometria] loginIniciar chamado — email recebido: "${email}"`);

            if (!email) {
                logger.warn('[Biometria] loginIniciar — email vazio, abortando');
                return res.status(400).json({ error: 'E-mail obrigatório' });
            }

            const usuario = await BiometriaModel.buscarUsuarioPorEmail(email);
            if (!usuario) {
                logger.warn(`[Biometria] loginIniciar — usuário não encontrado para email: "${email}"`);
                return res.status(404).json({ error: 'Nenhuma credencial biométrica encontrada' });
            }

            const credenciais = await BiometriaModel.buscarCredenciaisPorUsuario(usuario.usuario_id);
            logger.info(`[Biometria] loginIniciar — usuario_id: ${usuario.usuario_id}, credenciais encontradas: ${credenciais.length}`);
            if (!credenciais.length) {
                return res.status(404).json({ error: 'Nenhuma credencial biométrica cadastrada para este usuário' });
            }

            const options = await generateAuthenticationOptions({
                rpID: RP_ID,
                allowCredentials: [],
                userVerification: 'required',
                timeout: 60000
            });

            // Guarda challenge e usuario_id temporariamente na sessão
            req.session.biometriaChallenge  = options.challenge;
            req.session.biometriaUsuarioId  = usuario.usuario_id;

            logger.info(`[Biometria] Opções de login geradas — usuario_id: ${usuario.usuario_id}`);
            return res.status(200).json(options);

        } catch (error) {
            logger.error(`[Biometria] Erro em loginIniciar: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao iniciar autenticação biométrica' });
        }
    },

    /**
     * POST /api/v1/biometria/login/concluir
     * Rota pública. Verifica a assinatura do dispositivo e cria a sessão do usuário.
     */
    async loginConcluir(req, res) {
        try {
            const challenge  = req.session.biometriaChallenge;
            const usuario_id = req.session.biometriaUsuarioId;

            if (!challenge || !usuario_id) {
                return res.status(400).json({ error: 'Login não iniciado. Chame /login/iniciar primeiro.' });
            }

            const credencial = await BiometriaModel.buscarCredencialPorId(req.body.id);

            if (!credencial || credencial.usuario_id !== usuario_id) {
                logger.warn(`[Biometria] Credencial inválida ou de outro usuário — id: ${req.body.id}`);
                return res.status(401).json({ error: 'Credencial biométrica inválida' });
            }

            const verificacao = await verifyAuthenticationResponse({
                response:          req.body,
                expectedChallenge: challenge,
                expectedOrigin:    ORIGIN,
                expectedRPID:      RP_ID,
                authenticator: {
                    credentialID:        Buffer.from(credencial.credential_id, 'base64url'),
                    credentialPublicKey: Buffer.from(credencial.public_key,    'base64url'),
                    counter:             credencial.counter
                },
                requireUserVerification: true
            });

            if (!verificacao.verified) {
                logger.warn(`[Biometria] Assinatura inválida — usuario_id: ${usuario_id}`);
                return res.status(401).json({ error: 'Autenticação biométrica falhou' });
            }

            // Atualiza o counter para proteção anti-replay
            await BiometriaModel.atualizarCounter(req.body.id, verificacao.authenticationInfo.newCounter);

            const usuario = await BiometriaModel.buscarDadosSessaoPorId(usuario_id);

            // Limpa dados temporários e cria sessão autenticada (mesmo padrão do login normal)
            delete req.session.biometriaChallenge;
            delete req.session.biometriaUsuarioId;

            req.session.user = {
                id:            usuario.usuario_id,
                email:         usuario.email,
                nome_completo: usuario.nome_completo
            };

            logger.info(`[Biometria] Login biométrico bem-sucedido — usuario_id: ${usuario_id}`);
            return res.status(200).json({
                success:    true,
                usuario_id: usuario.usuario_id,
                nome:       usuario.nome_completo,
                email:      usuario.email,
                avatar_id:  usuario.avatar_id ?? null
            });

        } catch (error) {
            logger.error(`[Biometria] Erro em loginConcluir: ${error.message}`);
            return res.status(500).json({ error: 'Erro ao concluir autenticação biométrica' });
        }
    }
};

module.exports = BiometriaController;
