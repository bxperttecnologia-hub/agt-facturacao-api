'use strict';

const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'muda-me';

const STATE_FILE = path.join(__dirname, '.state.json');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const CHAVE_TESTE = path.join(FIXTURES_DIR, 'empresa-teste.key.pem');

/** Lê o estado partilhado entre scripts (ex: request_id da última factura). */
function lerEstado() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
        return {};
    }
}

/** Guarda uma chave no estado partilhado, sem apagar as restantes. */
function guardarEstado(chave, valor) {
    const estado = lerEstado();
    estado[chave] = valor;
    fs.writeFileSync(STATE_FILE, JSON.stringify(estado, null, 2));
}

/**
 * Faz um pedido à API, já com o cabeçalho x-api-key. Devolve
 * { status, body } — nunca lança por causa de um HTTP de erro (4xx/5xx),
 * só por falhas de rede/JSON.
 */
async function chamar(metodo, caminho, corpo) {
    const resposta = await fetch(`${BASE_URL}${caminho}`, {
        method: metodo,
        headers: {
            'x-api-key': API_KEY,
            ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
    });

    const texto = await resposta.text();
    let body;
    try {
        body = texto ? JSON.parse(texto) : null;
    } catch {
        body = texto;
    }

    return { status: resposta.status, body };
}

/** Imprime o resultado de chamar() de forma legível. */
function mostrarResposta({ status, body }) {
    console.log(`HTTP ${status}`);
    console.log(JSON.stringify(body, null, 2));
}

/**
 * Credenciais fictícias, só para os scripts terem algo para enviar em cada
 * pedido (lembra: esta API não guarda nem exige registo prévio de empresa —
 * é o próprio pedido que traz o NIF e a chave). Gera uma chave RSA de teste
 * na primeira vez e reutiliza-a nas corridas seguintes.
 */
function credenciaisTeste() {
    if (!fs.existsSync(CHAVE_TESTE)) {
        fs.mkdirSync(FIXTURES_DIR, { recursive: true });
        const { privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
            publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        });
        fs.writeFileSync(CHAVE_TESTE, privateKey);
    }

    return {
        tax_id: '5000000000',
        private_key: fs.readFileSync(CHAVE_TESTE, 'utf8'),
        username: 'utilizador.teste',
        password: 'password-teste',
        nome_empresa: 'Empresa de Teste, Lda',
        test: true,
    };
}

module.exports = { BASE_URL, API_KEY, lerEstado, guardarEstado, chamar, mostrarResposta, credenciaisTeste };
