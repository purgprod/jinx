const logger = require('../../logger');

async function retornarPerfil(req, res) {
    if (req.session.tipo !== 'guardiao_atuando') {
        return res.status(400).json({ success: false, message: 'Você não está atuando como tutelado.' });
    }

    const tuteladoId = req.session.user.id;
    const guardiao   = req.session.guardiao_original;

    req.session.user              = guardiao;
    req.session.tipo              = undefined;
    req.session.guardiao_original = undefined;

    logger.info(`Guardião ${guardiao.id} retornou ao próprio perfil (saiu do tutelado ${tuteladoId})`);
    return res.status(200).json({
        success: true,
        message: 'Retorno ao próprio perfil realizado com sucesso.',
        guardiao: { id: guardiao.id, nome: guardiao.nome }
    });
}

module.exports = { retornarPerfil };
