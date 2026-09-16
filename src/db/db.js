'use strict';

const mysql = require('mysql2/promise');
const env = require('../config/env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    waitForConnections: true,
    queueLimit: 0,
    dateStrings: false,
    decimalNumbers: true,
    namedPlaceholders: true,
    // Protege contra multi-statement injection: nunca permitir múltiplas
    // queries num único execute().
    multipleStatements: false,
});

pool.on('connection', () => {
    logger.debug('Nova ligação MySQL estabelecida no pool.');
});

async function testConnection() {
    const conn = await pool.getConnection();
    try {
        await conn.query('SELECT 1');
        logger.info('Ligação à base de dados MySQL confirmada.');
    } finally {
        conn.release();
    }
}

module.exports = { pool, testConnection };