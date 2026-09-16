'use strict';

/**
 * Evita ter de repetir try/catch em cada controller assíncrono.
 * Qualquer rejeição da promise é passada ao errorHandler central.
 */
function asyncHandler(fn) {
    return function wrapped(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
