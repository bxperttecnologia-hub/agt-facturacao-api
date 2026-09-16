'use strict';

// Testa GET /api/logs/:id.
// Uso: node 06-obter-log.js [id]   (por omissão, usa o id mais recente)

const { chamar, mostrarResposta } = require('./config');

(async () => {
    let id = process.argv[2];

    if (!id) {
        const lista = await chamar('GET', '/api/logs?limit=1');
        id = lista.body?.logs?.[0]?.id;
        if (!id) {
            console.log('AVISO: não há nenhum log ainda. Corre primeiro 02/03/04.');
            return;
        }
    }

    console.log(`== GET /api/logs/${id} ==`);
    const resposta = await chamar('GET', `/api/logs/${id}`);
    mostrarResposta(resposta);

    if (resposta.status !== 200) {
        console.error(`FALHOU: esperava HTTP 200, recebi ${resposta.status}.`);
        process.exit(1);
    }
    console.log(`OK: log ${id} encontrado.`);
})();
