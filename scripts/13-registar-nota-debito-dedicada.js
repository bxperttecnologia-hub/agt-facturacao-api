"use strict";

// Testa POST /api/faturas/nota-debito (endpoint dedicado — força
// document_type="ND" no servidor). Corrige o bug em que o endpoint genérico
// /api/faturas rejeitava "ND" antes mesmo de chegar à AGT (ver
// src/agt/criarFaturaAgt.js) — o script antigo 08-registar-nota-debito.js
// falhava sempre por causa disso.
//
// Uso: node 13-registar-nota-debito-dedicada.js

const { chamar, mostrarResposta, guardarEstado, credenciaisTeste } = require("./config");

(async () => {
  const docNo = `ND ND9526S9096N/${Date.now()}`;
  const hoje = new Date().toISOString().split("T")[0];

  const corpo = {
    ...credenciaisTeste(),
    document_no: docNo,
    document_date: hoje,
    customer_tax_id: "999999999",
    customer_name: "Consumidor Final",
    customer_country: "AO",
    net_total: 1000,
    tax_payable: 140,
    gross_total: 1140,
    lines: [
      {
        product_code: "SERV001",
        product_description: "Encargo adicional de teste",
        quantity: 1,
        unit_of_measure: "UN",
        unit_price: 1000,
        unit_price_base: 1000,
        credit_amount: 1000,
        tax_type: "IVA",
        tax_code: "NOR",
        tax_percentage: 14,
        tax_contribution: 140,
      },
    ],
  };

  console.log("== POST /api/faturas/nota-debito ==");
  const resposta = await chamar("POST", "/api/faturas/nota-debito", corpo);
  mostrarResposta(resposta);

  const requestId = resposta.body?.resultado?.requestId;
  if (requestId) guardarEstado("request_id", requestId);

  if (resposta.status === 200) {
    console.log(`OK: ND aceite pela AGT (requestID=${requestId}).`);
  } else if (resposta.status === 502) {
    console.log(
      "AVISO: a API respondeu correctamente, mas a AGT recusou ou não respondeu (normal com NIF/chave de teste falsos).",
    );
  } else {
    console.error(`FALHOU: código HTTP inesperado (${resposta.status}).`);
    process.exit(1);
  }
})();
