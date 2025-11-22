/**
 * Smoke tests to verify the refactored architecture loads correctly
 */

const assert = require('assert');

console.log('Running smoke tests...');

const tests = [
    {
        name: 'Config modules load',
        fn: () => {
            const config = require('../src/config/env');
            assert(config.port, 'Config should have port');
        }
    },
    {
        name: 'Middleware modules load',
        fn: () => {
            const { authenticateToken } = require('../src/middleware/auth');
            assert.strictEqual(typeof authenticateToken, 'function');
        }
    },
    {
        name: 'Repository classes load',
        fn: () => {
            const UserRepository = require('../src/repositories/userRepository');
            assert.strictEqual(typeof UserRepository, 'function');
        }
    },
    {
        name: 'Service classes load',
        fn: () => {
            const AuthService = require('../src/services/authService');
            assert.strictEqual(typeof AuthService, 'function');
        }
    },
    {
        name: 'Controller classes load',
        fn: () => {
            const AuthController = require('../src/controllers/authController');
            assert.strictEqual(typeof AuthController, 'function');
        }
    },
    {
        name: 'Route factories load',
        fn: () => {
            const createAuthRoutes = require('../src/routes/authRoutes');
            assert.strictEqual(typeof createAuthRoutes, 'function');
        }
    },
    {
        name: 'App class loads',
        fn: () => {
            const App = require('../src/app');
            assert.strictEqual(typeof App, 'function');
        }
    }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    try {
        test.fn();
        console.log(`✓ ${test.name}`);
        passed++;
    } catch (error) {
        console.error(`✗ ${test.name}`);
        console.error(`  ${error.message}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
