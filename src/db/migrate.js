'use strict';

/**
 * Aplica src/db/schema.mysql.sql à base de dados configurada em .env.
 * Uso:  npm run db:migrate
 *
 * Nota: usa uma ligação dedicada com multipleStatements activo (só aqui,
 * nunca no pool usado pela aplicação em runtime) porque o schema tem
 * vários CREATE TABLE seguidos.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

async function migrate() {
    const schemaPath = path.join(__dirname, 'schema.mysql.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true,
    });

    try {
        logger.info('A aplicar schema.mysql.sql...');
        await connection.query(schemaSql);
        logger.info('Schema aplicado com sucesso. Base de dados pronta.');
    } finally {
        await connection.end();
    }
}

migrate().catch((err) => {
    logger.error({ err }, 'Falha ao aplicar o schema.');
    process.exit(1);
});
