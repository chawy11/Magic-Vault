const { ObjectId } = require('mongodb');

class TransactionService {
    constructor(transactionRepository, userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    async getMyTransactions(userId) {
        return await this.transactionRepository.findByUser(userId);
    }

    async createTransaction(buyerId, sellerId, buyerWants, sellerWants) {
        // Get user information
        const buyer = await this.userRepository.findById(buyerId);
        const seller = await this.userRepository.findById(sellerId);

        if (!buyer || !seller) {
            const error = new Error('Usuario no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Create transaction
        const result = await this.transactionRepository.create({
            buyerId: new ObjectId(buyerId),
            sellerId: new ObjectId(sellerId),
            buyerUsername: buyer.usuario,
            sellerUsername: seller.usuario,
            buyerWants: buyerWants || [],
            sellerWants: sellerWants || [],
            buyerConfirmed: false,
            sellerConfirmed: false,
            status: 'pending',
            createdAt: new Date()
        });

        // Mark cards as in transaction
        if (buyerWants && buyerWants.length > 0) {
            for (const card of buyerWants) {
                await this.userRepository.markCardInTransaction(sellerId, card.cardId, false);
            }
        }

        if (sellerWants && sellerWants.length > 0) {
            for (const card of sellerWants) {
                await this.userRepository.markCardInTransaction(buyerId, card.cardId, false);
            }
        }

        return {
            message: 'Transacción creada correctamente',
            transactionId: result.insertedId
        };
    }

    async confirmTransaction(transactionId, userId) {
        const transaction = await this.transactionRepository.findByIdAndUser(transactionId, userId);

        if (!transaction) {
            const error = new Error('Transacción no encontrada');
            error.statusCode = 404;
            throw error;
        }

        // Determine if user is buyer or seller
        const isBuyer = transaction.buyerId.toString() === userId;
        const updateField = isBuyer ? 'buyerConfirmed' : 'sellerConfirmed';

        // Update confirmation status
        await this.transactionRepository.updateConfirmation(transactionId, updateField, true);

        // Get updated transaction
        const updatedTransaction = await this.transactionRepository.findById(transactionId);

        // If both confirmed, complete the transaction
        if (updatedTransaction.buyerConfirmed && updatedTransaction.sellerConfirmed) {
            await this.transactionRepository.updateStatus(transactionId, 'completed');
            await this._processCompletedTransaction(updatedTransaction);
        }

        return {
            message: 'Confirmación registrada',
            transactionCompleted: (updatedTransaction.buyerConfirmed && updatedTransaction.sellerConfirmed)
        };
    }

    async _processCompletedTransaction(transaction) {
        // Remove cards that buyer receives from seller's sell list
        if (transaction.buyerWants && transaction.buyerWants.length > 0) {
            for (const card of transaction.buyerWants) {
                await this.userRepository.removeCardsByIdFromSells(transaction.sellerId, card.cardId);
                await this.userRepository.removeCardsByName(transaction.buyerId, card.cardName, true);
            }
        }

        // Remove cards that seller receives from buyer's sell list
        if (transaction.sellerWants && transaction.sellerWants.length > 0) {
            for (const card of transaction.sellerWants) {
                await this.userRepository.removeCardsByIdFromSells(transaction.buyerId, card.cardId);
                await this.userRepository.removeCardsByName(transaction.sellerId, card.cardName, true);
            }
        }
    }

    async addReview(transactionId, userId, rating, comment) {
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            const error = new Error('La valoración debe ser un número entre 1 y 5');
            error.statusCode = 400;
            throw error;
        }

        // Find transaction
        const transaction = await this.transactionRepository.findByIdAndUser(transactionId, userId);

        if (!transaction || transaction.status !== 'completed') {
            const error = new Error('Transacción no encontrada o no completada');
            error.statusCode = 404;
            throw error;
        }

        // Determine if user is buyer or seller
        const isBuyer = transaction.buyerId.toString() === userId;
        const reviewField = isBuyer ? 'buyerReview' : 'sellerReview';

        // Check if review already exists
        if (transaction[reviewField]) {
            const error = new Error('Ya has dejado una reseña para esta transacción');
            error.statusCode = 400;
            throw error;
        }

        // Add review
        await this.transactionRepository.addReview(transactionId, reviewField, {
            rating,
            comment,
            date: new Date()
        });

        // Check if both reviews are complete
        const updatedTransaction = await this.transactionRepository.findById(transactionId);
        if (updatedTransaction.buyerReview && updatedTransaction.sellerReview) {
            await this.transactionRepository.markReviewsCompleted(transactionId);
        }

        return { message: 'Reseña guardada correctamente' };
    }

    async getUserReviews(userId) {
        // Get reviews as seller
        const sellerReviews = await this.transactionRepository.findCompletedByUser(userId, 'buyer');
        
        // Get reviews as buyer
        const buyerReviews = await this.transactionRepository.findCompletedByUser(userId, 'seller');

        const reviews = [];

        // Add reviews received as seller
        for (const tx of sellerReviews) {
            if (tx.buyerReview) {
                reviews.push({
                    fromUsername: tx.buyerUsername,
                    rating: tx.buyerReview.rating,
                    comment: tx.buyerReview.comment,
                    date: tx.buyerReview.date,
                    cards: tx.buyerWants || []
                });
            }
        }

        // Add reviews received as buyer
        for (const tx of buyerReviews) {
            if (tx.sellerReview) {
                reviews.push({
                    fromUsername: tx.sellerUsername,
                    rating: tx.sellerReview.rating,
                    comment: tx.sellerReview.comment,
                    date: tx.sellerReview.date,
                    cards: tx.sellerWants || []
                });
            }
        }

        return reviews;
    }
}

module.exports = TransactionService;
