'use strict';

const { Router } = require('express');
const { validateBody } = require('../middlewares/validate');
const { serieSchema } = require('../utils/schemas');
const { agtCallLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/series.controller');

const router = Router();

/**
 * @openapi
 * /series:
 *   post:
 *     tags: [Séries]
 *     summary: Solicita uma série de numeração de documentos à AGT
 *     description: >
 *       Proxy directo para `solicitarSerie` da AGT. Assina o pedido com a
 *       chave privada fornecida e grava um log de auditoria em `agt_logs`.
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tax_id, private_key, document_type]
 *             properties:
 *               tax_id: { type: string, example: "5000000000" }
 *               private_key: { type: string, description: "Chave privada RSA em PEM" }
 *               document_type: { type: string, example: FT }
 *               establishment: { type: string, example: SEDE }
 *               year: { type: integer, example: 2026 }
 *               contingency_indicator: { type: string, enum: [N, C] }
 *               test: { type: boolean, default: true }
 *               nome_empresa: { type: string, description: "Só para o log; nunca enviado à AGT." }
 *     responses:
 *       200:
 *         description: Série obtida com sucesso (ou pedido rejeitado pela AGT — ver campo "success" na resposta).
 *       400:
 *         description: Dados de entrada inválidos.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/RespostaErro' } } }
 *       401:
 *         description: API key ausente ou inválida.
 *       429:
 *         description: Demasiados pedidos à AGT num curto período.
 *       502:
 *         description: A AGT rejeitou o pedido ou não respondeu.
 */
// POST /api/series — solicita uma série de numeração à AGT (proxy directo).
router.post('/', agtCallLimiter, validateBody(serieSchema), controller.solicitar);

module.exports = router;
