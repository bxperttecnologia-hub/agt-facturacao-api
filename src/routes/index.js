"use strict";

const { Router } = require("express");
const seriesRoutes = require("./series.routes");
const faturasRoutes = require("./faturas.routes");
const logsRoutes = require("./logs.routes");
const nifRoutes = require("./nif.routes");

const router = Router();

router.use("/series", seriesRoutes);
router.use("/faturas", faturasRoutes);
router.use("/logs", logsRoutes);
router.use("/nif", nifRoutes.consultarNif);

module.exports = router;
