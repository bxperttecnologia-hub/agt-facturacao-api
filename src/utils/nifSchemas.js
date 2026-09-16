"use strict";

const { z } = require("zod");

/**
 * Schema de validação para a consulta de NIF
 * Query params: numeroDocumento (obrigatório), tipoDocumento (opcional)
 */
const nifQuerySchema = z.object({
  numeroDocumento: z.string().min(1, "numeroDocumento é obrigatório"),
  tipoDocumento: z.string().optional().nullable(),
});

module.exports = { nifQuerySchema };
