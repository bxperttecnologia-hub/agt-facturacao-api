'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Cria um middleware que valida req.body contra um schema Zod.
 * Em caso de falha devolve 400 com a lista de problemas — nunca deixa
 * dados mal formados chegar aos services que falam com a AGT.
 */
function validateBody(schema) {
    return function (req, res, next) {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues.map((i) => ({
                campo: i.path.join('.'),
                mensagem: i.message,
            }));
            return next(ApiError.badRequest('Dados de entrada inválidos.', issues));
        }
        req.body = result.data;
        next();
    };
}

module.exports = { validateBody };
