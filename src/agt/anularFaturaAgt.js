'use strict';

const { criarFaturaAGT } = require('./criarFaturaAgt');

const TIPOS_VALIDOS = ['FT', 'FR', 'NC', 'ND', 'RC'];

/**
 * Anula um documento já submetido à AGT.
 *
 * Este proxy não guarda os documentos que emite (não há cadastro próprio —
 * ver README.md), por isso "anular" não é um pedido leve por ID: é uma
 * NOVA submissão, do mesmo tipo de documento (document_type) e com as
 * mesmas linhas/totais do documento original, mas marcada como:
 *   - document_status = 'A' (Anulado)
 *   - rejected_document_no = nº do documento original que está a ser anulado
 *   - document_cancel_reason = motivo da anulação
 *
 * (rejectedDocumentNo/documentCancelReason já eram suportados de forma
 * genérica pelo motor — este ficheiro só torna o fluxo explícito e valida
 * os campos obrigatórios antes de assinar/enviar.)
 */
async function anularFaturaAGT(params = {}) {
    const docType = (params.document_type || '').toUpperCase();

    if (!TIPOS_VALIDOS.includes(docType)) {
        return {
            success: false,
            error: `Parâmetro "document_type" inválido ou em falta. Use um de: ${TIPOS_VALIDOS.join(', ')}.`,
        };
    }
    if (!params.rejected_document_no) {
        return {
            success: false,
            error: 'Parâmetro "rejected_document_no" é obrigatório (nº do documento original a anular).',
        };
    }
    if (!params.document_cancel_reason) {
        return {
            success: false,
            error: 'Parâmetro "document_cancel_reason" é obrigatório (motivo da anulação).',
        };
    }

    return criarFaturaAGT({
        ...params,
        document_type: docType,
        document_status: 'A',
    });
}

module.exports = { anularFaturaAGT };
