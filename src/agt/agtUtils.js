'use strict';

const crypto = require('crypto');

function uuidV4() {
    return crypto.randomUUID();
}

function randomInt(min, max) {
    return crypto.randomInt(min, max + 1);
}

function todayDate() {
    return new Date().toISOString().split('T')[0];
}

function localDateTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
}

function timestampNow() {
    return new Date().toISOString();
}

function base64urlEncode(data) {
    return Buffer.from(data)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Gera uma assinatura JWS RS256 genérica no formato usado por todos os
 * serviços da AGT: header {typ:'JWT', alg:'RS256'}, claims específicos de
 * cada serviço, assinados com a chave privada do emissor.
 */
function signJws(claims, privateKey) {
    const header = { typ: 'JWT', alg: 'RS256' };
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(claims));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();
    const signature = signer.sign(privateKey);

    return `${encodedHeader}.${encodedPayload}.${base64urlEncode(signature)}`;
}

async function httpPost(url, payload, username, password) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${credentials}`,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000),
        });

        const text = await res.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (_) {
            data = {};
        }

        return { status: res.status, data, error: null };
    } catch (e) {
        return { status: 0, data: {}, error: e.message };
    }
}

module.exports = {
    uuidV4,
    randomInt,
    todayDate,
    localDateTime,
    timestampNow,
    base64urlEncode,
    signJws,
    httpPost,
};