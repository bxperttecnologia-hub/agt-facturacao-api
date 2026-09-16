'use strict';

module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/src/tests/setupEnv.js'],
    testMatch: ['**/src/tests/**/*.test.js'],
    verbose: true,
    // Um teste por ficheiro corre a sua própria instância da app; não há
    // estado partilhado nem porta aberta (usamos supertest(app), não
    // app.listen), por isso é seguro correr em paralelo.
};
