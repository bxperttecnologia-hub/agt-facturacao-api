'use strict';

const { criarFaturaAGT } = require('./criarFaturaAgt');

/**
 * Regista uma Nota de Débito (ND) na AGT.
 *
 * Wrapper fino sobre criarFaturaAGT: força document_type = 'ND'. Ao
 * contrário da NC, a ND segue a regra normal de uma factura (soma a
 * crédito, sem "debitAmount") e não exige "referenceInfo" por defeito —
 * mas se vierem "reference"/"reason" (porque esta ND está a corrigir um
 * documento específico), esses dados são incluídos automaticamente pelo
 * motor (ver criarFaturaAgt.js).
 */
async function criarNotaDebitoAGT(params = {}) {
    return criarFaturaAGT({ ...params, document_type: 'ND' });
}

module.exports = { criarNotaDebitoAGT };
