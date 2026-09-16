'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const env = require('./config/env');
const logger = require('./utils/logger');
const { apiKeyAuth } = require('./middlewares/auth');
const { generalLimiter } = require('./middlewares/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const apiRoutes = require('./routes');

/**
 * Monta e devolve a app Express, sem ligar à base de dados nem abrir porta
 * nenhuma — isso fica a cargo de server.js. Mantida separada para que os
 * testes (src/tests) possam usar supertest(app) directamente, mockando o
 * pool MySQL e os módulos src/agt/* em vez de falarem com serviços reais.
 */
function createApp() {
    const app = express();

    app.set('trust proxy', 1);
    app.use(helmet());
    app.use(cors({ origin: env.CORS_ORIGIN.length ? env.CORS_ORIGIN : true }));
    app.use(compression());
    app.use(hpp());
    app.use(express.json({ limit: '2mb' }));
    app.use(pinoHttp({ logger }));
    app.use(generalLimiter);

    /**
     * @openapi
     * /health:
     *   get:
     *     tags: [Sistema]
     *     summary: Verificação de estado do serviço (sem autenticação)
     *     security: []
     *     responses:
     *       200:
     *         description: Serviço operacional.
     */
    // Rota pública de verificação de estado (sem API key), útil para monitorização.
    app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

    // Documentação OpenAPI/Swagger — pública (não exige x-api-key), para
    // facilitar a integração de novos consumidores da API.
    app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'AGT Facturação — API Docs' }));

    // A partir daqui, todas as rotas exigem o cabeçalho x-api-key.
    app.use('/api', apiKeyAuth, apiRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
