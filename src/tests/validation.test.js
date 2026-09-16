'use strict';

const request = require('supertest');

jest.mock('../db/db', () => ({
    pool: { execute: jest.fn(), query: jest.fn(), end: jest.fn() },
    testConnection: jest.fn(),
}));

// Se a validação falhar como esperado, os módulos AGT nem devem ser chamados
// — mockamo-los só para garantir isso e para o teste não depender de rede.
const mockCriarSerie = jest.fn();
jest.mock('../agt/criarSerieAgt', () => ({ criarSerieAGT: (...args) => mockCriarSerie(...args) }));

const createApp = require('../app');
const app = createApp();

const headers = { 'x-api-key': process.env.API_KEY };

describe('Validação de entrada (Zod)', () => {
    afterEach(() => jest.clearAllMocks());

    it('POST /api/series sem tax_id/private_key/document_type devolve 400 com detalhes por campo', async () => {
        const res = await request(app).post('/api/series').set(headers).send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(Array.isArray(res.body.details)).toBe(true);
        const campos = res.body.details.map((d) => d.campo);
        expect(campos).toEqual(expect.arrayContaining(['tax_id', 'private_key', 'document_type']));
        expect(mockCriarSerie).not.toHaveBeenCalled();
    });

    it('POST /api/faturas com document_type inválido devolve 400', async () => {
        const res = await request(app)
            .post('/api/faturas')
            .set(headers)
            .send({ tax_id: '123', private_key: 'x', document_type: 'XX', document_no: 'FT SEDE/1', lines: [] });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/faturas/nota-credito sem "reference"/"reason" devolve 400', async () => {
        const res = await request(app)
            .post('/api/faturas/nota-credito')
            .set(headers)
            .send({ tax_id: '123', private_key: 'x', document_no: 'NC SEDE/1', lines: [{ product_code: 'A' }] });

        expect(res.status).toBe(400);
        const campos = res.body.details.map((d) => d.campo);
        expect(campos).toEqual(expect.arrayContaining(['reference', 'reason']));
    });

    it('POST /api/faturas/estado sem requestID devolve 400', async () => {
        const res = await request(app)
            .post('/api/faturas/estado')
            .set(headers)
            .send({ tax_id: '123', private_key: 'x' });

        expect(res.status).toBe(400);
    });
});
