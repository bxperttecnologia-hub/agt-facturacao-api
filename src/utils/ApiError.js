'use strict';

/**
 * Erro com código HTTP explícito, para que o errorHandler central saiba
 * que resposta devolver (em vez de tudo cair em 500).
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }

    static notFound(message = 'Recurso não encontrado.') {
        return new ApiError(404, message);
    }

    static conflict(message) {
        return new ApiError(409, message);
    }

    static unauthorized(message = 'Não autorizado.') {
        return new ApiError(401, message);
    }

    static badGateway(message = 'Falha na comunicação com a AGT.', details) {
        return new ApiError(502, message, details);
    }
}

module.exports = ApiError;
