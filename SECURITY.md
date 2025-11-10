# Security Documentation - Magic Vault

This document outlines the security measures implemented in the Magic Vault application.

## Backend Security Measures (Node.js/Express)

### 1. SQL/NoSQL Injection Prevention ✅

**Implementation:**
- **express-mongo-sanitize**: Automatically removes `$` and `.` characters from user input to prevent MongoDB operator injection
- **express-validator**: All user inputs are validated and sanitized before processing
- **MongoDB queries**: Use parameterized queries with ObjectId validation

**Best Practices:**
- Never concatenate user input directly into database queries
- Always validate input data types and formats
- Use allowlists (whitelisting) for expected values

### 2. Input Validation ✅

**Implementation:**
- **express-validator**: Comprehensive input validation on all endpoints
- Username validation: 3-30 characters, alphanumeric and underscores only
- Email validation: Proper email format with normalization
- Password strength: Minimum 8 characters, requires uppercase, lowercase, number, and special character
- Card IDs, transaction IDs: Length and format validation

**Validation Coverage:**
- Registration endpoint: usuario, email, password
- Login endpoint: usuario, password
- Card operations: cardId, cardName, quantity, price
- Transaction operations: transactionId, sellerId
- Profile operations: username parameters

### 3. Authentication & Authorization ✅

**JWT Implementation:**
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 1 hour tokens
- **Secret**: Environment variable (JWT_SECRET) - must be strong in production
- **Token Verification**: Synchronous verification with explicit algorithm specification

**Improvements:**
- Logs successful and failed authentication attempts
- Specific error messages for expired vs invalid tokens
- Warning logs for unauthorized access attempts

**Recommended Future Enhancements:**
- Implement refresh tokens for better UX
- Consider using HttpOnly cookies instead of localStorage
- Implement token blacklist for logout

### 4. Rate Limiting ✅

**Implementation:**
- **express-rate-limit**: Two-tier rate limiting strategy

**Authentication Endpoints** (`/api/login`, `/api/registro`):
- Window: 15 minutes
- Max requests: 5 per IP
- Purpose: Brute force attack prevention

**General API Endpoints**:
- Window: 15 minutes  
- Max requests: 100 per IP
- Purpose: DoS attack prevention

### 5. Security Headers ✅

**Implementation:**
- **helmet**: Comprehensive security headers

**Headers Configured:**
- **Content-Security-Policy (CSP)**: Restricts resource loading to prevent XSS
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Browser XSS protection

### 6. CORS Configuration ✅

**Implementation:**
- Configured for specific origins only
- Development: `http://localhost:8100`, `http://localhost:4200`
- Production: Environment variable `FRONTEND_URL`
- Credentials: Enabled for future cookie-based auth

**Security:**
- Prevents unauthorized domains from accessing the API
- Configurable per environment

### 7. Request Size Limiting ✅

**Implementation:**
- Body parser limit: 10kb
- Purpose: Prevents DoS attacks via large payloads

### 8. Security Logging ✅

**Implemented Logging:**
- Successful authentication with timestamp
- Failed login attempts with username and timestamp
- Unauthorized access attempts with IP and path
- Invalid token attempts with IP and error type

**Purpose:**
- Audit trail for security incidents
- Detection of attack patterns
- Compliance and monitoring

## Frontend Security Measures (Angular/Ionic)

### 1. XSS Prevention ✅

**Angular Built-in Protection:**
- Automatic HTML sanitization
- Template binding escapes special characters
- Safe by default

**Best Practices:**
- Avoid `bypassSecurityTrust*` methods
- Use Angular's DomSanitizer only when necessary with trusted sources
- Custom validators for form inputs

### 2. Password Strength Validation ✅

**Implementation:**
- Custom validator in `form-validators.ts`
- Requirements enforced:
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character
  
**Backend Validation:**
- Same requirements enforced on registration endpoint
- Prevents client-side bypass

### 3. Token Storage (Current) ⚠️

**Current Implementation:**
- Tokens stored in localStorage
- Token sent via Authorization header

**Security Concerns:**
- Vulnerable to XSS attacks
- JavaScript can access tokens

**Recommended Improvements:**
1. Move to HttpOnly cookies for token storage
2. Implement CSRF protection when using cookies
3. Consider session management with refresh tokens

### 4. CSRF Protection (To Implement) ⏳

**Recommendation:**
- Implement CSRF tokens when moving to cookie-based authentication
- Use double-submit cookie pattern or synchronized token pattern

## Environment Configuration

### Required Environment Variables

**Backend (.env file):**
```
PORT=3000
NODE_ENV=production
JWT_SECRET=<strong-random-secret-min-32-chars>
MONGODB_URI=<your-mongodb-connection-string>
FRONTEND_URL=<your-frontend-url>
```

### Generating Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Checklist

### Before Deployment to Production:

- [ ] Set strong JWT_SECRET (minimum 32 characters, random)
- [ ] Set NODE_ENV=production
- [ ] Configure FRONTEND_URL with production domain
- [ ] Enable HTTPS/TLS on server
- [ ] Configure MongoDB with authentication
- [ ] Review and adjust rate limiting thresholds
- [ ] Set up security monitoring and logging
- [ ] Regular dependency updates (`npm audit`)
- [ ] Configure firewall rules
- [ ] Implement backup strategy for database

### Regular Maintenance:

- [ ] Weekly: Check security logs for suspicious activity
- [ ] Monthly: Run `npm audit` and update vulnerable dependencies
- [ ] Quarterly: Review and update security policies
- [ ] Annually: Security audit and penetration testing

## Known Limitations & Future Improvements

### Current Limitations:

1. **Token Storage**: Tokens in localStorage are vulnerable to XSS
2. **No Refresh Tokens**: Users must re-login after 1 hour
3. **No CSRF Protection**: Not needed with current auth but required if moving to cookies
4. **No Account Lockout**: Failed attempts are rate-limited but not account-specific
5. **Limited Logging**: Security events logged to console, not centralized system

### Planned Improvements:

1. **Move to HttpOnly Cookies**: 
   - Store JWT in HttpOnly, Secure cookies
   - Implement CSRF protection
   
2. **Refresh Token System**:
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Token rotation on refresh
   
3. **Enhanced Monitoring**:
   - Centralized logging system
   - Real-time security alerts
   - Automated threat detection
   
4. **Account Security**:
   - Account lockout after repeated failures
   - Two-factor authentication (2FA)
   - Email verification
   - Password reset functionality

5. **API Security**:
   - API versioning
   - GraphQL with query complexity limits
   - WebSocket security for real-time features

## Vulnerability Reporting

If you discover a security vulnerability, please email [security contact] with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Please do not disclose security vulnerabilities publicly until they have been addressed.

## Compliance

This application implements security best practices aligned with:
- OWASP Top 10 Web Application Security Risks
- OWASP API Security Top 10
- Node.js Security Best Practices

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Angular Security Guide](https://angular.io/guide/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
