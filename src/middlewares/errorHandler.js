'use strict';

const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res) {
    res.status(404).json({ success: false, error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const isApiError = err instanceof ApiError;
    const statusCode = isApiError ? err.statusCode : 500;

    if (statusCode >= 500) {
        logger.error({ err }, 'Erro interno não tratado.');
    } else {
        logger.warn({ err: err.message }, 'Erro de pedido.');
    }

    res.status(statusCode).json({
        success: false,
        error: isApiError ? err.message : 'Erro interno do servidor.',
        details: isApiError ? err.details : undefined,
    });
}

module.exports = { notFoundHandler, errorHandler };
