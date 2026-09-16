'use strict';

const { getAgtConfig, buildSoftwareInfo } = require('./agtConfig');
const { uuidV4, timestampNow, todayDate, localDateTime, randomInt, signJws, httpPost } = require('./agtUtils');
const logger = require('../utils/logger');

/**
 * Regista (submete) uma Factura, Factura-Recibo ou Nota de Crédito na AGT.
 * Ver o cabeçalho do teu ficheiro original criarFaturaAGT.js para a lista completa
 * de parâmetros aceites — a assinatura mantém-se igual, apenas foi modularizado.
 */
async function criarFaturaAGT(params = {}) {
    const taxId = params.tax_id || '';
    const privateKey = params.private_key || '';
    const docType = (params.document_type || '').toUpperCase();
    const documentNo = params.document_no || '';

    if (!taxId) return { success: false, error: 'Parâmetro "tax_id" é obrigatório.' };
    if (!privateKey) return { success: false, error: 'Parâmetro "private_key" é obrigatório.' };
    if (!docType) return { success: false, error: 'Parâmetro "document_type" é obrigatório (FT, FR, NC, ND, RC).' };
    // 🔧 "ND" (Nota de Débito) estava em falta aqui — havia inclusivamente um
    // script de teste (scripts/08-registar-nota-debito.js) para ND que
    // falhava sempre porque este validador rejeitava o tipo antes de chegar
    // à AGT.
    if (!['FT', 'FR', 'NC', 'ND', 'RC'].includes(docType)) {
        return { success: false, error: `Tipo de documento inválido: ${docType}. Use FT, FR, NC, ND ou RC.` };
    }
    if (!documentNo) return { success: false, error: 'Parâmetro "document_no" é obrigatório.' };

    const lines = params.lines || [];
    if (docType !== 'RC' && (!Array.isArray(lines) || lines.length === 0)) {
        return { success: false, error: 'Parâmetro "lines" é obrigatório e deve conter pelo menos uma linha.' };
    }
    if (docType === 'RC' && (!params.payment_receipt || !Array.isArray(params.payment_receipt.source_documents) || params.payment_receipt.source_documents.length === 0)) {
        return { success: false, error: 'Parâmetro "payment_receipt.source_documents" é obrigatório para RC (Recibo).' };
    }

    const isTest = params.test ?? true;
    const customerTaxIdRaw = params.customer_tax_id ?? '999999999';
    const customerName = params.customer_name || '';
    const customerCountry = params.customer_country || 'AO';
    const docDate = params.document_date || todayDate();
    const docStatus = params.document_status || 'N';
    const eacCode = params.eac_code ?? randomInt(10000, 99999);
    const systemEntryDate = params.system_entry_date || localDateTime();

    const customerTaxId =
        customerTaxIdRaw === '' || customerTaxIdRaw === null || customerTaxIdRaw === undefined
            ? '999999999'
            : String(customerTaxIdRaw);

    const config = getAgtConfig(isTest);
    // Nota de arquitectura (confirmada): mesmo que params.username/params.password
    // venham no pedido (aceites pelo schema por compatibilidade), esta API usa
    // sempre as credenciais Basic Auth configuradas no .env por ambiente
    // (AGT_TEST_USERNAME/PASSWORD ou AGT_PROD_USERNAME/PASSWORD) — decisão de
    // negócio confirmada, não um esquecimento.
    const username = config.username ?? '';
    const password = config.password ?? '';
    const endpoint = config.endpoint_invoices;
    const softwareInfo = buildSoftwareInfo(config);

    // ── 1. Linhas ────────────────────────────────────────────────────────
    const agtLines = lines.map((line, index) => {
        const lineObj = {
            lineNumber: index + 1,
            productCode: line.product_code ?? line.productCode ?? '',
            productDescription: line.product_description ?? line.productDescription ?? '',
            quantity: Number(line.quantity ?? 0),
            unitOfMeasure: line.unit_of_measure ?? line.unitOfMeasure ?? 'UN',
            unitPrice: Number(line.unit_price ?? line.unitPrice ?? 0),
            unitPriceBase: Number(line.unit_price_base ?? line.unitPriceBase ?? 0),
            creditAmount: Number(line.credit_amount ?? line.creditAmount ?? 0),
            taxes: [],
            settlementAmount: Number(line.settlement_amount ?? line.settlementAmount ?? 0),
        };

        const tax = {
            taxType: line.tax_type ?? line.taxType ?? 'IVA',
            taxCountryRegion: line.tax_country_region ?? line.taxCountryRegion ?? 'AO',
            taxCode: line.tax_code ?? line.taxCode ?? 'IVA',
            taxPercentage: Number(line.tax_percentage ?? line.taxPercentage ?? 0),
            taxContribution: Number(line.tax_contribution ?? line.taxContribution ?? 0),
        };

        const taxExemption = line.tax_exemption_code ?? line.taxExemptionCode ?? '';
        if (taxExemption && String(taxExemption).trim() !== '') {
            tax.taxExemptionCode = taxExemption;
        }
        lineObj.taxes.push(tax);

        if (docType === 'NC') {
            lineObj.debitAmount = Number(line.debit_amount ?? line.debitAmount ?? 0);
            lineObj.referenceInfo = {
                reference: params.reference || '',
                referenceItemLineNo: index + 1,
                reason: params.reason || 'Erro no documento',
            };
        } else if (docType === 'ND' && (params.reference || params.reason)) {
            // 🔧 A ND segue a regra normal (creditAmount, sem debitAmount) e não
            // exige referenceInfo por defeito — mas se vier "reference"/"reason"
            // (a ND está a corrigir um documento específico), incluímo-lo.
            lineObj.referenceInfo = {
                reference: params.reference || '',
                referenceItemLineNo: index + 1,
                reason: params.reason || '',
            };
        }

        return lineObj;
    });

    // ── 2. Totais ────────────────────────────────────────────────────────
    const documentTotals = {
        taxPayable: Number(params.tax_payable ?? params.taxPayable ?? 0),
        netTotal: Number(params.net_total ?? params.netTotal ?? 0),
        grossTotal: Number(params.gross_total ?? params.grossTotal ?? 0),
    };

    // ── 3. Componente do documento ───────────────────────────────────────
    const component = {
        documentNo,
        documentStatus: docStatus,
        documentDate: String(docDate).split('T')[0],
        documentType: docType,
        documentTotals,
        eacCode: parseInt(eacCode, 10),
        systemEntryDate,
        customerTaxID: customerTaxId,
        customerCountry,
        companyName: customerName,
        withholdingTaxList: [],
        jwsDocumentSignature: '',
    };

    if (docType === 'RC') {
        // Recibo: não tem linhas de produto, tem antes o(s) documento(s) de
        // origem que estão a ser regularizados pelo pagamento.
        const sourceDocuments = (params.payment_receipt.source_documents || []).map((doc, index) => ({
            lineNo: String(doc.line_no ?? doc.lineNo ?? index + 1),
            sourceDocumentID: {
                originatingON: doc.source_document_id?.originating_on ?? doc.sourceDocumentID?.originatingON ?? '',
                documentDate: doc.source_document_id?.document_date ?? doc.sourceDocumentID?.documentDate ?? '',
            },
            debitAmount: String(doc.debit_amount ?? doc.debitAmount ?? '0'),
            creditAmount: String(doc.credit_amount ?? doc.creditAmount ?? '0'),
        }));
        component.paymentReceipt = { sourceDocuments };
    } else {
        component.lines = agtLines;
    }

    const rejectedDocNo = params.rejected_document_no ?? params.rejectedDocumentNo ?? '';
    if (rejectedDocNo) component.rejectedDocumentNo = rejectedDocNo;

    const cancelReason = params.document_cancel_reason ?? params.documentCancelReason ?? null;
    if (cancelReason !== null && cancelReason !== '') component.documentCancelReason = cancelReason;

    const withholdingList = params.withholding_tax_list ?? params.withholdingTaxList ?? [];
    if (Array.isArray(withholdingList) && withholdingList.length > 0) {
        withholdingList.forEach((item) => {
            component.withholdingTaxList.push({
                withholdingTaxType: item.type ?? item.withholding_tax_type ?? item.withholdingTaxType ?? '',
                withholdingTaxAmount: String(item.amount ?? item.withholding_tax_amount ?? item.withholdingTaxAmount ?? '0'),
                withholdingTaxDescription: item.description ?? item.withholding_tax_description ?? item.withholdingTaxDescription ?? '',
            });
        });
    } else {
        const withholdingAmount = Number(params.withholding_tax_amount ?? params.withholdingTaxAmount ?? 0);
        if (withholdingAmount > 0) {
            component.withholdingTaxList.push({
                withholdingTaxType: params.withholding_tax_type ?? params.withholdingTaxType ?? '',
                withholdingTaxAmount: String(withholdingAmount),
                withholdingTaxDescription: params.withholding_tax_description ?? params.withholdingTaxDescription ?? '',
            });
        }
    }

    // ── 4. Assinatura JWS RS256 do documento ────────────────────────────
    try {
        component.jwsDocumentSignature = signJws(
            {
                documentNo,
                taxRegistrationNumber: taxId,
                documentType: docType,
                documentDate: component.documentDate,
                customerTaxID: customerTaxId,
                customerCountry,
                companyName: customerName,
                documentTotals,
            },
            privateKey
        );
    } catch (e) {
        return { success: false, error: 'Erro na assinatura JWS: ' + e.message };
    }

    // ── 5. Payload final ─────────────────────────────────────────────────
    const submissionUUID = uuidV4();
    const payload = {
        schemaVersion: '1.2',
        submissionUUID,
        taxRegistrationNumber: taxId,
        submissionTimeStamp: timestampNow(),
        softwareInfo,
        numberOfEntries: 1,
        documents: [component],
    };

    // ── 6. Envio ─────────────────────────────────────────────────────────
    logger.debug({ payload }, 'A enviar documento à AGT.');
    const response = await httpPost(endpoint, payload, username, password);
    const httpSuccess = response.status >= 200 && response.status < 300;
    const requestId = response.data?.requestID ?? null;

    return {
        success: httpSuccess && !response.error && !!requestId,
        documentNo,
        submissionUUID,
        requestId,
        jwsDocumentSignature: component.jwsDocumentSignature,
        payload,
        response,
        error: response.error ?? (response.data?.errorList?.[0]?.descriptionError ?? response.data?.errorList?.[0] ?? null),
    };
}

module.exports = { criarFaturaAGT };