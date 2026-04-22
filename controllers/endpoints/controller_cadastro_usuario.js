// controllers/endpoints/controller_cadastro_usuario.js

const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const cadastroModel    = require('../../models/endpoints/model_criar_novo_usuario');
const ObjetivosEscrita = require('../../models/objetivos/model_objetivos_escrita');
const { withTransaction } = require('../../database/transaction');
const logger = require('../../logger');

async function cadastrarUsuario(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nome_completo, nome_da_mae, data_nascimento, genero, cpf, celular, email, password,
            termos_de_uso, termos_de_privacidade, termos_de_riscos_da_plataforma } = req.body;

    try {
        const emailExistente = await cadastroModel.findByEmail(email.trim().toLowerCase());
        if (emailExistente) {
            return res.status(409).json({ success: false, message: 'E-mail já cadastrado.' });
        }

        const cpfExistente = await cadastroModel.findByCpf(cpf);
        if (cpfExistente) {
            return res.status(409).json({ success: false, message: 'CPF já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let novoId;
        await withTransaction(async (conn) => {
            novoId = await cadastroModel.createUser({
                nome_completo: nome_completo.trim().toUpperCase(),
                nome_da_mae: nome_da_mae ? nome_da_mae.trim().toUpperCase() : null,
                data_nascimento,
                genero,
                cpf,
                celular,
                email: email.trim().toLowerCase(),
                hashedPassword,
                termos_de_uso,
                termos_de_privacidade,
                termos_de_riscos_da_plataforma,
            }, conn);

            await cadastroModel.createCarteira(novoId, conn);

            // Criar objetivo Patrimônio automaticamente (sem metas ainda)
            await ObjetivosEscrita.criarPatrimonio(novoId, conn);
        });

        logger.info(`Cadastro de novo usuário realizado com sucesso. ID: ${novoId}`);
        return res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso.', usuario_id: novoId });

    } catch (error) {
        logger.error(`Erro ao cadastrar usuário: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { cadastrarUsuario };
