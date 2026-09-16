'use strict';

const request = require('supertest');
const { getTestPrivateKey } = require('./helpers/testKeys');

const mockRegistarLog = jest.fn().mockResolvedValue(1);
jest.mock('../services/logs.service', () => ({
    registarLog: (...args) => mockRegistarLog(...args),
}));

const mockCriarSerie = jest.fn();
jest.mock('../agt/criarSerieAgt', () => ({ criarSerieAGT: (...args) => mockCriarSerie(...args) }));

const createApp = require('../app');
const app = createApp();

const headers = { 'x-api-key': process.env.API_KEY };

const pedidoBase = () => ({
    tax_id: '5000000000',
    private_key: getTestPrivateKey(),
    document_type: 'FT',
    establishment: 'SEDE',
    test: true,
});

describe('POST /api/series', () => {
    afterEach(() => jest.clearAllMocks());

    it('devolve 200 e grava log quando a AGT aceita o pedido', async () => {
        mockCriarSerie.mockResolvedValue({
            success: true,
            seriesCode: 'FT-SEDE-2026',
            submissionUUID: 'uuid-1',
            payload: {},
            response: { status: 200, data: {} },
        });

        const res = await request(app).post('/api/series').set(headers).send(pedidoBase());

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.resultado.seriesCode).toBe('FT-SEDE-2026');
        expect(mockRegistarLog).toHaveBeenCalledTimes(1);
        expect(mockRegistarLog.mock.calls[0][0]).toMatchObject({ tipo: 'SERIE', nif: '5000000000', sucesso: true });
    });

    it('devolve 502 e grava log de falha quando a AGT rejeita o pedido', async () => {
        mockCriarSerie.mockResolvedValue({
            success: false,
            error: 'NIF inválido',
            payload: {},
            response: { status: 400, data: { errorList: [{ descriptionError: 'NIF inválido' }] } },
        });

        const res = await request(app).post('/api/series').set(headers).send(pedidoBase());

        expect(res.status).toBe(502);
        expect(res.body.success).toBe(false);
        expect(mockRegistarLog.mock.calls[0][0]).toMatchObject({ sucesso: false });
    });

    it('nunca envia a chave privada para o serviço de logs', async () => {
        mockCriarSerie.mockResolvedValue({ success: true, payload: {}, response: { status: 200, data: {} } });

        await request(app).post('/api/series').set(headers).send(pedidoBase());

        const dadosDoLog = mockRegistarLog.mock.calls[0][0];
        expect(JSON.stringify(dadosDoLog)).not.toMatch(/BEGIN RSA PRIVATE KEY/);
    });
});
