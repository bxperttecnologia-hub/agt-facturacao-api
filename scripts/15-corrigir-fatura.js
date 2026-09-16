"use strict";

// Testa POST /api/faturas/corrigir.
// Regista a correcção de um documento já submetido: reenvia o MESMO
// document_type (aqui FT) já com os valores corrigidos, referenciando o
// original via rejected_document_no + document_cancel_reason.
//
// ⚠️ document_status por omissão é 'R' — placeholder até confirmares o
// código oficial da AGT (ver comentário em src/agt/corrigirFaturaAgt.js).
// Podes sobrepor enviando "document_status" no corpo do pedido.
//
// IMPORTANTE: substitui DOCUMENTO_A_CORRIGIR pelo documentNo da factura
// original com o erro.
//
// Uso: node 15-corrigir-fatura.js

const { chamar, mostrarResposta, guardarEstado, credenciaisTeste } = require("./config");

const DOCUMENTO_A_CORRIGIR = "FT FT9526S9096N/0000000000000"; // <- substituir

(async () => {
  const docNo = `FT FT9526S9096N/${Date.now()}`;
  const hoje = new Date().toISOString().split("T")[0];

  const corpo = {
    ...credenciaisTeste(),
    document_type: "FT",
    document_no: docNo,
    document_date: hoje,
    customer_tax_id: "999999999",
    customer_name: "Consumidor Final",
    customer_country: "AO",
    // valores já corrigidos (ex.: preço/quantidade certos desta vez)
    net_total: 1200,
    tax_payable: 168,
    gross_total: 1368,
    rejected_document_no: DOCUMENTO_A_CORRIGIR,
    document_cancel_reason: "Valor da linha estava incorrecto no documento original",
    lines: [
      {
        product_code: "SERV001",
        product_description: "Serviço de teste (valor corrigido)",
        quantity: 1,
        unit_of_measure: "UN",
        unit_price: 1200,
        unit_price_base: 1200,
        credit_amount: 1200,
        tax_type: "IVA",
        tax_code: "NOR",
        tax_percentage: 14,
        tax_contribution: 168,
      },
    ],
  };

  console.log("== POST /api/faturas/corrigir ==");
  const resposta = await chamar("POST", "/api/faturas/corrigir", corpo);
  mostrarResposta(resposta);

  const requestId = resposta.body?.resultado?.requestId;
  if (requestId) guardarEstado("request_id", requestId);

  if (resposta.status === 200) {
    console.log(`OK: correcção aceite pela AGT (requestID=${requestId}).`);
  } else if (resposta.status === 502) {
    console.log(
      "AVISO: a API respondeu correctamente, mas a AGT recusou ou não respondeu (normal com NIF/chave de teste falsos).",
    );
  } else if (resposta.status === 400) {
    console.log("AVISO: 400 — verifica se DOCUMENTO_A_CORRIGIR/campos obrigatórios foram preenchidos.");
  } else {
    console.error(`FALHOU: código HTTP inesperado (${resposta.status}).`);
    process.exit(1);
  }
})();
