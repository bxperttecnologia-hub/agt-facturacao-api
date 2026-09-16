'use strict';

const { Router } = require('express');
const seriesRoutes = require('./series.routes');
const faturasRoutes = require('./faturas.routes');
const logsRoutes = require('./logs.routes');

const router = Router();

router.use('/series', seriesRoutes);
router.use('/faturas', faturasRoutes);
router.use('/logs', logsRoutes);

module.exports = router;
