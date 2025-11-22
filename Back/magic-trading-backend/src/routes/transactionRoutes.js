const express = require('express');

function createTransactionRoutes(transactionController, authenticateToken) {
    const router = express.Router();

    router.get('/transactions', authenticateToken, (req, res, next) => transactionController.getMyTransactions(req, res, next));
    router.post('/transaction/create', authenticateToken, (req, res, next) => transactionController.createTransaction(req, res, next));
    router.put('/transaction/:id/confirm', authenticateToken, (req, res, next) => transactionController.confirmTransaction(req, res, next));
    router.post('/transaction/:id/review', authenticateToken, (req, res, next) => transactionController.addReview(req, res, next));
    router.get('/user/reviews', authenticateToken, (req, res, next) => transactionController.getUserReviews(req, res, next));

    return router;
}

module.exports = createTransactionRoutes;
