'use strict';

const { Router } = require('express');
const { validateBody } = require('../middlewares/validate');
const {
    faturaSchema,
    estadoSchema,
    notaCreditoSchema,
    notaDebitoSchema,
    anulacaoSchema,
    correcaoSchema,
} = require('../utils/schemas');
const { agtCallLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/faturas.controller');

const router = Router();

/**
 * @openapi
 * /faturas:
 *   post:
 *     tags: [Faturas]
 *     summary: Regista um documento (FT, FR, NC, ND ou RC) na AGT
 *     description: document_type escolhe o tipo de documento a registar.
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object } } }
 *     responses:
 *       200: { description: Documento processado (ver "success" na resposta) }
 *       400: { description: Dados de entrada inválidos, content: { application/json: { schema: { $ref: '#/components/schemas/RespostaErro' } } } }
 *       401: { description: API key ausente ou inválida }
 *       429: { description: Demasiados pedidos à AGT num curto período }
 *       502: { description: A AGT rejeitou o pedido ou não respondeu }
 */
// POST /api/faturas — regista uma factura/factura-recibo/nota de crédito/
// nota de débito num único pedido genérico (document_type escolhe o tipo).
router.post('/', agtCallLimiter, validateBody(faturaSchema), controller.registar);

/**
 * @openapi
 * /faturas/nota-credito:
 *   post:
 *     tags: [Faturas]
 *     summary: Atalho dedicado para registar uma Nota de Crédito (NC)
 *     description: >
 *       document_type é forçado a "NC" pelo servidor. "reference" (nº do
 *       documento original) e "reason" são obrigatórios; as linhas usam
 *       debit_amount em vez de credit_amount (regra E16 da AGT).
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object } } }
 *     responses:
 *       200: { description: Nota de Crédito processada }
 *       400: { description: Dados de entrada inválidos }
 *       401: { description: API key ausente ou inválida }
 *       502: { description: A AGT rejeitou o pedido ou não respondeu }
 */
// POST /api/faturas/nota-credito — atalho dedicado para NC (document_type
// forçado a 'NC'; "reference"/"reason" obrigatórios).
router.post('/nota-credito', agtCallLimiter, validateBody(notaCreditoSchema), controller.registarNotaCredito);

/**
 * @openapi
 * /faturas/nota-debito:
 *   post:
 *     tags: [Faturas]
 *     summary: Atalho dedicado para registar uma Nota de Débito (ND)
 *     description: document_type é forçado a "ND" pelo servidor.
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object } } }
 *     responses:
 *       200: { description: Nota de Débito processada }
 *       400: { description: Dados de entrada inválidos }
 *       401: { description: API key ausente ou inválida }
 *       502: { description: A AGT rejeitou o pedido ou não respondeu }
 */
// POST /api/faturas/nota-debito — atalho dedicado para ND (document_type
// forçado a 'ND').
router.post('/nota-debito', agtCallLimiter, validateBody(notaDebitoSchema), controller.registarNotaDebito);

/**
 * @openapi
 * /faturas/anular:
 *   post:
 *     tags: [Faturas]
 *     summary: Anula um documento já submetido
 *     description: >
 *       Reenvia o documento original (mesmo document_type, mesmas
 *       lines/totais) marcado com document_status = "A" (forçado pelo
 *       servidor). Exige rejected_document_no e document_cancel_reason.
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object } } }
 *     responses:
 *       200: { description: Anulação processada }
 *       400: { description: Dados de entrada inválidos }
 *       401: { description: API key ausente ou inválida }
 *       502: { description: A AGT rejeitou o pedido ou não respondeu }
 */
// POST /api/faturas/anular — anula um documento já submetido (reenvia com
// document_status = 'A', referenciando o original).
router.post('/anular', agtCallLimiter, validateBody(anulacaoSchema), controller.anular);

/**
 * @openapi
 * /faturas/corrigir:
 *   post:
 *     tags: [Faturas]
 *     summary: Regista a correcção de um documento já submetido
 *     description: >
 *       Reenvia o documento com os valores corrigidos, referenciando o
 *       original via rejected_document_no e document_cancel_reason.
 *       document_status usa CORRECTION_DOCUMENT_STATUS (.env, omissão "R")
 *       salvo se o pedido enviar o seu próprio document_status — valor
 *       ainda não confirmado contra a carta de códigos oficial da AGT.
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object } } }
 *     responses:
 *       200: { description: Correcção processada }
 *       400: { description: Dados de entrada inválidos }
 *       401: { description: API key ausente ou inválida }
 *       502: { description: A AGT rejeitou o pedido ou não respondeu }
 */
// POST /api/faturas/corrigir — regista a correcção de um documento já
// submetido (reenvia com as linhas/totais corrigidos, referenciando o original).
router.post('/corrigir', agtCallLimiter, validateBody(correcaoSchema), controller.corrigir);

/**
 * @openapi
 * /faturas/estado:
 *   post:
 *     tags: [Faturas]
 *     summary: Consulta o estado de uma factura já submetida
 *     description: >
 *       É POST (não GET) porque o pedido leva a chave privada para assinar
 *       a consulta — não é seguro pôr isso num query string.
 *     security: [{ ApiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tax_id, private_key, requestID]
 *             properties:
 *               tax_id: { type: string }
 *               private_key: { type: string }
 *               username: { type: string }
 *               password: { type: string }
 *               requestID: { type: string }
 *               test: { type: boolean, default: true }
 *     responses:
 *       200: { description: Estado consultado }
 *       400: { description: Dados de entrada inválidos }
 *       401: { description: API key ausente ou inválida }
 *       502: { description: A AGT rejeitou o pedido ou não respondeu }
 */
// POST /api/faturas/estado — consulta o estado de uma factura já submetida.
// É POST (não GET) porque o pedido leva a chave privada para assinar a consulta.
router.post('/estado', agtCallLimiter, validateBody(estadoSchema), controller.consultarEstado);

module.exports = router;
