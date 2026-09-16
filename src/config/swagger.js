'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Especificação OpenAPI 3.0, gerada a partir dos comentários JSDoc colocados
 * directamente em cada ficheiro de rotas (src/routes/*.js). Servida em:
 *   - GET /api-docs         → interface Swagger UI
 *   - GET /api-docs.json    → especificação em JSON puro
 */
const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'AGT Facturação — Proxy API',
            version: '1.0.0',
            description:
                'API que assina e reencaminha pedidos de série/factura/consulta de estado ' +
                'para a Facturação Electrónica da AGT (Angola), guardando apenas um log de ' +
                'auditoria em MySQL. Não existe cadastro próprio de empresas: cada pedido ' +
                'traz consigo o NIF, a chave privada e as credenciais necessárias.',
        },
        servers: [{ url: '/api', description: 'Prefixo de todas as rotas autenticadas' }],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-api-key',
                    description: 'Chave partilhada definida em API_KEY (.env). Obrigatória em todas as rotas /api/*.',
                },
            },
            schemas: {
                RespostaErro: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Dados de entrada inválidos.' },
                        details: {
                            type: 'array',
                            nullable: true,
                            items: {
                                type: 'object',
                                properties: {
                                    campo: { type: 'string', example: 'tax_id' },
                                    mensagem: { type: 'string', example: 'NIF (tax_id) é obrigatório.' },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [{ ApiKeyAuth: [] }],
        tags: [
            { name: 'Séries', description: 'Solicitação de séries de numeração à AGT' },
            { name: 'Faturas', description: 'Registo, anulação, correcção e consulta de estado de documentos' },
            { name: 'Logs', description: 'Auditoria dos pedidos feitos à AGT através deste proxy' },
            { name: 'Sistema', description: 'Verificação de estado do serviço' },
        ],
    },
    apis: ['./src/routes/*.js', './src/app.js'],
};

module.exports = swaggerJsdoc(options);
