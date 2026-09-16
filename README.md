# AGT Facturação — Proxy API

API Express que funciona como **proxy** entre os teus sistemas internos e a
Facturação Electrónica da AGT (Angola): recebe um pedido já com os dados da
empresa e as credenciais, assina, reencaminha para a AGT, devolve a resposta
tal como veio — e guarda um **log** de cada pedido (para auditoria/rastreio),
nunca como cadastro de controlo.

## Arquitectura (importante)

Esta API **não tem CRUD de empresas** nem exige que uma empresa esteja
previamente registada. Cada pedido a `/api/series`, `/api/faturas` ou
`/api/faturas/estado` já vem com tudo o que é preciso: NIF, chave privada,
credenciais e os dados do documento. A API:

1. Valida o pedido.
2. Assina e envia à AGT (`src/agt/*.js`).
3. Grava um registo em `agt_logs` — NIF, tipo de pedido, o payload enviado e
   a resposta da AGT — só para consulta/auditoria, nunca a chave privada ou
   a password (essas só existem em memória durante a chamada).
4. Devolve ao chamador a resposta da AGT.

Não há tabela de "empresas", nem `empresa_id`, nem passo de "criar empresa"
antes de poderes emitir uma série ou uma factura.

## Estrutura

```
src/
├── server.js
├── config/env.js
├── db/
│   ├── db.js
│   ├── migrate.js
│   └── schema.mysql.sql        (uma única tabela: agt_logs)
├── agt/                         (integração com a AGT — assinatura JWS, HTTP)
│   ├── agtConfig.js, agtUtils.js
│   ├── criarSerieAgt.js, criarFaturaAgt.js, consultarEstadoAgt.js
├── middlewares/                 (auth por x-api-key, rate limit, validação, erros)
├── utils/                       (ApiError, asyncHandler, logger, schemas Zod)
├── services/
│   └── logs.service.js          (grava/lê o log de pedidos — só isso)
├── controllers/
│   ├── series.controller.js
│   ├── faturas.controller.js
│   └── logs.controller.js
└── routes/
    ├── series.routes.js, faturas.routes.js, logs.routes.js, index.js
```

`legacy-sqlite-nao-usado/` mantém os ficheiros originais em SQLite, não
usados por esta arquitectura (ver histórico do projecto).

## Como correr no teu computador

1. `npm install`
2. `cp .env.example .env` e preenche `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
   `API_KEY` e as credenciais AGT (não precisas de chave de cifragem — já
   não guardamos segredos). **Gera uma `API_KEY` nova** (`openssl rand -base64 32`)
   — não uses valores de exemplo.
3. Garante um MySQL a correr e acessível com essas credenciais.
4. `npm run db:migrate`
5. `npm start` (ou `npm run dev`)

A API fica em `http://localhost:3000`. Todas as rotas `/api/...` exigem o
cabeçalho `x-api-key`.

## Documentação interactiva (Swagger/OpenAPI)

Com a API a correr:
- `GET /api-docs` — interface Swagger UI (testa os endpoints no browser).
- `GET /api-docs.json` — especificação OpenAPI 3.0 em JSON puro (podes
  importar isto directamente no Postman/Insomnia em vez da coleção abaixo).

## Coleção Postman

Na raiz do projecto: `postman_collection.json` (todos os endpoints, com
exemplos de corpo) e `postman_environment.json` (`base_url` + `api_key`).
No Postman: *Import* → escolhe os dois ficheiros → selecciona o
environment "AGT Facturação — Local" → ajusta `api_key` para a tua.

## Testes automatizados

```bash
npm test          # corre a suite Jest + Supertest uma vez
npm run test:watch
```

25 testes em `src/tests/`, cobrindo autenticação (`x-api-key`), validação
(Zod) de todas as rotas, o fluxo completo de série/factura/nota de crédito/
nota de débito/anulação/correcção/estado (sucesso e falha da AGT), listagem
e consulta de logs, 404 e erros 500 genéricos (sem vazar detalhes internos).
Não precisam de MySQL nem de rede: mockam `src/db/db.js` e `src/agt/*.js`.

## Notas de arquitectura confirmadas (não são bugs)

- **Credenciais Basic Auth da AGT vêm sempre do `.env`** (por ambiente:
  `AGT_TEST_*` / `AGT_PROD_*`), nunca do corpo do pedido — mesmo que o
  pedido inclua `username`/`password` (aceites pelo schema só por
  compatibilidade, mas ignorados). Decisão confirmada, documentada
  directamente em `src/agt/criarSerieAgt.js`, `criarFaturaAgt.js` e
  `consultarEstadoAgt.js`.
- **`document_status` da rota `/api/faturas/corrigir`** usa por omissão o
  valor de `CORRECTION_DOCUMENT_STATUS` no `.env` (por omissão `'R'`) — não
  está confirmado contra a carta de códigos oficial da AGT. Podes
  sobrepor globalmente via `.env` ou por pedido enviando `document_status`.

## Endpoints

### `POST /api/series`
Solicita uma série de numeração à AGT.
```jsonc
{
  "tax_id": "5000000000",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----...",
  "username": "utilizador",
  "password": "password",
  "document_type": "FT",
  "establishment": "SEDE",
  "year": 2026,
  "contingency_indicator": "N",
  "test": true,
  "nome_empresa": "Empresa Exemplo, Lda"   // opcional, só para o log
}
```

### `POST /api/faturas`
Regista uma Factura (`FT`), Factura-Recibo (`FR`), Nota de Crédito (`NC`),
Nota de Débito (`ND`) ou Recibo (`RC`) — o tipo escolhe-se por `document_type`.
```jsonc
{
  "tax_id": "5000000000",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----...",
  "username": "utilizador",
  "password": "password",
  "document_type": "FT",
  "document_no": "FT SEDE/1",
  "customer_tax_id": "999999999",
  "net_total": 1000,
  "tax_payable": 140,
  "gross_total": 1140,
  "test": true,
  "lines": [
    { "product_code": "SERV001", "product_description": "Serviço", "quantity": 1,
      "unit_price": 1000, "tax_percentage": 14, "tax_contribution": 140 }
  ]
}
```

### `POST /api/faturas/nota-credito`
Atalho dedicado para Nota de Crédito — não precisas de enviar
`document_type` (o servidor força `NC`). `reference` (nº do documento
original) e `reason` são obrigatórios. As linhas usam `debit_amount` em vez
de `credit_amount` (regra E16 da AGT).
```jsonc
{
  "tax_id": "5000000000", "private_key": "...", "test": true,
  "document_no": "NC SEDE/1",
  "reference": "FT SEDE/1",
  "reason": "Correcção de factura emitida com erro",
  "net_total": 1000, "tax_payable": 140, "gross_total": 1140,
  "lines": [
    { "product_code": "SERV001", "product_description": "Serviço", "quantity": 1,
      "unit_price": 1000, "debit_amount": 1000, "tax_percentage": 14, "tax_contribution": 140 }
  ]
}
```

### `POST /api/faturas/nota-debito`
Atalho dedicado para Nota de Débito — não precisas de enviar
`document_type` (o servidor força `ND`). Mesmo formato de `lines` que uma
factura normal (`credit_amount`); `reference`/`reason` são opcionais.

### `POST /api/faturas/anular`
Anula um documento já submetido: reenvia-o (mesmo `document_type`, mesmas
`lines`/totais) marcado com `document_status = "A"` (forçado pelo
servidor). Exige `rejected_document_no` (nº do documento original) e
`document_cancel_reason` (motivo).

### `POST /api/faturas/corrigir`
Regista a correcção de um documento já submetido: reenvia-o com os valores
já corrigidos, referenciando o original via `rejected_document_no` e
`document_cancel_reason`. `document_status` tem um valor por omissão (ver
`src/agt/corrigirFaturaAgt.js` — ainda por confirmar contra a carta de
códigos oficial da AGT); podes sobrepor enviando `document_status` no pedido.

### `POST /api/faturas/estado`
Consulta o estado de uma factura já submetida (é `POST`, não `GET`, porque
precisa de levar a chave privada para assinar a consulta).
```jsonc
{
  "tax_id": "5000000000",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----...",
  "username": "utilizador",
  "password": "password",
  "requestID": "o-requestID-devolvido-por-POST-/api/faturas",
  "test": true
}
```

### `GET /api/logs?nif=&tipo=&document_no=&request_id=&limit=`
Consulta o histórico de pedidos feitos à AGT (auditoria).

### `GET /api/logs/:id`
Detalhe de um pedido específico (payload enviado + resposta da AGT).

### `GET /health`
Verificação de estado, sem autenticação.
