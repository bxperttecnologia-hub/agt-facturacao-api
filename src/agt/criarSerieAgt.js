'use strict';

const { getAgtConfig, buildSoftwareInfo } = require('./agtConfig');
const { uuidV4, timestampNow, signJws, httpPost } = require('./agtUtils');

/**
 * Solicita a criação (ou ampliação) de uma série de numeração de facturas junto da AGT.
 *
 * @param {object} params
 * @param {string} params.tax_id         NIF do contribuinte (obrigatório)
 * @param {string} params.private_key    Chave privada PEM do emissor (obrigatório)
 * @param {string} params.document_type  FT, FR, NC, RC, ... (obrigatório)
 * @param {string} [params.establishment='SEDE']
 * @param {string} [params.year]         Ano da série (por omissão, ano corrente)
 * @param {string} [params.contingency_indicator='N']  'N' normal | 'C' contingência
 * @param {boolean} [params.test=true]
 * @param {string} [params.username]
 * @param {string} [params.password]
 */
async function criarSerieAGT(params = {}) {
    const taxId = params.tax_id || '';
    const privateKey = params.private_key || '';
    const docType = params.document_type || '';

    if (!taxId) return { success: false, error: 'Parâmetro "tax_id" é obrigatório.' };
    if (!privateKey) return { success: false, error: 'Parâmetro "private_key" é obrigatório.' };
    if (!docType) {
        return { success: false, error: 'Parâmetro "document_type" é obrigatório (FT, FR, NC, RC, ...).' };
    }

    const isTest = params.test ?? true;
    const establishment = params.establishment || 'SEDE';
    const year = params.year || String(new Date().getFullYear());
    const contingencyIndicator = params.contingency_indicator || 'N';

    const config = getAgtConfig(isTest);
    // Nota de arquitectura (confirmada): mesmo que params.username/params.password
    // venham no pedido (aceites pelo schema por compatibilidade), esta API usa
    // sempre as credenciais Basic Auth configuradas no .env por ambiente
    // (AGT_TEST_USERNAME/PASSWORD ou AGT_PROD_USERNAME/PASSWORD) — decisão de
    // negócio confirmada, não um esquecimento.
    const username = config.username ?? '';
    const password = config.password ?? '';
    const endpoint = config.endpoint_series;
    const softwareInfo = buildSoftwareInfo(config);

    let jwsSignature;
    try {
        jwsSignature = signJws(
            {
                taxRegistrationNumber: taxId,
                establishmentNumber: establishment,
                seriesYear: String(year),
                documentType: docType,
                seriesContingencyIndicator: contingencyIndicator,
            },
            privateKey
        );
    } catch (e) {
        return { success: false, error: 'Erro na assinatura JWS: ' + e.message };
    }

    const payload = {
        schemaVersion: '1.2',
        submissionUUID: uuidV4(),
        taxRegistrationNumber: taxId,
        submissionTimeStamp: timestampNow(),
        seriesContingencyIndicator: contingencyIndicator,
        seriesYear: String(year),
        documentType: docType,
        establishmentNumber: establishment,
        jwsSignature,
        softwareInfo,
    };

    const response = await httpPost(endpoint, payload, username, password);
    const httpSuccess = response.status >= 200 && response.status < 300;
    const result = response.data?.seriesFEResult ?? {};

    return {
        success: httpSuccess && !response.error && !!result.seriesCode,
        seriesCode: result.seriesCode ?? null,
        authorizedQuantity: result.authorizedQuantity ?? null,
        firstDocumentNo: result.firstDocumentNo ?? null,
        lastDocumentNo: result.lastDocumentNo ?? null,
        submissionUUID: payload.submissionUUID,
        payload,
        response,
        error: response.error ?? (response.data?.errorList?.[0]?.descriptionError ?? response.data?.errorList?.[0] ?? null),
    };
}

module.exports = { criarSerieAGT };