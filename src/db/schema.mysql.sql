-- ═══════════════════════════════════════════════════════════════════════
--  Base de dados — Proxy de Facturação Electrónica AGT (MySQL)
--
--  Esta API não é dona de dados de empresas: cada pedido traz consigo o
--  NIF e a chave privada de quem está a emitir, a API assina e reencaminha
--  para a AGT, e devolve a resposta tal como veio. A única coisa que
--  guardamos é um LOG de cada pedido feito (para auditoria/rastreio), não
--  um cadastro de controlo. Nunca gravamos chave privada nem password.
-- ═══════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS `agt_facturacao`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `agt_facturacao`;

SET NAMES utf8mb4;

-- ── Log de todos os pedidos feitos à AGT através deste proxy ───────────
CREATE TABLE IF NOT EXISTS agt_logs (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- que operação foi pedida ao proxy
    tipo                ENUM('SERIE', 'FATURA', 'ESTADO') NOT NULL,
    ambiente            ENUM('test', 'production') NOT NULL DEFAULT 'test',

    -- identificação da empresa encontrada no próprio pedido (não é FK —
    -- não existe tabela de empresas, isto é só o que veio no request)
    nif                 VARCHAR(20)   NOT NULL,
    nome_empresa        VARCHAR(255)  NULL,

    -- campos úteis para pesquisa, extraídos do pedido/resposta
    document_type       VARCHAR(2)    NULL,
    document_no         VARCHAR(60)   NULL,
    establishment       VARCHAR(50)   NULL,
    submission_uuid     VARCHAR(36)   NULL,
    request_id          VARCHAR(100)  NULL,

    -- resultado
    sucesso             TINYINT(1)    NOT NULL DEFAULT 0,
    http_status_agt     SMALLINT      NULL,
    mensagem_erro       TEXT          NULL,

    -- payloads completos (nunca incluem chave privada nem password —
    -- ver src/agt/*.js: essas credenciais só existem em memória durante
    -- a chamada e nunca fazem parte do payload devolvido para log)
    request_payload     JSON          NULL,
    response_payload    JSON          NULL,

    criado_em           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    KEY idx_logs_tipo (tipo),
    KEY idx_logs_nif (nif),
    KEY idx_logs_document_no (document_no),
    KEY idx_logs_request_id (request_id),
    KEY idx_logs_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
