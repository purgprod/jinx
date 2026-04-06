const { validationResult } = require('express-validator');
const logger = require('../../logger');

// Models - Apenas os fornecidos e declarados no const
const BuscarDepositoPendenteModel = require('../../models/endpoints/model_deposito_buscar_deposito_pendente');
const SolicitacaoDepositoModel = require('../../models/endpoints/model_deposito_registro_solicitacao');

const DepositoController = {
    /**
     * Executa a solicitação de depósito.
     * Semântica: 
     * 1. Validação de integridade do payload.
     * 2. Checagem de estado (Idempotência/Pendência).
     * 3. Persistência da intenção de depósito.
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
        // Por que: Garante que os dados atendam ao contrato antes de onerar o banco de dados.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Falha de validação no deposito', { userId: id, errors: errors.array() });
            return res.status(400).json({ errors: errors.array() });
        }

        // Validação de tipo e valor
        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'O valor do depósito (amount) deve ser um número positivo.' });
        }

        logger.info('Iniciando processo de solicitação de deposito', { userId: id, amount });

        try {
            // 2. Verificação de Idempotência / Estado Pendente
            // Semântica: Status 429 (Too Many Requests) ou 409 (Conflict). 
            // Usamos 429 aqui para indicar que o processo já está em curso e o usuário deve aguardar.
            const depositosPendentes = await BuscarDepositoPendenteModel.getDepositoPendente(id);
            
            if (depositosPendentes && depositosPendentes.length > 0) {
                logger.warn('Solicitação bloqueada: Depósito pendente existente', { userId: id });
                return res.status(429).json({ 
                    error: 'Você já possui uma solicitação de depósito em análise. Aguarde o processamento.' 
                });
            }

            // 3. Registro da Solicitação
            // Semântica: O model original aceita (usuario_id, valor_deposito).
            // Status 201: Created, pois um novo recurso de "solicitação" foi gerado no banco.
            try {
                const results = await SolicitacaoDepositoModel.insertSolicitacao(id, amount);
                
                logger.info('Solicitação de depósito registrada com sucesso', { 
                    userId: id, 
                    insertId: results.insertId 
                });

                return res.status(201).json({
                    message: 'Solicitação de depósito enviada para análise.',
                    solicitacao_id: results.insertId,
                    status: 'Analisando'
                });

            } catch (errRegister) {
                // Erro específico na camada de persistência
                logger.error('Erro ao persistir solicitação no banco', { userId: id, error: errRegister.message });
                return res.status(500).json({ error: 'Erro interno ao registrar solicitação de depósito.' });
            }

        } catch (err) {
            // Erro genérico de orquestração ou conexão
            logger.error('Erro não tratado no fluxo de deposito', { userId: id, error: err.message });
            return res.status(500).json({ error: 'Erro inesperado no servidor.' });
        }
    }
};

module.exports = DepositoController;
