'use strict';

// Testa GET /api/logs — confirma que os pedidos anteriores (série, factura,
// consulta de estado) ficaram registados para auditoria.
// Uso: node 05-listar-logs.js

const { chamar, mostrarResposta } = require('./config');

(async () => {
    console.log('== GET /api/logs ==');
    const resposta = await chamar('GET', '/api/logs?limit=10');
    mostrarResposta(resposta);

    if (resposta.status !== 200) {
        console.error(`FALHOU: esperava HTTP 200, recebi ${resposta.status}.`);
        process.exit(1);
    }
    console.log(`OK: ${resposta.body.logs.length} registo(s) de log devolvido(s).`);
})();
