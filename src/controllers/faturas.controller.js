'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { criarFaturaAGT } = require('../agt/criarFaturaAgt');
const { criarNotaCreditoAGT } = require('../agt/criarNotaCreditoAgt');
const { criarNotaDebitoAGT } = require('../agt/criarNotaDebitoAgt');
const { anularFaturaAGT } = require('../agt/anularFaturaAgt');
const { corrigirFaturaAGT } = require('../agt/corrigirFaturaAgt');
const { consultarEstadoAGT } = require('../agt/consultarEstadoAgt');
const logsService = require('../services/logs.service');

/**
 * Grava o log do pedido e devolve a resposta HTTP. Partilhado por todos os
 * handlers que criam/alteram um documento (FT/FR/NC/ND/RC, anulação e
 * correcção) para não repetir o mesmo bloco 5 vezes — só "consultarEstado"
 * fica de fora, porque o log dela tem campos diferentes (tipo: 'ESTADO').
 */
async function responderResultado(req, res, resultado) {
    const body = req.body;
    const isTest = body.test ?? true;

    await logsService.registarLog({
        tipo: 'FATURA',
        ambiente: isTest ? 'test' : 'production',
        nif: body.tax_id,
        nome_empresa: body.nome_empresa,
        document_type: resultado.payload?.documents?.[0]?.documentType ?? body.document_type,
        document_no: body.document_no,
        submission_uuid: resultado.submissionUUID,
        request_id: resultado.requestId,
        sucesso: resultado.success,
        http_status_agt: resultado.response?.status ?? null,
        mensagem_erro: resultado.error ? String(resultado.error) : null,
        request_payload: resultado.payload,
        response_payload: resultado.response?.data,
    });

    res.status(resultado.success ? 200 : 502).json({ success: resultado.success, resultado });
}

/**
 * POST /api/faturas
 * Recebe credenciais + dados da factura/factura-recibo/nota de
 * crédito/nota de débito num único pedido, assina e reencaminha para a AGT.
 */
const registar = asyncHandler(async (req, res) => {
    const resultado = await criarFaturaAGT(req.body);
    await responderResultado(req, res, resultado);
});

/**
 * POST /api/faturas/nota-credito
 * Regista uma Nota de Crédito (NC) — "reference" e "reason" obrigatórios.
 */
const registarNotaCredito = asyncHandler(async (req, res) => {
    const resultado = await criarNotaCreditoAGT(req.body);
    await responderResultado(req, res, resultado);
});

/**
 * POST /api/faturas/nota-debito
 * Regista uma Nota de Débito (ND).
 */
const registarNotaDebito = asyncHandler(async (req, res) => {
    const resultado = await criarNotaDebitoAGT(req.body);
    await responderResultado(req, res, resultado);
});

/**
 * POST /api/faturas/anular
 * Anula um documento já submetido (document_status = 'A'), referenciando-o
 * via "rejected_document_no" e "document_cancel_reason".
 */
const anular = asyncHandler(async (req, res) => {
    const resultado = await anularFaturaAGT(req.body);
    await responderResultado(req, res, resultado);
});

/**
 * POST /api/faturas/corrigir
 * Regista a correcção de um documento já submetido, referenciando-o via
 * "rejected_document_no" e "document_cancel_reason".
 */
const corrigir = asyncHandler(async (req, res) => {
    const resultado = await corrigirFaturaAGT(req.body);
    await responderResultado(req, res, resultado);
});

/**
 * POST /api/faturas/estado
 * Consulta o estado de uma factura já submetida. Vai por POST (e não GET)
 * porque o pedido precisa de levar a chave privada para assinar a consulta
 * — não é seguro pôr isso num query string.
 */
const consultarEstado = asyncHandler(async (req, res) => {
    const body = req.body;
    const isTest = body.test ?? true;

    const resultado = await consultarEstadoAGT(body);

    await logsService.registarLog({
        tipo: 'ESTADO',
        ambiente: isTest ? 'test' : 'production',
        nif: body.tax_id,
        nome_empresa: body.nome_empresa,
        request_id: resultado.requestID,
        sucesso: resultado.success,
        http_status_agt: resultado.response?.status ?? null,
        mensagem_erro: resultado.error ? String(resultado.error) : null,
        request_payload: resultado.payload,
        response_payload: resultado.response?.data,
    });

    res.status(resultado.success ? 200 : 502).json({ success: resultado.success, resultado });
});

module.exports = {
    registar,
    registarNotaCredito,
    registarNotaDebito,
    anular,
    corrigir,
    consultarEstado,
};
