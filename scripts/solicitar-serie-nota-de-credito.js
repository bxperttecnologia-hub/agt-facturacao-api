"use strict";

// Testa POST /api/series. Esta chamada fala mesmo com o ambiente de testes
// da AGT, por isso um HTTP 502 aqui não significa que a tua API esteja mal
// — normalmente significa que a AGT rejeitou o NIF/chave de teste falsos.
// O que este script confirma é que o pedido chega bem formado, assinado,
// até à AGT, e que ficou registado em /api/logs.
// Uso: node 02-solicitar-serie.js

const { chamar, mostrarResposta, credenciaisTeste } = require("./config");

(async () => {
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
    document_type: "NC",
    establishment: "SEDE",
    year: 2026,
    contingency_indicator: "N",
  };

  console.log("== POST /api/series ==");
  const resposta = await chamar("POST", "/api/series", corpo);
  mostrarResposta(resposta);

  if (resposta.status === 200) {
    console.log("OK: série aprovada pela AGT.");
  } else if (resposta.status === 502) {
    console.log(
      "AVISO: a API respondeu correctamente, mas a AGT recusou ou não respondeu (normal com NIF/chave de teste falsos).",
    );
  } else {
    console.error(`FALHOU: código HTTP inesperado (${resposta.status}).`);
    process.exit(1);
  }
})();
