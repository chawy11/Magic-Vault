class TransactionController {
    constructor(transactionService) {
        this.transactionService = transactionService;
    }

    async getMyTransactions(req, res, next) {
        try {
            const userId = req.user.id;
            const transactions = await this.transactionService.getMyTransactions(userId);
            res.status(200).json(transactions);
        } catch (error) {
            next(error);
        }
    }

    async createTransaction(req, res, next) {
        try {
            const { sellerId, buyerWants, sellerWants } = req.body;
            const buyerId = req.user.id;
            const result = await this.transactionService.createTransaction(
                buyerId,
                sellerId,
                buyerWants,
                sellerWants
            );
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async confirmTransaction(req, res, next) {
        try {
            const transactionId = req.params.id;
            const userId = req.user.id;
            const result = await this.transactionService.confirmTransaction(transactionId, userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async addReview(req, res, next) {
        try {
            const transactionId = req.params.id;
            const userId = req.user.id;
            const { rating, comment } = req.body;
            const result = await this.transactionService.addReview(
                transactionId,
                userId,
                rating,
                comment
            );
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getUserReviews(req, res, next) {
        try {
            // Use consistent 'id' property from JWT token payload
            const userId = req.user.id;
            const reviews = await this.transactionService.getUserReviews(userId);
            res.status(200).json(reviews);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TransactionController;
