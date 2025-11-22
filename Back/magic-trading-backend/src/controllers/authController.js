class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async register(req, res, next) {
        try {
            const { usuario, email, password } = req.body;
            const result = await this.authService.register(usuario, email, password);
            
            if (result.errores) {
                return res.status(400).json({
                    message: 'Error de validación',
                    errores: result.errores
                });
            }
            
            res.status(201).json(result);
        } catch (error) {
            if (error.errores) {
                return res.status(error.statusCode || 400).json({
                    message: error.message,
                    errores: error.errores
                });
            }
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { usuario, password } = req.body;
            const result = await this.authService.login(usuario, password);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
