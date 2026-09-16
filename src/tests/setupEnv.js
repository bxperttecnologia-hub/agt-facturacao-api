'use strict';

// Executado antes de qualquer teste (ver jest.config.js → setupFiles).
// Garante que src/config/env.js encontra tudo o que precisa, sem exigir
// um .env real nem ligação a MySQL/AGT — os testes mockam db.js e agt/*.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3999';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'agt_facturacao_test';
process.env.API_KEY = process.env.API_KEY || 'chave-de-teste-para-jest';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || '';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '60000';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '1000';
process.env.LOG_LEVEL = 'silent';
