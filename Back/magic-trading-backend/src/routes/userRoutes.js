const express = require('express');

function createUserRoutes(userController, authenticateToken) {
    const router = express.Router();

    // Public routes
    router.get('/user/:username', (req, res, next) => userController.getUserProfile(req, res, next));
    router.get('/profile/:username', (req, res, next) => userController.getUserProfile(req, res, next));

    // Protected routes
    router.get('/user/profile/me', authenticateToken, (req, res, next) => userController.getMyProfile(req, res, next));
    router.get('/matches/:username', authenticateToken, (req, res, next) => userController.getMatches(req, res, next));
    router.get('/matches/:username/cards', authenticateToken, (req, res, next) => userController.getMatchingCards(req, res, next));

    // Card management routes
    router.post('/user/wants', authenticateToken, (req, res, next) => userController.addCardToWants(req, res, next));
    router.post('/user/sells', authenticateToken, (req, res, next) => userController.addCardToSells(req, res, next));
    router.put('/user/wants/:cardId', authenticateToken, (req, res, next) => userController.updateCardInWants(req, res, next));
    router.put('/user/sells/:cardId', authenticateToken, (req, res, next) => userController.updateCardInSells(req, res, next));
    router.delete('/user/wants/:cardId', authenticateToken, (req, res, next) => userController.removeCardFromWants(req, res, next));
    router.delete('/user/sells/:cardId', authenticateToken, (req, res, next) => userController.removeCardFromSells(req, res, next));

    return router;
}

module.exports = createUserRoutes;
