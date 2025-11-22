const { ObjectId } = require('mongodb');

class TransactionRepository {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('transactions');
    }

    async create(transactionData) {
        return await this.collection.insertOne(transactionData);
    }

    async findByUser(userId) {
        return await this.collection.find({
            $or: [
                { buyerId: new ObjectId(userId) },
                { sellerId: new ObjectId(userId) }
            ]
        }).sort({ createdAt: -1 }).toArray();
    }

    async findById(transactionId) {
        return await this.collection.findOne({ _id: new ObjectId(transactionId) });
    }

    async findByIdAndUser(transactionId, userId) {
        return await this.collection.findOne({
            _id: new ObjectId(transactionId),
            $or: [
                { buyerId: new ObjectId(userId) },
                { sellerId: new ObjectId(userId) }
            ]
        });
    }

    async updateConfirmation(transactionId, field, value) {
        return await this.collection.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: { [field]: value } }
        );
    }

    async updateStatus(transactionId, status) {
        return await this.collection.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: { status, completedAt: new Date() } }
        );
    }

    async addReview(transactionId, reviewField, reviewData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: { [reviewField]: reviewData } }
        );
    }

    async markReviewsCompleted(transactionId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: { reviewsCompleted: true } }
        );
    }

    async findCompletedByUser(userId, reviewExists) {
        const query = {
            status: 'completed'
        };

        if (reviewExists === 'buyer') {
            query.sellerId = userId;
            query.buyerReview = { $exists: true };
        } else if (reviewExists === 'seller') {
            query.buyerId = userId;
            query.sellerReview = { $exists: true };
        }

        return await this.collection.find(query).toArray();
    }
}

module.exports = TransactionRepository;
