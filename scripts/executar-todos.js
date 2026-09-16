'use strict';

// Corre todos os scripts de teste em sequência, na ordem certa (cada um
// alimenta o seguinte através de .state.json).
// Uso: node executar-todos.js

const path = require('path');
const { execFileSync } = require('child_process');

const scripts = [
    '01-health.js',
    '02-solicitar-serie.js',
    '03-registar-fatura.js',
    '04-consultar-estado-fatura.js',
    '05-listar-logs.js',
    '06-obter-log.js',
];

for (const script of scripts) {
    console.log('\n############################################');
    console.log(`# ${script}`);
    console.log('############################################');
    try {
        execFileSync('node', [path.join(__dirname, script)], { stdio: 'inherit' });
    } catch {
        console.log(`(script ${script} terminou com erro — ver acima)`);
    }
}
