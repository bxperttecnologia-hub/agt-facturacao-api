'use strict';

const { z } = require('zod');

// Credenciais e identificação da empresa que vêm em CADA pedido — este
// proxy não tem cadastro próprio de empresas, por isso todos os campos
// necessários para assinar e autenticar junto da AGT têm de vir aqui.
const credenciaisSchema = z.object({
    tax_id: z.string().min(1, 'NIF (tax_id) é obrigatório.'),
    private_key: z.string().min(1, 'A chave privada (PEM) é obrigatória.'),
    username: z.string().optional(),
    password: z.string().optional(),
    test: z.boolean().optional(),
    // Opcional, só para facilitar a leitura dos logs — nunca é enviado à AGT.
    nome_empresa: z.string().optional(),
});

const serieSchema = credenciaisSchema.extend({
    document_type: z.string().min(1),
    establishment: z.string().optional(),
    year: z.union([z.string(), z.number()]).optional(),
    contingency_indicator: z.enum(['N', 'C']).optional(),
});

const linhaSchema = z.object({
    product_code: z.string().optional(),
    product_description: z.string().optional(),
    quantity: z.number().optional(),
    unit_of_measure: z.string().optional(),
    unit_price: z.number().optional(),
    unit_price_base: z.number().optional(),
    credit_amount: z.number().optional(),
    debit_amount: z.number().optional(),
    settlement_amount: z.number().optional(),
    tax_type: z.string().optional(),
    tax_country_region: z.string().optional(),
    tax_code: z.string().optional(),
    tax_percentage: z.number().optional(),
    tax_contribution: z.number().optional(),
    tax_exemption_code: z.string().optional(),
});

// Documento de origem referenciado por um Recibo (RC) — a factura/factura-recibo
// que está a ser regularizada pelo pagamento.
const sourceDocumentSchema = z.object({
    line_no: z.union([z.string(), z.number()]).optional(),
    source_document_id: z.object({
        originating_on: z.string().min(1, 'originating_on (documento original) é obrigatório.'),
        document_date: z.string().min(1, 'document_date do documento original é obrigatório.'),
    }),
    debit_amount: z.union([z.string(), z.number()]).optional(),
    credit_amount: z.union([z.string(), z.number()]).optional(),
});

const paymentReceiptSchema = z.object({
    source_documents: z.array(sourceDocumentSchema).min(1, 'payment_receipt.source_documents precisa de pelo menos um documento.'),
});

// Item da lista de retenções na fonte (ex.: IRT). Alternativa em formato de
// lista aos campos escalares withholding_tax_* abaixo (mantidos por compatibilidade).
const withholdingTaxItemSchema = z.object({
    type: z.string().optional(),
    withholding_tax_type: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    withholding_tax_amount: z.union([z.string(), z.number()]).optional(),
    description: z.string().optional(),
    withholding_tax_description: z.string().optional(),
});

const faturaSchema = credenciaisSchema
    .extend({
        // 🔧 'ND' estava em falta — ver correspondente correcção em criarFaturaAgt.js
        document_type: z.enum(['FT', 'FR', 'NC', 'ND', 'RC']),
        document_no: z.string().min(1),
        document_date: z.string().optional(),
        document_status: z.string().optional(),
        customer_tax_id: z.string().optional(),
        customer_name: z.string().optional(),
        customer_country: z.string().optional(),
        net_total: z.number().optional(),
        tax_payable: z.number().optional(),
        gross_total: z.number().optional(),
        eac_code: z.union([z.string(), z.number()]).optional(),
        reference: z.string().optional(),
        reason: z.string().optional(),
        rejected_document_no: z.string().optional(),
        document_cancel_reason: z.string().optional(),
        withholding_tax_type: z.string().optional(),
        withholding_tax_amount: z.number().optional(),
        withholding_tax_description: z.string().optional(),
        withholding_tax_list: z.array(withholdingTaxItemSchema).optional(),
        // Obrigatório para FT/FR/NC; para RC (Recibo) vai vazio e usa-se
        // payment_receipt em vez disso.
        lines: z.array(linhaSchema).optional().default([]),
        payment_receipt: paymentReceiptSchema.optional(),
    })
    .superRefine((data, ctx) => {
        if (data.document_type === 'RC') {
            if (!data.payment_receipt) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['payment_receipt'],
                    message: 'payment_receipt é obrigatório para document_type "RC".',
                });
            }
        } else if (!data.lines || data.lines.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['lines'],
                message: 'É necessária pelo menos uma linha.',
            });
        }
    });

// Campos partilhados por FT/FR/NC/ND/RC — repetidos aqui (em vez de
// derivados de faturaSchema) para cada schema abaixo poder ter as suas
// próprias regras de obrigatoriedade sem herdar o enum/refine de faturaSchema.
const camposDocumentoBase = {
    document_no: z.string().min(1),
    document_date: z.string().optional(),
    document_status: z.string().optional(),
    customer_tax_id: z.string().optional(),
    customer_name: z.string().optional(),
    customer_country: z.string().optional(),
    net_total: z.number().optional(),
    tax_payable: z.number().optional(),
    gross_total: z.number().optional(),
    eac_code: z.union([z.string(), z.number()]).optional(),
    withholding_tax_type: z.string().optional(),
    withholding_tax_amount: z.number().optional(),
    withholding_tax_description: z.string().optional(),
    withholding_tax_list: z.array(withholdingTaxItemSchema).optional(),
};

// POST /api/faturas/nota-credito — document_type é sempre forçado a 'NC'
// pelo controller, por isso não é pedido aqui; "reference"/"reason" passam
// a ser obrigatórios (o motor precisa deles para o referenceInfo por linha).
const notaCreditoSchema = credenciaisSchema.extend({
    ...camposDocumentoBase,
    reference: z.string().min(1, 'reference é obrigatório numa Nota de Crédito (nº do documento original).'),
    reason: z.string().min(1, 'reason é obrigatório numa Nota de Crédito (motivo).'),
    lines: z.array(linhaSchema).min(1, 'É necessária pelo menos uma linha.'),
});

// POST /api/faturas/nota-debito — document_type é sempre forçado a 'ND'.
const notaDebitoSchema = credenciaisSchema.extend({
    ...camposDocumentoBase,
    reference: z.string().optional(),
    reason: z.string().optional(),
    lines: z.array(linhaSchema).min(1, 'É necessária pelo menos uma linha.'),
});

// Base comum a anulação e correcção: ambas reenviam o documento original
// (mesmo document_type) referenciando-o por rejected_document_no +
// document_cancel_reason. document_status fica por conta do controller
// (anularFaturaAgt.js força 'A'; corrigirFaturaAgt.js usa um valor por
// omissão, ver o ficheiro para detalhes).
const documentoReferenciadoSchema = credenciaisSchema.extend({
    document_type: z.enum(['FT', 'FR', 'NC', 'ND', 'RC']),
    ...camposDocumentoBase,
    rejected_document_no: z.string().min(1, 'rejected_document_no é obrigatório (nº do documento original).'),
    document_cancel_reason: z.string().min(1, 'document_cancel_reason é obrigatório (motivo).'),
    lines: z.array(linhaSchema).optional().default([]),
    payment_receipt: paymentReceiptSchema.optional(),
});

function exigirLinhasOuRecibo(data, ctx) {
    if (data.document_type === 'RC') {
        if (!data.payment_receipt) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['payment_receipt'],
                message: 'payment_receipt é obrigatório para document_type "RC".',
            });
        }
    } else if (!data.lines || data.lines.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lines'],
            message: 'É necessária pelo menos uma linha.',
        });
    }
}

// POST /api/faturas/anular
const anulacaoSchema = documentoReferenciadoSchema.superRefine(exigirLinhasOuRecibo);

// POST /api/faturas/corrigir
const correcaoSchema = documentoReferenciadoSchema.superRefine(exigirLinhasOuRecibo);

const estadoSchema = credenciaisSchema.extend({
    requestID: z.string().min(1, 'requestID é obrigatório (devolvido pelo registo da factura).'),
});

module.exports = {
    serieSchema,
    faturaSchema,
    estadoSchema,
    notaCreditoSchema,
    notaDebitoSchema,
    anulacaoSchema,
    correcaoSchema,
};
