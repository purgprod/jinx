const { validationResult }  = require('express-validator');
const RelacionamentosModel  = require('../../models/familia/model_relacionamentos');
const AcessosLogModel       = require('../../models/familia/model_acessos_log');
const pool                  = require('../../database/database_purg');
const logger                = require('../../logger');

async function buscarDadosUsuario(usuarioId) {
    const [rows] = await pool.promise().execute(
        `SELECT usuario_id, apelido, email, nome_completo, status_ativo FROM users WHERE usuario_id = ? LIMIT 1`,
        [usuarioId]
    );
    return rows[0] || null;
}

async function trocarPerfil(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (req.session.tipo === 'guardiao_atuando') {
        return res.status(400).json({ success: false, message: 'Você já está atuando como tutelado. Retorne ao seu perfil primeiro.' });
    }

    const guardiaoId  = req.session.user.id;
    const tuteladoId  = parseInt(req.params.tutelado_id, 10);

    try {
        const vinculo = await RelacionamentosModel.buscarPorPar(guardiaoId, tuteladoId);
        if (!vinculo) {
            return res.status(403).json({ success: false, message: 'Você não possui vínculo ativo com este usuário.' });
        }

        const dadosTutelado = await buscarDadosUsuario(tuteladoId);
        if (!dadosTutelado || !dadosTutelado.status_ativo) {
            return res.status(404).json({ success: false, message: 'Tutelado não encontrado ou inativo.' });
        }

        req.session.guardiao_original = { ...req.session.user };
        req.session.tipo              = 'guardiao_atuando';
        req.session.user              = {
            id:            dadosTutelado.usuario_id,
            email:         dadosTutelado.email,
            nome:          dadosTutelado.apelido,
            nome_completo: dadosTutelado.nome_completo,
        };

        await AcessosLogModel.registrar({ guardiao_id: guardiaoId, tutelado_id: tuteladoId });

        req.session.save((err) => {
            if (err) {
                logger.error(`Erro ao salvar sessão ao trocar perfil: ${err.message}`);
                return res.status(500).json({ success: false, message: 'Erro ao salvar sessão.' });
            }
            logger.info(`Guardião ${guardiaoId} trocou para perfil do tutelado ${tuteladoId}`);
            return res.status(200).json({
                success: true,
                message: 'Perfil trocado com sucesso.',
                tutelado: {
                    id:   dadosTutelado.usuario_id,
                    nome: dadosTutelado.apelido,
                }
            });
        });

    } catch (err) {
        logger.error(`Erro ao trocar perfil para tutelado ${tuteladoId}: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
}

module.exports = { trocarPerfil };
