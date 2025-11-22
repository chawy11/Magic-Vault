const express = require('express');

function createAuthRoutes(authController) {
    const router = express.Router();

    router.post('/registro', (req, res, next) => authController.register(req, res, next));
    router.post('/login', (req, res, next) => authController.login(req, res, next));

    return router;
}

module.exports = createAuthRoutes;
