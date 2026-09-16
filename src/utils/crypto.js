'use strict';

const crypto = require('crypto');

/**
 * Comparação em tempo constante — usada para validar a API key recebida,
 * evitando ataques de timing.
 *
 * Nota: esta API não guarda segredos de terceiros (chave privada, password)
 * na base de dados — chegam em cada pedido e vivem apenas em memória durante
 * a chamada à AGT, por isso não há aqui funções de cifragem/decifragem.
 */
function timingSafeEqualString(a, b) {
    const bufA = Buffer.from(String(a ?? ''));
    const bufB = Buffer.from(String(b ?? ''));
    if (bufA.length !== bufB.length) {
        // Ainda assim comparamos algo de tamanho igual para não vazar o
        // tamanho via early-return demasiado óbvio.
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { timingSafeEqualString };
