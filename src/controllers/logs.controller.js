'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const logsService = require('../services/logs.service');

/** GET /api/logs?nif=&tipo=&document_no=&request_id=&limit= */
const listar = asyncHandler(async (req, res) => {
    const logs = await logsService.listarLogs(req.query);
    res.json({ success: true, logs });
});

/** GET /api/logs/:id */
const obter = asyncHandler(async (req, res) => {
    const log = await logsService.obterLog(req.params.id);
    if (!log) throw ApiError.notFound('Log não encontrado.');
    res.json({ success: true, log });
});

module.exports = { listar, obter };
