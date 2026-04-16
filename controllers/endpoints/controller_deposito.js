const { validationResult } = require('express-validator');
const logger = require('../../logger');

// Models
const BuscarDepositoPendenteModel = require('../../models/endpoints/model_deposito_buscar_deposito_pendente');
const SolicitacaoDepositoModel    = require('../../models/endpoints/model_deposito_registro_solicitacao');
const AtualizarDepositoQrModel    = require('../../models/depositos/model_deposito_atualizar_qr');
const DadosCadastroModel          = require('../../models/endpoints/model_dados_cadastro');
const ObjetivosLeitura            = require('../../models/objetivos/model_objetivos_leitura');

// Serviço Efí Bank Pix
const { criarCobrancaPix } = require('../../services/efi_pix');

const DepositoController = {
    /**
     * Executa a solicitação de depósito.
     * Semântica:
     * 1. Validação de integridade do payload.
     * 2. Checagem de estado (Idempotência/Pendência).
     * 3. Persistência da intenção de depósito.
     * 4. Geração da cobrança Pix no Efí Bank (QR Code + copia e cola).
     * 5. Retorna os dados do Pix para o usuário pagar.
     */
    async executeDeposito(req, res) {
        const { id } = req.params;
        const { amount } = req.body;

        // Validação de ownership: apenas o próprio usuário pode solicitar depósito
        if (req.session.user.id !== parseInt(id, 10)) {
            logger.warn('Tentativa de depósito não autorizado', { sessionUserId: req.session.user.id, targetId: id });
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // 1. Validação de Schema (Express-validator)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Falha de validação no deposito', { userId: id, errors: errors.array() });
            return res.status(400).json({ errors: errors.array() });
        }

        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'O valor do depósito (amount) deve ser um número positivo.' });
        }

        const valorFormatado = amountNum.toFixed(2);

        logger.info('Iniciando processo de solicitação de deposito', { userId: id, amount });

        try {
            // 1.5. Validação de Objetivos — usuário deve ter ao menos um objetivo com metas configuradas
            const possuiObjetivos = await ObjetivosLeitura.usuarioPossuiObjetivosComMetas(parseInt(id, 10));
            if (!possuiObjetivos) {
                logger.warn('Depósito bloqueado: usuário sem objetivos configurados', { userId: id });
                return res.status(403).json({
                    error: 'Configure ao menos um objetivo com metas antes de realizar o primeiro depósito.',
                    codigo: 'OBJETIVOS_NAO_CONFIGURADOS',
                });
            }

            // 2. Verificação de Idempotência / Estado Pendente
            const depositosPendentes = await BuscarDepositoPendenteModel.getDepositoPendente(id);

            if (depositosPendentes && depositosPendentes.length > 0) {
                const pendente = depositosPendentes[0];

                // Se já tem QR Code gerado, retorna o existente
                if (pendente.pix_copia_cola) {
                    logger.info('Retornando cobrança Pix já existente', { userId: id, txid: pendente.txid });
                    return res.status(200).json({
                        message:        'Você já possui uma solicitação de depósito em análise.',
                        solicitacao_id: pendente.id,
                        status:         'Analisando',
                        txid:           pendente.txid,
                        pix_copia_cola: pendente.pix_copia_cola,
                        qr_code:        pendente.qr_code
                    });
                }

                logger.warn('Solicitação bloqueada: Depósito pendente existente sem QR Code', { userId: id });
                return res.status(429).json({
                    error: 'Você já possui uma solicitação de depósito em análise. Aguarde o processamento.'
                });
            }

            // 3. Busca dados cadastrais (CPF e nome para a cobrança)
            const dadosUsuario = await DadosCadastroModel.getDadosCadastro(id);

            if (!dadosUsuario) {
                logger.error('Dados cadastrais não encontrados para geração do Pix', { userId: id });
                return res.status(404).json({ error: 'Dados cadastrais do usuário não encontrados.' });
            }

            if (!dadosUsuario.cpf) {
                return res.status(422).json({ error: 'CPF não cadastrado. Atualize seu perfil antes de realizar um depósito.' });
            }

            // 4. Registro da Solicitação no banco
            const results    = await SolicitacaoDepositoModel.insertSolicitacao(id, amount);
            const depositoId = results.insertId;

            logger.info('Solicitação de depósito registrada', { userId: id, depositoId });

            // 5. Geração da cobrança Pix no Efí Bank
            let pixData;
            try {
                pixData = await criarCobrancaPix({
                    valor:         valorFormatado,
                    cpf:           dadosUsuario.cpf,
                    nome:          dadosUsuario.nome_completo,
                    expiracao:     3600,
                    infoAdicional: `Deposito Purg #${depositoId}`
                });
            } catch (errPix) {
                logger.error('Falha ao gerar cobrança Pix no Efí Bank', { userId: id, depositoId, erro: errPix.message });
                // Remove o registro criado no passo 4 para não bloquear futuros depósitos do usuário
                try {
                    await SolicitacaoDepositoModel.deleteSolicitacao(depositoId);
                    logger.info('Registro de depósito removido após falha no Pix', { depositoId });
                } catch (errCleanup) {
                    logger.error('Falha ao remover registro de depósito orphan', { depositoId, erro: errCleanup.message });
                }
                return res.status(502).json({
                    error: 'Não foi possível gerar o Pix. Tente novamente em instantes.'
                });
            }

            // 6. Persiste txid, QR Code e copia e cola no depósito
            await AtualizarDepositoQrModel.atualizarQr(
                depositoId,
                pixData.txid,
                pixData.qrCode,
                pixData.pixCopiaECola
            );

            logger.info('Cobrança Pix criada e vinculada ao depósito', { userId: id, depositoId, txid: pixData.txid });

            return res.status(201).json({
                message:        'Solicitação de depósito criada. Realize o pagamento Pix abaixo.',
                solicitacao_id: depositoId,
                status:         'Analisando',
                txid:           pixData.txid,
                pix_copia_cola: pixData.pixCopiaECola,
                qr_code:        pixData.qrCode,
                expiracao_min:  60
            });

        } catch (err) {
            logger.error('Erro não tratado no fluxo de deposito', { userId: id, error: err.message });
            return res.status(500).json({ error: 'Erro inesperado no servidor.' });
        }
    }
};

module.exports = DepositoController;
