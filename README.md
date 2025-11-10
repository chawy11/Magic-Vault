# Magic Vault - MTG Trading Platform

A web platform that standardizes and automates Magic: The Gathering card trading through smart matching algorithms.

## 🚀 Features

- **Card Search & Management**: Integrated with Scryfall API for real-time market prices
- **Smart Matching System**: Automatic matches between users' Want/Sell lists
- **Secure Trading**: Bilateral confirmation system and user reviews
- **User Profiles**: Shareable links with complete trading history

## 🛠️ Tech Stack

- **Frontend**: Ionic + Angular 19, TypeScript, RxJS  
- **Backend**: Node.js + Express, JWT Authentication  
- **Database**: MongoDB with Mongoose ODM  
- **External API**: Scryfall Magic: The Gathering API

## 🔒 Security Features

Magic Vault implements comprehensive security measures to protect user data and prevent common attacks:

### Backend Security
- **Input Validation**: All user inputs validated with express-validator
- **SQL/NoSQL Injection Prevention**: MongoDB sanitization and parameterized queries
- **Rate Limiting**: Brute force protection on authentication endpoints
- **Security Headers**: Helmet.js for XSS, clickjacking, MIME sniffing protection
- **JWT Authentication**: Secure token generation with HS256 algorithm
- **Password Hashing**: bcrypt with salt rounds for password storage
- **CORS Configuration**: Restricted to specific frontend origins
- **Request Size Limits**: Protection against DoS attacks
- **Security Logging**: Failed authentication attempts and suspicious activity

### Frontend Security
- **XSS Prevention**: Angular's automatic HTML sanitization
- **Input Validation**: Client-side validators matching backend requirements
- **Password Strength**: Enforced complexity requirements (8+ chars, uppercase, lowercase, number, special char)
- **HTTP Interceptor**: Centralized authentication token management
- **Environment Configuration**: Separate dev/prod API configurations

### Documentation
- 📄 [Security Documentation](SECURITY.md) - Complete security implementation details
- 📘 [Security Developer Guide](SECURITY_DEVELOPER_GUIDE.md) - Best practices for developers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+
- Angular CLI 19+

### Backend Setup

1. Navigate to backend directory:
```bash
cd Back/magic-trading-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `JWT_SECRET`: Strong random secret (min 32 characters)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (production)

4. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Front/magic-trading-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
Edit `src/environments/environment.ts` for development or `environment.prod.ts` for production

4. Start development server:
```bash
npm start
```

5. Build for production:
```bash
npm run build
```

## 🔐 Security Best Practices

Before deploying to production:
- ✅ Set strong JWT_SECRET (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- ✅ Configure MongoDB with authentication
- ✅ Enable HTTPS/TLS
- ✅ Update FRONTEND_URL with production domain
- ✅ Run `npm audit` and fix vulnerabilities
- ✅ Review security logs regularly

## 🚧 Future Enhancements (Work in progress)

- Advanced OCR for card scanning
- Multi-language card search
- List import from Moxfield/Deckstats
- Premium features (multiple lists, advanced filters)
- Mobile app deployment
- HttpOnly cookie-based authentication
- Two-factor authentication (2FA)
- Refresh token system

