'use strict';

const request = require('supertest');
const { getTestPrivateKey } = require('./helpers/testKeys');

const mockRegistarLog = jest.fn().mockResolvedValue(1);
jest.mock('../services/logs.service', () => ({ registarLog: (...args) => mockRegistarLog(...args) }));

const mockCriarFatura = jest.fn();
jest.mock('../agt/criarFaturaAgt', () => ({ criarFaturaAGT: (...args) => mockCriarFatura(...args) }));

const mockCriarNotaCredito = jest.fn();
jest.mock('../agt/criarNotaCreditoAgt', () => ({ criarNotaCreditoAGT: (...args) => mockCriarNotaCredito(...args) }));

const mockCriarNotaDebito = jest.fn();
jest.mock('../agt/criarNotaDebitoAgt', () => ({ criarNotaDebitoAGT: (...args) => mockCriarNotaDebito(...args) }));

const mockAnularFatura = jest.fn();
jest.mock('../agt/anularFaturaAgt', () => ({ anularFaturaAGT: (...args) => mockAnularFatura(...args) }));

const mockCorrigirFatura = jest.fn();
jest.mock('../agt/corrigirFaturaAgt', () => ({ corrigirFaturaAGT: (...args) => mockCorrigirFatura(...args) }));

const mockConsultarEstado = jest.fn();
jest.mock('../agt/consultarEstadoAgt', () => ({ consultarEstadoAGT: (...args) => mockConsultarEstado(...args) }));

const createApp = require('../app');
const app = createApp();

const headers = { 'x-api-key': process.env.API_KEY };
const sucessoAgt = { success: true, requestId: 'REQ-1', submissionUUID: 'uuid-1', payload: {}, response: { status: 200, data: {} } };

const linha = { product_code: 'SERV001', product_description: 'Serviço', quantity: 1, unit_price: 1000, tax_percentage: 14, tax_contribution: 140 };

// Global a todo o ficheiro: evita que mock.calls[0] de um teste apanhe uma
// chamada feita por um teste anterior (os mocks são partilhados entre os
// vários describe blocks abaixo, todos no mesmo módulo).
afterEach(() => jest.clearAllMocks());

describe('POST /api/faturas', () => {
    it('regista uma FT com sucesso (200) e grava o log', async () => {
        mockCriarFatura.mockResolvedValue(sucessoAgt);

        const res = await request(app)
            .post('/api/faturas')
            .set(headers)
            .send({
                tax_id: '5000000000', private_key: getTestPrivateKey(), document_type: 'FT',
                document_no: 'FT SEDE/1', net_total: 1000, tax_payable: 140, gross_total: 1140,
                test: true, lines: [linha],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockRegistarLog).toHaveBeenCalledTimes(1);
    });
});

describe('POST /api/faturas/nota-credito', () => {
    it('regista uma NC com sucesso quando reference/reason vêm preenchidos', async () => {
        mockCriarNotaCredito.mockResolvedValue(sucessoAgt);

        const res = await request(app)
            .post('/api/faturas/nota-credito')
            .set(headers)
            .send({
                tax_id: '5000000000', private_key: getTestPrivateKey(), document_no: 'NC SEDE/1',
                reference: 'FT SEDE/1', reason: 'Correcção', net_total: 1000, tax_payable: 140, gross_total: 1140,
                lines: [{ ...linha, debit_amount: 1000 }],
            });

        expect(res.status).toBe(200);
        expect(mockCriarNotaCredito).toHaveBeenCalledTimes(1);
    });
});

describe('POST /api/faturas/nota-debito', () => {
    it('regista uma ND com sucesso', async () => {
        mockCriarNotaDebito.mockResolvedValue(sucessoAgt);

        const res = await request(app)
            .post('/api/faturas/nota-debito')
            .set(headers)
            .send({
                tax_id: '5000000000', private_key: getTestPrivateKey(), document_no: 'ND SEDE/1',
                net_total: 1000, tax_payable: 140, gross_total: 1140, lines: [linha],
            });

        expect(res.status).toBe(200);
        expect(mockCriarNotaDebito).toHaveBeenCalledTimes(1);
    });
});

describe('POST /api/faturas/anular', () => {
    it('exige rejected_document_no e document_cancel_reason (400 sem eles)', async () => {
        const res = await request(app)
            .post('/api/faturas/anular')
            .set(headers)
            .send({ tax_id: '5000000000', private_key: getTestPrivateKey(), document_type: 'FT', document_no: 'FT SEDE/1' });

        expect(res.status).toBe(400);
        expect(mockAnularFatura).not.toHaveBeenCalled();
    });

    it('anula com sucesso quando os campos obrigatórios vêm preenchidos', async () => {
        mockAnularFatura.mockResolvedValue(sucessoAgt);

        const res = await request(app)
            .post('/api/faturas/anular')
            .set(headers)
            .send({
                tax_id: '5000000000', private_key: getTestPrivateKey(), document_type: 'FT', document_no: 'FT SEDE/1',
                rejected_document_no: 'FT SEDE/1', document_cancel_reason: 'Erro de digitação', lines: [linha],
            });

        expect(res.status).toBe(200);
        expect(mockAnularFatura).toHaveBeenCalledTimes(1);
    });
});

describe('POST /api/faturas/corrigir', () => {
    it('corrige com sucesso quando os campos obrigatórios vêm preenchidos', async () => {
        mockCorrigirFatura.mockResolvedValue(sucessoAgt);

        const res = await request(app)
            .post('/api/faturas/corrigir')
            .set(headers)
            .send({
                tax_id: '5000000000', private_key: getTestPrivateKey(), document_type: 'FT', document_no: 'FT SEDE/1',
                rejected_document_no: 'FT SEDE/1', document_cancel_reason: 'Valor errado', lines: [linha],
            });

        expect(res.status).toBe(200);
        expect(mockCorrigirFatura).toHaveBeenCalledTimes(1);
    });
});

describe('POST /api/faturas/estado', () => {
    it('consulta o estado com sucesso e grava um log do tipo ESTADO', async () => {
        mockConsultarEstado.mockResolvedValue({
            success: true, requestID: 'REQ-1', resultCode: '0', documentStatusList: [],
            payload: {}, response: { status: 200, data: {} },
        });

        const res = await request(app)
            .post('/api/faturas/estado')
            .set(headers)
            .send({ tax_id: '5000000000', private_key: getTestPrivateKey(), requestID: 'REQ-1' });

        expect(res.status).toBe(200);
        expect(mockRegistarLog.mock.calls[0][0]).toMatchObject({ tipo: 'ESTADO' });
    });

    it('devolve 502 quando a AGT devolve erro na consulta', async () => {
        mockConsultarEstado.mockResolvedValue({
            success: false, error: 'requestID desconhecido', payload: {}, response: { status: 404, data: {} },
        });

        const res = await request(app)
            .post('/api/faturas/estado')
            .set(headers)
            .send({ tax_id: '5000000000', private_key: getTestPrivateKey(), requestID: 'REQ-INEXISTENTE' });

        expect(res.status).toBe(502);
        expect(res.body.success).toBe(false);
    });
});
