'use strict';

const { getAgtConfig, buildSoftwareInfo } = require('./agtConfig');
const { uuidV4, timestampNow, signJws, httpPost } = require('./agtUtils');

/**
 * Consulta o estado de validação de facturas previamente submetidas via
 * registarFactura, usando o requestID devolvido nesse momento.
 *
 * NOTA DE CORRECÇÃO face ao ficheiro original consultarEstadoAGT.js:
 *   - O endpoint usado era por engano o de "solicitarSerie". O endpoint correcto,
 *     confirmado na documentação da AGT, é "obterEstado".
 *   - Faltava "taxRegistrationNumber" no payload e a assinatura "jwsSignature"
 *     (obrigatória, assinando taxRegistrationNumber + requestID). Ambos foram
 *     adicionados aqui.
 *
 * @param {object} params
 * @param {string} params.tax_id       NIF do contribuinte (obrigatório)
 * @param {string} params.private_key Chave privada PEM do emissor (obrigatório)
 * @param {string} params.requestID   Identificador do pedido devolvido por registarFactura (obrigatório)
 * @param {boolean} [params.test=true]
 */
async function consultarEstadoAGT(params = {}) {
    const taxId = params.tax_id || '';
    const privateKey = params.private_key || '';
    const requestID = params.requestID || params.request_id || '';

    if (!taxId) return { success: false, error: 'Parâmetro "tax_id" é obrigatório.' };
    if (!privateKey) return { success: false, error: 'Parâmetro "private_key" é obrigatório.' };
    if (!requestID) return { success: false, error: 'Parâmetro "requestID" é obrigatório.' };

    const isTest = params.test ?? true;

    const config = getAgtConfig(isTest);
    // Nota de arquitectura (confirmada): mesmo que params.username/params.password
    // venham no pedido (aceites pelo schema por compatibilidade), esta API usa
    // sempre as credenciais Basic Auth configuradas no .env por ambiente
    // (AGT_TEST_USERNAME/PASSWORD ou AGT_PROD_USERNAME/PASSWORD) — decisão de
    // negócio confirmada, não um esquecimento.
    const username = config.username ?? '';
    const password = config.password ?? '';
    const endpoint = config.endpoint_status;
    const softwareInfo = buildSoftwareInfo(config);

    let jwsSignature;
    try {
        jwsSignature = signJws({ taxRegistrationNumber: taxId, requestID }, privateKey);
    } catch (e) {
        return { success: false, error: 'Erro na assinatura JWS: ' + e.message };
    }

    const payload = {
        schemaVersion: '1.2',
        submissionUUID: uuidV4(),
        taxRegistrationNumber: taxId,
        submissionTimeStamp: timestampNow(),
        softwareInfo,
        jwsSignature,
        requestID,
    };

    const response = await httpPost(endpoint, payload, username, password);
    const httpSuccess = response.status >= 200 && response.status < 300;
    const data = response.data || {};

    return {
        success: httpSuccess && !response.error,
        requestID: data.requestID ?? requestID,
        resultCode: data.resultCode ?? null,
        documentStatusList: data.documentStatusList ?? [],
        payload,
        response,
        error: response.error ?? (data.requestErrorList?.[0]?.errorDescription ?? data.requestErrorList?.[0] ?? null),
    };
}

module.exports = { consultarEstadoAGT };