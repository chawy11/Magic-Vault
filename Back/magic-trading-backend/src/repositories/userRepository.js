const { ObjectId } = require('mongodb');

class UserRepository {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('usuarios');
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email });
    }

    async findByUsername(usuario) {
        return await this.collection.findOne({ usuario });
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async create(userData) {
        return await this.collection.insertOne(userData);
    }

    async updateWants(userId, wants) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { wants } }
        );
    }

    async updateSells(userId, sells) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { sells } }
        );
    }

    async updateCardInWants(userId, cardId, cardData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId), "wants.cardId": cardId },
            { $set: {
                "wants.$.quantity": cardData.quantity,
                "wants.$.edition": cardData.edition,
                "wants.$.language": cardData.language,
                "wants.$.foil": cardData.foil,
                "wants.$.price": cardData.price,
                "wants.$.setCode": cardData.setCode
            }}
        );
    }

    async updateCardInSells(userId, cardId, cardData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId), "sells.cardId": cardId },
            { $set: {
                "sells.$.quantity": cardData.quantity,
                "sells.$.edition": cardData.edition,
                "sells.$.language": cardData.language,
                "sells.$.foil": cardData.foil,
                "sells.$.price": cardData.price,
                "sells.$.setCode": cardData.setCode
            }}
        );
    }

    async removeCardFromWants(userId, cardId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { wants: { cardId } } }
        );
    }

    async removeCardFromSells(userId, cardId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { sells: { cardId } } }
        );
    }

    async findCardInWants(userId, cardId) {
        return await this.collection.findOne(
            { _id: new ObjectId(userId), 'wants.cardId': cardId }
        );
    }

    async findCardInSells(userId, cardId) {
        return await this.collection.findOne(
            { _id: new ObjectId(userId), 'sells.cardId': cardId }
        );
    }

    async markCardInTransaction(userId, cardId, isWants = false) {
        const field = isWants ? "wants" : "sells";
        return await this.collection.updateOne(
            { _id: new ObjectId(userId), [`${field}.cardId`]: cardId },
            { $set: { [`${field}.$.inTransaction`]: true } }
        );
    }

    async removeCardsByName(userId, cardName, isWants = false) {
        const field = isWants ? "wants" : "sells";
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { [field]: { cardName } } }
        );
    }

    async removeCardsByIdFromSells(userId, cardId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { sells: { cardId: cardId.toString() } } }
        );
    }
}

module.exports = UserRepository;
