const logger = require('../../logger');

const AdminDebugController = {
    getStatus(req, res) {
        return res.status(200).json({ debug: logger.isDebugEnabled() });
    },

    toggle(req, res) {
        const novoEstado = !logger.isDebugEnabled();
        logger.setDebugMode(novoEstado);
        return res.status(200).json({ debug: novoEstado });
    }
};

module.exports = AdminDebugController;
