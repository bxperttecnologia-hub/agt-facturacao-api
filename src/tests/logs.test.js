'use strict';

const request = require('supertest');

const mockListarLogs = jest.fn();
const mockObterLog = jest.fn();
jest.mock('../services/logs.service', () => ({
    listarLogs: (...args) => mockListarLogs(...args),
    obterLog: (...args) => mockObterLog(...args),
    registarLog: jest.fn(),
}));

const createApp = require('../app');
const app = createApp();

const headers = { 'x-api-key': process.env.API_KEY };

describe('GET /api/logs', () => {
    afterEach(() => jest.clearAllMocks());

    it('devolve a lista de logs e repassa os filtros da query string', async () => {
        mockListarLogs.mockResolvedValue([{ id: 1, tipo: 'SERIE', nif: '5000000000' }]);

        const res = await request(app).get('/api/logs?nif=5000000000&tipo=SERIE&limit=10').set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.logs).toHaveLength(1);
        expect(mockListarLogs).toHaveBeenCalledWith(
            expect.objectContaining({ nif: '5000000000', tipo: 'SERIE', limit: '10' })
        );
    });
});

describe('GET /api/logs/:id', () => {
    afterEach(() => jest.clearAllMocks());

    it('devolve 200 com o log quando existe', async () => {
        mockObterLog.mockResolvedValue({ id: 42, tipo: 'FATURA' });

        const res = await request(app).get('/api/logs/42').set(headers);

        expect(res.status).toBe(200);
        expect(res.body.log).toEqual({ id: 42, tipo: 'FATURA' });
    });

    it('devolve 404 quando o log não existe', async () => {
        mockObterLog.mockResolvedValue(null);

        const res = await request(app).get('/api/logs/9999').set(headers);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
