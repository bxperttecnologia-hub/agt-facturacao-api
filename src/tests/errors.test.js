'use strict';

const request = require('supertest');

jest.mock('../services/logs.service', () => ({ registarLog: jest.fn() }));

const mockCriarSerie = jest.fn();
jest.mock('../agt/criarSerieAgt', () => ({ criarSerieAGT: (...args) => mockCriarSerie(...args) }));

const createApp = require('../app');
const app = createApp();

const headers = { 'x-api-key': process.env.API_KEY };

describe('Gestão de erros', () => {
    it('um erro inesperado no service resulta em 500 genérico, sem vazar a mensagem interna', async () => {
        mockCriarSerie.mockRejectedValue(new Error('ECONNREFUSED: detalhe interno sensível'));

        const res = await request(app)
            .post('/api/series')
            .set(headers)
            .send({ tax_id: '5000000000', private_key: 'x', document_type: 'FT' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Erro interno do servidor.');
        expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED/);
    });
});
