'use strict';

const env = require('../config/env');
const { timingSafeEqualString } = require('../utils/crypto');
const ApiError = require('../utils/ApiError');

/**
 * Protege as rotas exigindo o cabeçalho "x-api-key" com o valor definido em
 * API_KEY (.env). Isto separa quem pode falar com esta API (os teus
 * softwares internos) de qualquer visitante da internet.
 *
 * Em produção, coloca sempre esta API atrás de HTTPS (proxy reverso como
 * nginx/Caddy ou um túnel) — a API key sozinha não protege dados em trânsito.
 */
function apiKeyAuth(req, res, next) {
    const providedKey = req.header('x-api-key');

    if (!providedKey || !timingSafeEqualString(providedKey, env.API_KEY)) {
        return next(ApiError.unauthorized('API key ausente ou inválida. Envia o cabeçalho "x-api-key".'));
    }

    next();
}

module.exports = { apiKeyAuth };
