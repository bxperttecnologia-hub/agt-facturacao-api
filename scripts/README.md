# Scripts de teste (Node.js)

Cada script testa **uma funcionalidade** do proxy usando o `fetch` nativo do
Node. Não há passo de "criar empresa": cada pedido já leva o NIF e a chave
consigo, tal como a API real vai receber dos teus sistemas. Um
`.state.json` (criado automaticamente) guarda o `request_id` devolvido pelo
registo da factura, para o script de consulta de estado o poder reutilizar.

| Script | O que testa |
|---|---|
| `01-health.js` | `GET /health` — o servidor está vivo |
| `02-solicitar-serie.js` | `POST /api/series` — pede uma série à AGT |
| `03-registar-fatura.js` | `POST /api/faturas` — submete uma factura à AGT |
| `04-consultar-estado-fatura.js` | `POST /api/faturas/estado` — consulta o estado na AGT |
| `05-listar-logs.js` | `GET /api/logs` — confirma que os pedidos ficaram registados |
| `06-obter-log.js` | `GET /api/logs/:id` — detalhe de um pedido registado |
| `executar-todos.js` | corre os 6 acima em sequência |

## Como usar

```bash
cd scripts

export BASE_URL="http://localhost:3000"   # opcional, é o valor por omissão
export API_KEY="a-tua-api-key-do-.env"

node executar-todos.js
# ou, um de cada vez:
node 01-health.js
node 02-solicitar-serie.js
```

## Nota sobre os testes que falam com a AGT (02, 03, 04)

`config.js` gera um NIF e uma chave privada fictícios (`credenciaisTeste()`)
só para os scripts terem algo para enviar. Isso é suficiente para confirmar
que a tua API valida, assina e reencaminha o pedido correctamente — mas a
AGT real vai recusar essas credenciais falsas, normalmente com `HTTP 502`.
Os scripts tratam isso como **aviso**, não como falha. Para testares o fluxo
completo com sucesso, edita `credenciaisTeste()` em `config.js` e usa as
tuas credenciais reais de homologação da AGT.
