'use strict';

// Testa GET /health — não precisa de API key. Confirma que o servidor está
// de pé antes de correres os restantes scripts.
// Uso: node 01-health.js

const { chamar, mostrarResposta } = require('./config');

(async () => {
    console.log('== GET /health ==');
    const resposta = await chamar('GET', '/health');
    mostrarResposta(resposta);

    if (resposta.status !== 200) {
        console.error(`FALHOU: esperava HTTP 200, recebi ${resposta.status}.`);
        process.exit(1);
    }
    console.log('OK: API está a responder.');
})();
