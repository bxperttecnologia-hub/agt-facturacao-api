'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { criarSerieAGT } = require('../agt/criarSerieAgt');
const logsService = require('../services/logs.service');

/**
 * POST /api/series
 * Recebe credenciais + dados da série num único pedido, assina e reencaminha
 * para a AGT. A empresa não precisa de estar previamente registada nesta
 * API — os dados vêm sempre no próprio pedido. Guardamos apenas um log.
 */
const solicitar = asyncHandler(async (req, res) => {
    const body = req.body;
    const isTest = body.test ?? true;

    const resultado = await criarSerieAGT(body);

    await logsService.registarLog({
        tipo: 'SERIE',
        ambiente: isTest ? 'test' : 'production',
        nif: body.tax_id,
        nome_empresa: body.nome_empresa,
        document_type: body.document_type,
        establishment: body.establishment || 'SEDE',
        submission_uuid: resultado.submissionUUID,
        sucesso: resultado.success,
        http_status_agt: resultado.response?.status ?? null,
        mensagem_erro: resultado.error ? String(resultado.error) : null,
        request_payload: resultado.payload,
        response_payload: resultado.response?.data,
    });

    res.status(resultado.success ? 200 : 502).json({ success: resultado.success, resultado });
});

module.exports = { solicitar };
