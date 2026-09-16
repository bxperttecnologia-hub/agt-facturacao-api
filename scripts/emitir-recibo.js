"use strict";

const { chamar, mostrarResposta, guardarEstado } = require("./config");

// IMPORTANTE:
// - <SERIE> tem de ser uma série pedida com document_type "RC"
//   (ver scripts/02.2-solicitar-serie-recibo.js). Uma série FT não serve
//   para emitir RC — a AGT devolve o erro E32 "Código de série mal
//   construído".
// - <DOCUMENTO_ORIGINAL> tem de ser o número COMPLETO da factura original
//   tal como foi aceite pela AGT, no formato "TIPO SÉRIE/NÚMERO" — com o
//   tipo do documento original e um espaço antes da série (ex:
//   "FT FT9526S9439N/1786110133573"). Passar só a parte numérica, ou
//   omitir o "FT ", faz a AGT devolver o erro E99 "documento de origem
//   não encontrado".
//
// Exemplo:
// node 11-emitir-recibo.js RC9526S9096N "FT FT9526S9439N/1786110133573"

const serie = process.argv[2];

const documentoOriginal = process.argv[3];

if (!serie) {
  console.error(
    "Uso: node 11-emitir-recibo.js <SERIE_RC> <DOCUMENTO_ORIGINAL_COMPLETO>",
  );

  process.exit(1);
}

if (!documentoOriginal) {
  console.error(
    "Informe o documento original da factura (formato SÉRIE/NÚMERO).",
  );

  process.exit(1);
}

if (
  !documentoOriginal.includes("/") ||
  !/^[A-Z]{2}\s/.test(documentoOriginal)
) {
  console.error(
    `ERRO: "${documentoOriginal}" não parece estar no formato completo esperado pela AGT.\n` +
      `Formato correcto: "TIPO SÉRIE/NÚMERO" (ex: "FT FT9526S9439N/1786110133573"),\n` +
      `senão a AGT devolve o erro E99 "documento de origem não encontrado".`,
  );

  process.exit(1);
}

// Documento original que será regularizado — número completo (série/número)
const DOCUMENTO_ORIGINAL_NO = documentoOriginal;

const DOCUMENTO_ORIGINAL_DATA = new Date().toISOString().split("T")[0];

const VALOR_ORIGINAL_NET = 1000;

const VALOR_ORIGINAL_IMPOSTO = 140;

const VALOR_ORIGINAL_BRUTO = 1140;

(async () => {
  /**
   * Número do recibo — leva o prefixo "RC " antes da série, tal como a
   * AGT exige (confirmado pelo exemplo real: "RC RC1122S3N/1").
   *
   * Exemplo:
   *
   * RC9526S9096N/1754480000000
   */
  const docNo = `RC ${serie}/${Date.now()}`;

  const hoje = new Date().toISOString().split("T")[0];

  const corpo = {
    tax_id: "5002455595",

    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2PHiAx+tMYiI1
n+2htCGANMjjS6BQ6Pis2aWa1SgzxN/hWYWaJ3gGOmGNBwcK2QLGmFLsh864ZdKL
lOhdw4w2kDKOTHhXJwii+oWBZZ7KwuvIwD9jmDYoAyJISIUHdKC3l7s5HxV//F8R
dClxHE4APYFtum8f148YcKlkSDy/6cP92umK06a2JKkC6ipzUMJO724lBQaeOsQS
so4nQNJ1tp2owKTYsM2Vi8tJfDiKt09pWANsTzMb9Gfu0ldSfVJ5MkVipEImA7iD
ERu5Jz1V5PYWvAfmsJ4axyVolqTm4bmq5SZOBcUZG9ak/uEwGiGfyfPL/jYBu8F5
SMG8zfbdAgMBAAECggEALNUlpDEKzyjZV633rS9+imbyAREq6JzYCNYmqrfEAzBt
D6iReMI7AfU86JARCHco+qigxfYHQlAygwpoPCEOjqHc/isL9AzzT/0n+RSCA0n+
7c12Cs94i1FyDqxgpdvoaiJW+g+On4T78nRMebpH6kE3ZUJXclL6rj2RPs2SvHef
cEOC2LCFx7mkKlduMKB9LZtpzbAOKd9X4otlXSoTIIKutDRtrGHusSdLfHdqxuSm
U7jI+NkCzmRFXX/NUUYcOVtSglYLia+KCk7JY4Ml6ctr3Dn9yWTgs3N7ZySZEPky
TprzLHkykVMgQE3FAh46eJNULw10CQ0BA3V9cxGa4QKBgQC2xhd+GGghpm/+bZPQ
nrdMXt7O3Z+FKF3fndzelSKT2tpo+EsrV98KOPntvsDx2bVdp0jLSZcDAGmI3aF8
ji7t9U9mPMxFF+xpl6uIc8yK9TSrygVHsZbboTHfHiFG7JtFX09G2ELkUQ2vXB/+
Q+cyziBGrFgRosM8C/oCccStdQKBgQD/Pz4fZ4GI9qC1onmLOc9/FPjEWi6uebqh
tRKIEs1HP8V/ON05FuNWvUAx68t/4PvkMUA5NIz5QkBsbp0tQGKxTzHNk40sdHiE
ckxp31R7VGzxBgskT8v43hZpg5poMac94nw7yJMd1vgzdMnoHdRi48xv2DhMDs1t
bZXdsMPuyQKBgHjnILMwwfFAf+T150mhM+848no08EjNIwvBCVHTpUPZCZFWbaMG
RWwltG4oOMnDEc4Z0nVnAJXjt+vpb+FMzI5sL1GZ9iXeZWyT/8wLjcp92ZGp2URL
nVc7khndfHXGHhANtAtREy6kz0Co2CECGfXplEAr0TYZTLxzz7W+PDPhAoGBAJJc
5XaEl9a99XGx9RhM0hsBH5UYUWRjEQ3hEvtMLMIKY2mMZe5ynXIDm2gE2fA+RrKX
O0iSRbQ4tVB4LVDhdrZNvzUuwukW8HSiRgb/tSXzR3T+Di2IRGI0l41xlXzh3BC0
aqCtZw7ZUgHPmmerkzoRfg00YzPZ2RpCmIlC71dhAoGALwIlQX0GOED3WLum0KGi
Rsde6xik6ojjvi/KgfPlTNeLa46dW3c0i2T9Q+oPmsb6N+htn+n2aTSsr6VYal/G
CcTK+B8o8IgSLZ/x59pWaiXNmzluXJv4nC1VRUq29pYfv8LrRfYhtnfC2SUYSHHN
pGFqAAjJzr2Xyxwx802z2Dw=
-----END PRIVATE KEY-----`,

    nome_empresa: "Empresa de Teste, Lda",

    test: true,

    document_type: "RC",

    document_no: docNo,

    document_date: hoje,

    customer_tax_id: "999999999",

    customer_name: "Consumidor Final",

    customer_country: "AO",

    net_total: 1000,

    tax_payable: 140,

    gross_total: 1140,

    lines: [],

    payment_receipt: {
      source_documents: [
        {
          line_no: "1",

          source_document_id: {
            originating_on: DOCUMENTO_ORIGINAL_NO,

            document_date: DOCUMENTO_ORIGINAL_DATA,
          },

          debit_amount: "0",

          credit_amount: "1000",
        },
      ],
    },
  };

  console.log("--------------------------------");
  console.log("POST /api/faturas (RC)");
  console.log("--------------------------------");

  console.log("Série:", serie);

  console.log("Recibo:", docNo);

  console.log("Factura origem:", DOCUMENTO_ORIGINAL_NO);

  const resposta = await chamar("POST", "/api/faturas", corpo);

  mostrarResposta(resposta);

  const requestId = resposta.body?.resultado?.requestId;

  if (requestId) {
    guardarEstado("request_id", requestId);

    console.log("RequestID guardado:", requestId);
  }

  if (resposta.status === 200) {
    console.log(`OK: RC aceite pela AGT (requestID=${requestId}).`);
  } else if (resposta.status === 502) {
    console.log(
      "AVISO: O proxy respondeu, mas a AGT recusou ou não respondeu.",
    );
  } else {
    console.error(`FALHOU: código HTTP inesperado (${resposta.status}).`);

    process.exit(1);
  }
})();
