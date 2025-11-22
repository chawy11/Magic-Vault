const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config/env');
const databaseConnection = require('./config/database');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Repositories
const UserRepository = require('./repositories/userRepository');
const TransactionRepository = require('./repositories/transactionRepository');

// Services
const AuthService = require('./services/authService');
const UserService = require('./services/userService');
const TransactionService = require('./services/transactionService');

// Controllers
const AuthController = require('./controllers/authController');
const UserController = require('./controllers/userController');
const TransactionController = require('./controllers/transactionController');

// Routes
const createAuthRoutes = require('./routes/authRoutes');
const createUserRoutes = require('./routes/userRoutes');
const createTransactionRoutes = require('./routes/transactionRoutes');

class App {
    constructor() {
        this.app = express();
        this.port = config.port;
        this.setupMiddleware();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
    }

    async initialize() {
        // Connect to database
        const db = await databaseConnection.connect();

        // Initialize repositories
        const userRepository = new UserRepository(db);
        const transactionRepository = new TransactionRepository(db);

        // Initialize services with dependency injection
        const authService = new AuthService(userRepository);
        const userService = new UserService(userRepository);
        const transactionService = new TransactionService(transactionRepository, userRepository);

        // Initialize controllers with dependency injection
        const authController = new AuthController(authService);
        const userController = new UserController(userService);
        const transactionController = new TransactionController(transactionService);

        // Setup routes
        this.setupRoutes(authController, userController, transactionController);

        // Error handling middleware (must be last)
        this.app.use(errorHandler);

        return this.app;
    }

    setupRoutes(authController, userController, transactionController) {
        // Home route
        this.app.get('/', (req, res) => {
            res.send('¡Bienvenido al backend de Magic Trading!');
        });

        // API routes
        this.app.use('/api', createAuthRoutes(authController));
        this.app.use('/api', createUserRoutes(userController, authenticateToken));
        this.app.use('/api', createTransactionRoutes(transactionController, authenticateToken));
    }

    async start() {
        await this.initialize();
        
        this.server = this.app.listen(this.port, () => {
            console.log(`Servidor backend corriendo en http://localhost:${this.port}`);
        });

        // Handle shutdown gracefully
        process.on('SIGINT', async () => {
            console.log('\nCerrando servidor...');
            this.server.close();
            await databaseConnection.close();
            process.exit(0);
        });

        return this.server;
    }
}

module.exports = App;
