# Architecture Guide for Developers

This guide provides essential information for developers working on the Magic-Vault project.

## Quick Start

### Backend
```bash
cd Back/magic-trading-backend
npm install
npm start  # Starts the server on port 3000
```

### Frontend
```bash
cd Front/magic-trading-app
npm install
npm start  # Starts the development server
```

## Project Structure

### Backend Structure
```
Back/magic-trading-backend/
├── src/
│   ├── config/          # Environment and database configuration
│   │   ├── database.js  # MongoDB connection management
│   │   └── env.js       # Environment variables
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # JWT authentication
│   │   └── errorHandler.js  # Centralized error handling
│   ├── repositories/    # Data access layer (database operations)
│   │   ├── userRepository.js
│   │   └── transactionRepository.js
│   ├── services/        # Business logic layer
│   │   ├── authService.js
│   │   ├── userService.js
│   │   └── transactionService.js
│   ├── controllers/     # HTTP request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── transactionController.js
│   ├── routes/          # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── transactionRoutes.js
│   ├── app.js          # Application setup and dependency injection
│   └── server.js       # Server entry point
├── test/
│   └── smoke.test.js   # Architecture smoke tests
└── index.js.old        # Original monolithic file (backup)
```

### Frontend Structure
```
Front/magic-trading-app/src/app/
├── config/             # Configuration files
│   └── api.config.ts   # API endpoint configuration
├── services/           # Angular services
│   ├── auth.service.ts
│   ├── storage.service.ts  # localStorage abstraction
│   ├── userprofile.service.ts
│   ├── transaction.service.ts
│   └── scryfall.service.ts
├── validators/         # Form validation
├── pages/              # Ionic pages/components
└── guards/             # Route guards
```

## Architecture Patterns

### 1. Layered Architecture (Backend)

The backend follows a strict layered architecture with clear separation of concerns:

```
HTTP Request
    ↓
Routes (Define endpoints)
    ↓
Controllers (Handle HTTP, validation)
    ↓
Services (Business logic)
    ↓
Repositories (Data access)
    ↓
Database
```

**Key Rules:**
- Each layer only communicates with the layer directly below it
- Controllers should NOT access repositories directly
- Services should NOT handle HTTP requests/responses
- Repositories should NOT contain business logic

### 2. Dependency Injection

All components use constructor-based dependency injection:

```javascript
// Good ✅
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
}

// Bad ❌
class UserService {
    constructor() {
        this.userRepository = new UserRepository();  // Tightly coupled
    }
}
```

Dependencies are wired together in `src/app.js`.

### 3. Repository Pattern

Repositories encapsulate all database operations:

```javascript
// userRepository.js
async findByEmail(email) {
    return await this.collection.findOne({ email });
}
```

**Benefits:**
- Single place to change database queries
- Easy to mock for testing
- Can swap database implementations

### 4. Service Layer

Services contain all business logic:

```javascript
// authService.js
async register(usuario, email, password) {
    // Validation
    if (!usuario || !email || !password) {
        throw new Error('All fields required');
    }
    
    // Business rules
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
        throw new Error('Email already registered');
    }
    
    // Operations
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.userRepository.create({...});
}
```

### 5. Error Handling

Consistent error handling across the application:

```javascript
// In services - throw errors with statusCode
const error = new Error('User not found');
error.statusCode = 404;
throw error;

// In controllers - catch and pass to middleware
try {
    const result = await this.service.someMethod();
    res.json(result);
} catch (error) {
    next(error);  // Pass to error handling middleware
}
```

## Coding Conventions

### Backend Conventions

1. **File Naming**: Use camelCase for files (e.g., `userService.js`)

2. **Class Naming**: Use PascalCase for classes (e.g., `UserService`)

3. **Async/Await**: Always use async/await, never callbacks

4. **Error Handling**: 
   - Services throw errors with `statusCode` property
   - Controllers catch and pass to `next()`
   - Middleware handles all errors centrally

5. **Configuration**: 
   - Never hardcode values
   - Use `config/env.js` for environment variables
   - Validate required config in production

6. **Dependencies**:
   - Inject via constructor
   - Wire in `app.js`
   - Follow dependency inversion principle

### Frontend Conventions

1. **Service Injection**: Always inject dependencies in constructor:
```typescript
constructor(
    private http: HttpClient,
    private storage: StorageService
) {}
```

2. **Storage Access**: Never access localStorage directly:
```typescript
// Good ✅
this.storage.setToken(token);

// Bad ❌
localStorage.setItem('token', token);
```

3. **API URLs**: Use `API_CONFIG.baseUrl`, never hardcode:
```typescript
// Good ✅
private apiUrl = API_CONFIG.baseUrl;

// Bad ❌
private apiUrl = 'http://localhost:3000/api';
```

## Adding New Features

### Backend: Adding a New Entity

1. **Create Repository** (`repositories/entityRepository.js`):
```javascript
class EntityRepository {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('entities');
    }
    
    async findById(id) { /* ... */ }
    async create(data) { /* ... */ }
}
module.exports = EntityRepository;
```

2. **Create Service** (`services/entityService.js`):
```javascript
class EntityService {
    constructor(entityRepository) {
        this.entityRepository = entityRepository;
    }
    
    async getEntity(id) {
        const entity = await this.entityRepository.findById(id);
        if (!entity) {
            const error = new Error('Entity not found');
            error.statusCode = 404;
            throw error;
        }
        return entity;
    }
}
module.exports = EntityService;
```

3. **Create Controller** (`controllers/entityController.js`):
```javascript
class EntityController {
    constructor(entityService) {
        this.entityService = entityService;
    }
    
    async getEntity(req, res, next) {
        try {
            const entity = await this.entityService.getEntity(req.params.id);
            res.json(entity);
        } catch (error) {
            next(error);
        }
    }
}
module.exports = EntityController;
```

4. **Create Routes** (`routes/entityRoutes.js`):
```javascript
function createEntityRoutes(entityController, authenticateToken) {
    const router = express.Router();
    router.get('/entity/:id', authenticateToken, 
        (req, res, next) => entityController.getEntity(req, res, next));
    return router;
}
module.exports = createEntityRoutes;
```

5. **Wire in App** (`app.js`):
```javascript
const EntityRepository = require('./repositories/entityRepository');
const EntityService = require('./services/entityService');
const EntityController = require('./controllers/entityController');
const createEntityRoutes = require('./routes/entityRoutes');

// In initialize()
const entityRepository = new EntityRepository(db);
const entityService = new EntityService(entityRepository);
const entityController = new EntityController(entityService);

// In setupRoutes()
this.app.use('/api', createEntityRoutes(entityController, authenticateToken));
```

### Frontend: Adding a New Service

1. **Create Service** (`services/entity.service.ts`):
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class EntityService {
  private apiUrl = API_CONFIG.baseUrl;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.storage.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getEntity(id: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/entity/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
```

## Testing

### Running Tests

```bash
# Backend smoke tests
cd Back/magic-trading-backend
npm test

# Frontend tests (when configured)
cd Front/magic-trading-app
npm test
```

### Writing Tests

Follow the pattern in `test/smoke.test.js` for unit tests.

## Common Tasks

### Adding Environment Variable

1. Add to `.env` file
2. Add to `src/config/env.js`
3. Document in README if user-facing

### Adding Authentication to Route

```javascript
// In route file
router.get('/protected', authenticateToken, 
    (req, res, next) => controller.method(req, res, next));
```

### Changing Database Schema

1. Update repository methods
2. Service layer may need updates
3. Update API documentation
4. Consider migration strategy for existing data

## Additional Resources

- [SOLID_PRINCIPLES.md](./SOLID_PRINCIPLES.md) - Detailed explanation of SOLID principles
- [SECURITY_NOTES.md](./SECURITY_NOTES.md) - Security considerations and recommendations
- [README.md](./README.md) - Project overview and features

## Need Help?

- Check existing code for patterns
- Refer to SOLID_PRINCIPLES.md for architecture decisions
- Follow the layer responsibilities strictly
- When in doubt, maintain consistency with existing code
