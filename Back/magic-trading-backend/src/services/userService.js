const { ObjectId } = require('mongodb');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async getUserProfile(username) {
        const user = await this.userRepository.findByUsername(username);
        if (!user) {
            const error = new Error('Usuario no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Remove sensitive data
        const { password, email, ...publicProfile } = user;
        return {
            _id: user._id,
            usuario: user.usuario,
            wants: user.wants || [],
            sells: user.sells || []
        };
    }

    async getMyProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            const error = new Error('Usuario no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Remove password but keep email for own profile
        const { password, ...profile } = user;
        return profile;
    }

    async getMatches(currentUsername, otherUsername) {
        const currentUserProfile = await this.userRepository.findByUsername(currentUsername);
        const otherUserProfile = await this.userRepository.findByUsername(otherUsername);

        if (!currentUserProfile || !otherUserProfile) {
            const error = new Error('One or both users not found');
            error.statusCode = 404;
            throw error;
        }

        // Calculate matches (their sells match your wants)
        const wantsMatches = currentUserProfile.wants ?
            currentUserProfile.wants.filter(wantCard =>
                otherUserProfile.sells && otherUserProfile.sells.some(sellCard =>
                    sellCard.cardName === wantCard.cardName
                )
            ).length : 0;

        // Calculate matches (your sells match their wants)
        const sellsMatches = currentUserProfile.sells ?
            currentUserProfile.sells.filter(sellCard =>
                otherUserProfile.wants && otherUserProfile.wants.some(wantCard =>
                    wantCard.cardName === sellCard.cardName
                )
            ).length : 0;

        return {
            wantsMatches,
            wantsTotal: currentUserProfile.wants ? currentUserProfile.wants.length : 0,
            sellsMatches,
            sellsTotal: currentUserProfile.sells ? currentUserProfile.sells.length : 0
        };
    }

    async getMatchingCards(currentUsername, otherUsername) {
        const currentUser = await this.userRepository.findByUsername(currentUsername);
        const otherUser = await this.userRepository.findByUsername(otherUsername);

        if (!currentUser || !otherUser) {
            const error = new Error('Usuario no encontrado');
            error.statusCode = 404;
            throw error;
        }

        // Cards that current user has and match other user's wants
        const myMatchingCards = (currentUser.sells || []).filter(myCard =>
            (otherUser.wants || []).some(theirWant =>
                myCard.cardName === theirWant.cardName
            )
        );

        // Cards that other user has and match current user's wants
        const theirMatchingCards = (otherUser.sells || []).filter(theirCard =>
            (currentUser.wants || []).some(myWant =>
                myWant.cardName === theirCard.cardName
            )
        );

        return {
            myMatchingCards,
            theirMatchingCards
        };
    }

    async addCardToWants(userId, cardData) {
        const { cardId, cardName, quantity = 1, setCode = '', edition = '', language = 'English', foil = false, price = 0 } = cardData;

        // Check if card already exists
        const existingCard = await this.userRepository.findCardInWants(userId, cardId);
        if (existingCard) {
            const error = new Error('La carta ya está en tu lista de wants');
            error.statusCode = 400;
            throw error;
        }

        await this.userRepository.updateWants(userId, {
            cardId,
            cardName,
            quantity,
            edition,
            setCode,
            language,
            foil,
            price,
            dateAdded: new Date()
        });

        return { message: 'Carta añadida a wants' };
    }

    async addCardToSells(userId, cardData) {
        const { cardId, cardName, quantity = 1, setCode = '', edition = '', language = 'English', foil = false, price = 0 } = cardData;

        // Check if card already exists
        const existingCard = await this.userRepository.findCardInSells(userId, cardId);
        if (existingCard) {
            const error = new Error('La carta ya está en tu lista de sells');
            error.statusCode = 400;
            throw error;
        }

        await this.userRepository.updateSells(userId, {
            cardId,
            cardName,
            quantity,
            edition,
            setCode,
            language,
            foil,
            price,
            dateAdded: new Date()
        });

        return { message: 'Carta añadida a sells' };
    }

    async updateCardInWants(userId, cardId, cardData) {
        await this.userRepository.updateCardInWants(userId, cardId, cardData);
        return { message: 'Carta actualizada en wants' };
    }

    async updateCardInSells(userId, cardId, cardData) {
        await this.userRepository.updateCardInSells(userId, cardId, cardData);
        return { message: 'Carta actualizada en sells' };
    }

    async removeCardFromWants(userId, cardId) {
        await this.userRepository.removeCardFromWants(userId, cardId);
        return { message: 'Carta eliminada de wants' };
    }

    async removeCardFromSells(userId, cardId) {
        await this.userRepository.removeCardFromSells(userId, cardId);
        return { message: 'Carta eliminada de sells' };
    }
}

module.exports = UserService;
