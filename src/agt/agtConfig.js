'use strict';

const env = require('../config/env');

/**
 * Configuração do Software de Facturação (Produtor de Software), por
 * ambiente ('test' ou 'production'). Os valores vêm do .env em vez de
 * estarem escritos directamente no código-fonte — assim consegues trocar
 * de identidade de software sem tocar em código, e evitas cometer
 * segredos no git.
 *
 * Endpoints confirmados na documentação oficial:
 *   https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/servicos/
 *
 * - solicitarSerie:  POST /sigt/fe/v1/solicitarSerie
 * - registarFactura: POST /sigt/fe/v1/registarFactura
 * - obterEstado:     POST /sigt/fe/v1/obterEstado
 */
function getAgtConfig(isTest) {
    const envConfig = isTest ? env.AGT.test : env.AGT.production;
    const base = envConfig.baseUrl;

    return {
        endpoint_series: `${base}/sigt/fe/v1/solicitarSerie`,
        endpoint_invoices: `${base}/sigt/fe/v1/registarFactura`,
        endpoint_status: `${base}/sigt/fe/v1/obterEstado`,
        software_product_id: envConfig.productId,
        software_version: envConfig.productVersion,
        software_validation: envConfig.validationNumber,
        software_jws_signature: envConfig.jwsSoftwareSignature,
        username: envConfig.username,
        password: envConfig.password,
    };
}

function buildSoftwareInfo(config) {
    return {
        softwareInfoDetail: {
            productId: config.software_product_id,
            productVersion: config.software_version,
            softwareValidationNumber: config.software_validation,
            signatureVersion: config.software_validation,
        },
        jwsSoftwareSignature: config.software_jws_signature,
    };
}

module.exports = { getAgtConfig, buildSoftwareInfo };
