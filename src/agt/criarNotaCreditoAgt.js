'use strict';

const { criarFaturaAGT } = require('./criarFaturaAgt');

/**
 * Regista uma Nota de Crédito (NC) na AGT.
 *
 * Wrapper fino sobre criarFaturaAGT (mesmo motor de assinatura/envio usado
 * por FT/FR/ND/RC — ver criarFaturaAgt.js): força document_type = 'NC' e
 * garante que "reference" (nº do documento original) e "reason" (motivo)
 * vêm preenchidos, porque o motor usa-os para montar o "referenceInfo"
 * que a AGT exige em cada linha de uma NC.
 *
 * Nota de negócio (já implementada no motor): numa NC a AGT exige que a
 * soma dos valores a crédito seja inferior à soma dos valores a débito
 * (regra E16) — por isso as linhas devem vir com "debit_amount", não
 * "credit_amount".
 */
async function criarNotaCreditoAGT(params = {}) {
    if (!params.reference) {
        return {
            success: false,
            error: 'Parâmetro "reference" é obrigatório numa Nota de Crédito (nº do documento original que está a ser corrigido/anulado).',
        };
    }
    if (!params.reason) {
        return {
            success: false,
            error: 'Parâmetro "reason" é obrigatório numa Nota de Crédito (motivo da nota de crédito).',
        };
    }

    return criarFaturaAGT({ ...params, document_type: 'NC' });
}

module.exports = { criarNotaCreditoAGT };
