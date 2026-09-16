'use strict';

const { pool } = require('../db/db');

/**
 * Regista, para fins de auditoria/rastreio, um pedido feito à AGT através
 * do proxy: os dados da empresa encontrados no pedido (NIF, nome se vier),
 * o payload exacto enviado e a resposta recebida. NUNCA recebe (nem
 * portanto guarda) chave privada ou password — essas nunca saem da memória
 * durante a chamada.
 */
async function registarLog(dados) {
    const [result] = await pool.execute(
        `INSERT INTO agt_logs
            (tipo, ambiente, nif, nome_empresa, document_type, document_no, establishment,
             submission_uuid, request_id, sucesso, http_status_agt, mensagem_erro,
             request_payload, response_payload)
         VALUES
            (:tipo, :ambiente, :nif, :nome_empresa, :document_type, :document_no, :establishment,
             :submission_uuid, :request_id, :sucesso, :http_status_agt, :mensagem_erro,
             :request_payload, :response_payload)`,
        {
            tipo: dados.tipo,
            ambiente: dados.ambiente,
            nif: dados.nif,
            nome_empresa: dados.nome_empresa ?? null,
            document_type: dados.document_type ?? null,
            document_no: dados.document_no ?? null,
            establishment: dados.establishment ?? null,
            submission_uuid: dados.submission_uuid ?? null,
            request_id: dados.request_id ?? null,
            sucesso: dados.sucesso ? 1 : 0,
            http_status_agt: dados.http_status_agt ?? null,
            mensagem_erro: dados.mensagem_erro ?? null,
            request_payload: JSON.stringify(dados.request_payload ?? {}),
            response_payload: JSON.stringify(dados.response_payload ?? {}),
        }
    );
    return result.insertId;
}

/**
 * Lista logs com filtros simples, mais recentes primeiro. Puramente
 * consultivo — não representa nenhum estado de "empresa registada".
 */
async function listarLogs(filtros = {}) {
    const condicoes = [];
    const valores = {};

    if (filtros.nif) {
        condicoes.push('nif = :nif');
        valores.nif = filtros.nif;
    }
    if (filtros.tipo) {
        condicoes.push('tipo = :tipo');
        valores.tipo = filtros.tipo;
    }
    if (filtros.document_no) {
        condicoes.push('document_no = :document_no');
        valores.document_no = filtros.document_no;
    }
    if (filtros.request_id) {
        condicoes.push('request_id = :request_id');
        valores.request_id = filtros.request_id;
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const limite = Math.min(Math.max(parseInt(filtros.limit, 10) || 50, 1), 200);

    const [rows] = await pool.query(
        `SELECT * FROM agt_logs ${where} ORDER BY id DESC LIMIT ${limite}`,
        valores
    );
    return rows;
}

async function obterLog(id) {
    const [rows] = await pool.execute(`SELECT * FROM agt_logs WHERE id = :id`, { id });
    return rows[0] ?? null;
}

module.exports = { registarLog, listarLogs, obterLog };
