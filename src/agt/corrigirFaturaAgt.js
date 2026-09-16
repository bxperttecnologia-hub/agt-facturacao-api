'use strict';

const { criarFaturaAGT } = require('./criarFaturaAgt');
const env = require('../config/env');

const TIPOS_VALIDOS = ['FT', 'FR', 'NC', 'ND', 'RC'];

// ⚠️ Código de estado (documentStatus) usado por omissão para marcar um
// documento como "corrigido/rectificado". Não encontrei, nos ficheiros do
// projecto, o valor oficial que a AGT espera para este caso — 'R' é um
// placeholder razoável (comum noutros esquemas SAF-T da região), não uma
// certeza. Configurável via CORRECTION_DOCUMENT_STATUS no .env (omissão:
// 'R'); confirma na tua carta de códigos da AGT, ou sobrepõe por pedido
// enviando "document_status" explicitamente.
const DOCUMENT_STATUS_CORRECAO = env.CORRECTION_DOCUMENT_STATUS;

/**
 * Regista a correcção de um documento já submetido à AGT.
 *
 * Tal como a anulação (ver anularFaturaAgt.js), isto é uma NOVA submissão
 * — com as linhas/totais já corrigidos — do mesmo tipo de documento,
 * referenciando o original via:
 *   - rejected_document_no = nº do documento original com erro
 *   - document_cancel_reason = motivo da correcção
 *   - document_status = DOCUMENT_STATUS_CORRECAO (ver nota acima), a menos
 *     que o pedido já traga o seu próprio "document_status"
 */
async function corrigirFaturaAGT(params = {}) {
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
            error: 'Parâmetro "rejected_document_no" é obrigatório (nº do documento original a corrigir).',
        };
    }
    if (!params.document_cancel_reason) {
        return {
            success: false,
            error: 'Parâmetro "document_cancel_reason" é obrigatório (motivo da correcção).',
        };
    }

    return criarFaturaAGT({
        ...params,
        document_type: docType,
        document_status: params.document_status || DOCUMENT_STATUS_CORRECAO,
    });
}

module.exports = { corrigirFaturaAGT };
