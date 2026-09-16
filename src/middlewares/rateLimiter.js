'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Limite geral de pedidos por IP, para mitigar abuso e picos acidentais
 * (ex: um script em loop) que poderiam levar a bloqueios do lado da AGT.
 */
const generalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiados pedidos. Tenta novamente dentro de instantes.' },
});

/**
 * Limite mais apertado para as operações que efectivamente contactam a AGT
 * (criação de série, submissão de factura, consulta de estado) — estas
 * devem ser usadas com moderação, não em rajada.
 */
const agtCallLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: Math.max(10, Math.floor(env.RATE_LIMIT_MAX / 4)),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiados pedidos à AGT num curto período. Aguarda um pouco.' },
});

module.exports = { generalLimiter, agtCallLimiter };
