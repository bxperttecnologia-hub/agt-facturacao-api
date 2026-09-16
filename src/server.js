'use strict';

const env = require('./config/env');
const logger = require('./utils/logger');
const { pool, testConnection } = require('./db/db');
const createApp = require('./app');

const app = createApp();

async function start() {
    try {
        await testConnection();
    } catch (err) {
        logger.error({ err }, 'Não foi possível ligar à base de dados MySQL. Verifica o teu .env e se o MySQL está a correr.');
        process.exit(1);
    }

    app.listen(env.PORT, () => {
        logger.info(`API a correr na porta ${env.PORT} (ambiente: ${env.NODE_ENV}).`);
    });
}

process.on('SIGTERM', async () => {
    logger.info('SIGTERM recebido, a encerrar...');
    await pool.end();
    process.exit(0);
});

// Só arranca o servidor real (ligação à BD + listen) quando este ficheiro é
// executado directamente (`npm start` / `node src/server.js`) — não quando é
// importado pelos testes (src/tests), que usam src/app.js directamente.
if (require.main === module) {
    start();
}

module.exports = app;
