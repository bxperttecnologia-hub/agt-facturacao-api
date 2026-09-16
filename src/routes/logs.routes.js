'use strict';

const { Router } = require('express');
const controller = require('../controllers/logs.controller');

const router = Router();

/**
 * @openapi
 * /logs:
 *   get:
 *     tags: [Logs]
 *     summary: Lista o histórico de pedidos feitos à AGT (auditoria)
 *     security: [{ ApiKeyAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: nif
 *         schema: { type: string }
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [SERIE, FATURA, ESTADO] }
 *       - in: query
 *         name: document_no
 *         schema: { type: string }
 *       - in: query
 *         name: request_id
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 200 }
 *     responses:
 *       200: { description: Lista de logs }
 *       401: { description: API key ausente ou inválida }
 */
// GET /api/logs — consulta o histórico de pedidos feitos à AGT (auditoria).
router.get('/', controller.listar);

/**
 * @openapi
 * /logs/{id}:
 *   get:
 *     tags: [Logs]
 *     summary: Detalhe de um pedido específico (payload enviado + resposta da AGT)
 *     security: [{ ApiKeyAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Log encontrado }
 *       401: { description: API key ausente ou inválida }
 *       404: { description: Log não encontrado }
 */
router.get('/:id', controller.obter);

module.exports = router;
