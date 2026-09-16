'use strict';

const request = require('supertest');

// Evita que os testes de auth cheguem à camada de BD (o que interessa aqui
// é só o middleware apiKeyAuth, que corre antes de tudo o resto).
jest.mock('../db/db', () => ({
    pool: { execute: jest.fn(), query: jest.fn(), end: jest.fn() },
    testConnection: jest.fn(),
}));

const createApp = require('../app');
const app = createApp();

describe('Autenticação por x-api-key (permissões de acesso)', () => {
    it('rejeita com 401 quando não é enviado x-api-key', async () => {
        const res = await request(app).get('/api/logs');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('rejeita com 401 quando a x-api-key está errada', async () => {
        const res = await request(app).get('/api/logs').set('x-api-key', 'chave-errada');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('deixa passar quando a x-api-key é a correcta (definida em setupEnv.js)', async () => {
        const res = await request(app).get('/api/logs').set('x-api-key', process.env.API_KEY);
        // Já passou da autenticação — o que a rota faz a seguir é testado
        // em logs.test.js. Aqui só nos interessa que não seja 401.
        expect(res.status).not.toBe(401);
    });

    it('a rota pública /health nunca exige x-api-key', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });
});
