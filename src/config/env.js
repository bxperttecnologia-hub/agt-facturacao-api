'use strict';

require('dotenv').config();

/**
 * Lê e valida as variáveis de ambiente uma única vez no arranque.
 * Se faltar algo crítico para segurança (API_KEY, credenciais da BD), a
 * aplicação recusa-se a arrancar — é melhor falhar cedo do que arrancar
 * insegura.
 */

/**
 * Valida que uma variável de ambiente crítica (segurança/BD) foi definida.
 * Chamada explicitamente abaixo para API_KEY e DB_NAME — falhar cedo no
 * arranque é preferível a arrancar com uma API sem chave ou sem BD.
 */
function required(name, value) {
    if (!value || String(value).trim() === '') {
        throw new Error(`Variável de ambiente obrigatória em falta: ${name}. Copia .env.example para .env e preenche.`);
    }
    return value;
}

const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    CORS_ORIGIN: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),

    DB_HOST: process.env.DB_HOST || '127.0.0.1',
    DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: required('DB_NAME', process.env.DB_NAME),
    DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),

    API_KEY: required('API_KEY', process.env.API_KEY),

    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),

    // ⚠️ Valor de "documentStatus" usado por omissão em POST /api/faturas/corrigir
    // quando o pedido não traz o seu próprio document_status. 'R' é um
    // placeholder razoável (não confirmado contra a carta de códigos oficial
    // da AGT) — ver aviso em src/agt/corrigirFaturaAgt.js e no README.
    CORRECTION_DOCUMENT_STATUS: process.env.CORRECTION_DOCUMENT_STATUS || 'R',

    AGT: {
        test: {
            baseUrl: process.env.AGT_TEST_BASE_URL || 'https://sifphml.minfin.gov.ao',
            productId: process.env.AGT_TEST_SOFTWARE_PRODUCT_ID || '',
            productVersion: process.env.AGT_TEST_SOFTWARE_VERSION || '',
            validationNumber: process.env.AGT_TEST_SOFTWARE_VALIDATION || '',
            jwsSoftwareSignature: process.env.AGT_TEST_SOFTWARE_JWS_SIGNATURE || '',
            username: process.env.AGT_TEST_USERNAME || '',
            password: process.env.AGT_TEST_PASSWORD || '',
        },
        production: {
            baseUrl: process.env.AGT_PROD_BASE_URL || 'https://sifp.minfin.gov.ao',
            productId: process.env.AGT_PROD_SOFTWARE_PRODUCT_ID || '',
            productVersion: process.env.AGT_PROD_SOFTWARE_VERSION || '',
            validationNumber: process.env.AGT_PROD_SOFTWARE_VALIDATION || '',
            jwsSoftwareSignature: process.env.AGT_PROD_SOFTWARE_JWS_SIGNATURE || '',
            username: process.env.AGT_PROD_USERNAME || '',
            password: process.env.AGT_PROD_PASSWORD || '',
        },
    },
};

module.exports = env;
