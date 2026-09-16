'use strict';

const pino = require('pino');

/**
 * Logger central. Os caminhos em "redact" nunca são escritos em claro nos
 * logs — importante porque chaves privadas, passwords e assinaturas JWS
 * passam por várias camadas da aplicação.
 */
const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers["x-api-key"]',
            '*.private_key',
            '*.privateKey',
            '*.password',
            '*.password_cifrada',
            '*.private_key_cifrada',
            '*.jwsSignature',
            '*.jwsDocumentSignature',
            '*.jwsSoftwareSignature',
        ],
        censor: '[REDACTED]',
    },
    transport:
        process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});

module.exports = logger;