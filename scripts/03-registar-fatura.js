"use strict";

// Testa POST /api/faturas.
// Uso:
// node 03-registar-fatura.js <SERIE>
//
// Exemplo:
// node 03-registar-fatura.js FT9526S9362N

const {
  chamar,
  mostrarResposta,
  guardarEstado,
  credenciaisTeste,
} = require("./config");

// Obtém a série passada na linha de comandos
const serie = process.argv[2];

if (!serie) {
  console.error("Uso: node 03-registar-fatura.js <SERIE>");
  process.exit(1);
}

(async () => {
  // Gera um número único para evitar duplicações
  const docNo = `FT ${serie}/${Date.now()}`;
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
    document_type: "FT",
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
        product_description: "Serviço de teste",
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

  console.log(`Série: ${serie}`);
  console.log(`Documento: ${docNo}`);
  console.log("== POST /api/faturas ==");

  const resposta = await chamar("POST", "/api/faturas", corpo);

  mostrarResposta(resposta);

  const requestId = resposta.body?.resultado?.requestId;

  if (requestId) {
    guardarEstado("request_id", requestId);
  }

  if (resposta.status === 200) {
    console.log(`OK: factura aceite pela AGT (requestID=${requestId}).`);
  } else if (resposta.status === 502) {
    console.log(
      "AVISO: a API respondeu correctamente, mas a AGT recusou ou não respondeu (normal com NIF/chave de teste falsos).",
    );
  } else {
    console.error(`FALHOU: código HTTP inesperado (${resposta.status}).`);
    process.exit(1);
  }
})();
