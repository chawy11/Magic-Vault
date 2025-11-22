class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    async getUserProfile(req, res, next) {
        try {
            const { username } = req.params;
            const user = await this.userService.getUserProfile(username);
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async getMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const user = await this.userService.getMyProfile(userId);
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async getMatches(req, res, next) {
        try {
            const currentUser = req.user.usuario;
            const otherUser = req.params.username;
            const matches = await this.userService.getMatches(currentUser, otherUser);
            res.json(matches);
        } catch (error) {
            next(error);
        }
    }

    async getMatchingCards(req, res, next) {
        try {
            const currentUsername = req.user.usuario;
            const otherUsername = req.params.username;
            const cards = await this.userService.getMatchingCards(currentUsername, otherUsername);
            res.status(200).json(cards);
        } catch (error) {
            next(error);
        }
    }

    async addCardToWants(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await this.userService.addCardToWants(userId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async addCardToSells(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await this.userService.addCardToSells(userId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateCardInWants(req, res, next) {
        try {
            const userId = req.user.id;
            const { cardId } = req.params;
            const result = await this.userService.updateCardInWants(userId, cardId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateCardInSells(req, res, next) {
        try {
            const userId = req.user.id;
            const { cardId } = req.params;
            const result = await this.userService.updateCardInSells(userId, cardId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async removeCardFromWants(req, res, next) {
        try {
            const userId = req.user.id;
            const { cardId } = req.params;
            const result = await this.userService.removeCardFromWants(userId, cardId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async removeCardFromSells(req, res, next) {
        try {
            const userId = req.user.id;
            const { cardId } = req.params;
            const result = await this.userService.removeCardFromSells(userId, cardId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = UserController;
