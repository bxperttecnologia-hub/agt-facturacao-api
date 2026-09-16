"use strict";

const https = require("https");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Consulta o NIF (Número de Identificação Fiscal) junto do SIFT da AGT.
 *
 * Endpoint: /sigt/contribuinte/consultarNIF/v5/obter
 * Método: GET (com autenticação via headers)
 * Autenticação: HTTP Basic Auth (username:password)
 *
 * @param {Object} params
 * @param {string} params.numeroDocumento - Número do documento de identificação
 * @param {string} params.tipoDocumento - Tipo de documento (ex: BI, PP, etc.)
 * @param {string} params.username - Username para autenticação básica
 * @param {string} params.password - Password para autenticação básica
 * @param {string} params.baseUrl - URL base da AGT (ex: https://sifp.minfin.gov.ao)
 *
 * @returns {Promise<Object>} Objeto com sucesso/erro e dados do NIF
 */
async function consultarNifAgt(params) {
  return new Promise((resolve, reject) => {
    const { numeroDocumento, tipoDocumento, username, password, baseUrl } =
      params;

    // Construir autenticação básica
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );

    // Construir URL com query params
    const queryString = `tipoDocumento=${encodeURIComponent(tipoDocumento)}&numeroDocumento=${encodeURIComponent(numeroDocumento)}`;
    const urlPath = `/sigt/contribuinte/consultarNIF/v5/obter?${queryString}`;

    const options = {
      hostname: baseUrl.replace("https://", "").replace("http://", ""),
      port: 443,
      path: urlPath,
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        "User-Agent": "AGT-Facturacao-API/1.0.0",
      },
      // Aceitar certificados auto-assinados em ambiente de teste (remover em produção)
      rejectUnauthorized: process.env.NODE_ENV === "production",
    };

    logger.info(
      { hostname: options.hostname, path: urlPath },
      "Iniciando requisição GET ao SIFT",
    );

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonResponse = JSON.parse(data);

          logger.info(
            { statusCode: res.statusCode, success: jsonResponse.success },
            "Resposta recebida do SIFT",
          );

          // AGT retorna sucesso com status 200
          if (res.statusCode === 200 && jsonResponse.success) {
            resolve({
              success: true,
              nif: jsonResponse.nif,
              contribuinte: jsonResponse.contribuinte || null,
              rawResponse: jsonResponse,
            });
          } else if (res.statusCode === 400 || res.statusCode === 404) {
            resolve({
              success: false,
              error:
                jsonResponse.message ||
                "NIF não encontrado ou documento inválido",
              statusCode: res.statusCode,
            });
          } else {
            resolve({
              success: false,
              error: jsonResponse.message || "Erro ao consultar NIF",
              statusCode: res.statusCode,
            });
          }
        } catch (parseErr) {
          logger.error(
            { parseErr, data },
            "Erro ao fazer parse da resposta JSON do SIFT",
          );
          resolve({
            success: false,
            error: "Erro ao processar resposta da AGT",
          });
        }
      });
    });

    req.on("error", (err) => {
      logger.error({ err }, "Erro de conexão ao SIFT");
      reject(err);
    });

    req.on("timeout", () => {
      logger.error("Timeout na requisição ao SIFT");
      req.destroy();
      reject(new Error("Timeout ao consultar NIF na AGT"));
    });

    // Timeout de 10 segundos
    req.setTimeout(10000);

    req.end();
  });
}

module.exports = consultarNifAgt;
