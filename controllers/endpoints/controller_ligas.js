// controllers/endpoints/controller_ligas.js

const ligas = require('../rotinas/ligas');

const LigasController = {
    getLigas(req, res) {
        const resultado = ligas.map(l => ({
            nome:             l.nomeLiga,
            pontuacao_minima: l.valorMinimo,
        }));

        return res.status(200).json({ success: true, ligas: resultado });
    },
};

module.exports = LigasController;
