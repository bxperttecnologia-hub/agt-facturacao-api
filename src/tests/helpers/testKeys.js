'use strict';

const { generateKeyPairSync } = require('crypto');

let cached = null;

/** Chave RSA de teste, gerada uma única vez por processo Jest (é lenta). */
function getTestPrivateKey() {
    if (!cached) {
        const { privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
            publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        });
        cached = privateKey;
    }
    return cached;
}

module.exports = { getTestPrivateKey };
