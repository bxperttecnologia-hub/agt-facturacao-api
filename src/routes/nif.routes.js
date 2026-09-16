"use strict";

const env = require("../config/env");
const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");
const consultarNifAgt = require("../agt/consultarNifAgt");

/**
 * Consulta o NIF (Número de Identificação Fiscal) de um contribuinte
 * junto da AGT através do SIFT.
 *
 * GET /api/nif?numeroDocumento=5417663700&tipoDocumento=BI
 *
 * Query params obrigatórios:
 * - numeroDocumento: número do documento de identificação
 * - tipoDocumento: tipo de documento (ex: BI, PP, etc.) [opcional, padrão: BI]
 *
 * Resposta:
 * - success: true/false
 * - nif: número de NIF (se sucesso)
 * - contribuinte: dados do contribuinte (se disponível)
 * - error: mensagem de erro (se falhar)
 */
async function consultarNif(req, res, next) {
  try {
    const { numeroDocumento, tipoDocumento = null } = req.query;

    // Validação básica
    if (!numeroDocumento || String(numeroDocumento).trim() === "") {
      return next(
        ApiError.badRequest('O parâmetro "numeroDocumento" é obrigatório.'),
      );
    }

    logger.info(
      { numeroDocumento, tipoDocumento },
      "Iniciando consulta de NIF",
    );

    // Chama o serviço AGT de consulta de NIF
    const resultado = await consultarNifAgt({
      numeroDocumento: String(numeroDocumento).trim(),
      tipoDocumento: String(tipoDocumento).trim(),
      username: env.AGT.production.username,
      password: env.AGT.production.password,
      baseUrl: env.AGT.production.baseUrl,
    });

    logger.info(
      { numeroDocumento, resultado: resultado.success },
      "Consulta de NIF completada",
    );

    return res.json(resultado);
  } catch (err) {
    logger.error({ err }, "Erro ao consultar NIF");
    return next(ApiError.internalServerError("Erro ao consultar o NIF."));
  }
}

module.exports = { consultarNif };
