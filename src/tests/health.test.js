'use strict';

const request = require('supertest');
const createApp = require('../app');

const app = createApp();

describe('GET /health', () => {
    it('responde 200 sem exigir x-api-key', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, status: 'ok' });
    });
});

describe('Rota inexistente', () => {
    it('devolve 404 em formato JSON padronizado', async () => {
        const res = await request(app).get('/rota-que-nao-existe');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/Rota não encontrada/);
    });
});
