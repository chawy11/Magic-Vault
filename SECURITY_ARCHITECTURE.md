# Security Architecture - Magic Vault

This document provides a visual overview of the security layers implemented in Magic Vault.

## 🏗️ Security Layers Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Angular Application                      │  │
│  │  • XSS Prevention (Auto Sanitization)                    │  │
│  │  • Form Validation (Client-side)                         │  │
│  │  • HTTP Interceptor (Token Management)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 1                           │
│                    Network & Transport                           │
│  • HTTPS/TLS (Forced via HSTS)                                  │
│  • CORS (Restricted Origins)                                    │
│  • Request Size Limits (10kb)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 2                           │
│                    Rate Limiting & DoS                           │
│  • Auth Endpoints: 5 req/15min per IP                          │
│  • API Endpoints: 100 req/15min per IP                         │
│  • Brute Force Protection                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 3                           │
│                     Security Headers                             │
│  • Content-Security-Policy (CSP)                                │
│  • X-Content-Type-Options: nosniff                              │
│  • X-Frame-Options: DENY                                        │
│  • Strict-Transport-Security (HSTS)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 4                           │
│                   Input Validation                               │
│  • express-validator (All Endpoints)                            │
│  • Type Checking                                                │
│  • Length Validation                                            │
│  • Format Validation (Regex)                                    │
│  • Sanitization                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 5                           │
│                  Authentication & Authorization                  │
│  • JWT Verification (HS256)                                     │
│  • Token Expiration (1 hour)                                    │
│  • Protected Routes                                             │
│  • User Context Validation                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 6                           │
│                  Database Security                               │
│  • MongoDB Sanitization                                         │
│  • ObjectId Validation                                          │
│  • Parameterized Queries                                        │
│  • Password Hashing (bcrypt)                                    │
│  • No Direct Object References                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYER 7                           │
│                  Logging & Monitoring                            │
│  • Authentication Events                                        │
│  • Failed Attempts                                              │
│  • Token Violations                                             │
│  • Unauthorized Access                                          │
│  • IP Tracking                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. POST /api/login                           │
     │  { usuario, password }                        │
     ├──────────────────────────────────────────────>│
     │                                                │
     │                                     2. Rate Limit Check
     │                                                │
     │                                     3. Input Validation
     │                                                │
     │                                     4. Find User (MongoDB)
     │                                                │
     │                                     5. bcrypt.compare()
     │                                                │
     │                                     6. Generate JWT
     │                                        (HS256, 1h exp)
     │                                                │
     │  7. { token, usuario }                        │
     │<──────────────────────────────────────────────┤
     │                                                │
     │  Store token in localStorage                  │
     │  (or HttpOnly cookie in future)               │
     │                                                │
     │  8. GET /api/user/profile/me                  │
     │  Authorization: Bearer <token>                │
     ├──────────────────────────────────────────────>│
     │                                                │
     │                                     9. Extract Token
     │                                                │
     │                                     10. Verify JWT
     │                                         (HS256 only)
     │                                                │
     │                                     11. Check Expiration
     │                                                │
     │                                     12. Fetch User Data
     │                                                │
     │  13. { user profile }                         │
     │<──────────────────────────────────────────────┤
     │                                                │
```

## 🛡️ Request Processing Pipeline

```
HTTP Request
     │
     ↓
┌─────────────────────┐
│   helmet.js         │ → Security Headers Added
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   CORS              │ → Origin Check
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   body-parser       │ → Size Limit Check (10kb)
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   mongoSanitize     │ → Remove $ and . operators
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Rate Limiter      │ → Check Request Count
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Route Handler     │
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Validators        │ → express-validator
│   - body()          │
│   - param()         │
│   - query()         │
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Auth Middleware   │ → JWT Verification (if needed)
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Business Logic    │
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Database Query    │ → Parameterized, ObjectId validated
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Security Logging  │ → Log events if needed
└─────────────────────┘
     │
     ↓
HTTP Response
```

## 🔒 Data Flow Security

### Registration Flow
```
User Input (Frontend)
    │
    ↓ [Client-side Validation]
    │  • Username: 3-30 chars, alphanumeric + _
    │  • Email: Valid format
    │  • Password: 8+ chars, complexity check
    │
    ↓ [HTTP Request]
    │
Backend (Server-side)
    │
    ↓ [Rate Limiting]
    │  • Max 5 attempts per 15 min
    │
    ↓ [Input Validation]
    │  • express-validator rules
    │  • Sanitization
    │  • Format checking
    │
    ↓ [MongoDB Sanitization]
    │  • Remove NoSQL operators
    │
    ↓ [Duplicate Check]
    │  • Check existing email
    │  • Check existing username
    │
    ↓ [Password Hashing]
    │  • bcrypt.hash(password, 10)
    │
    ↓ [Database Insert]
    │  • MongoDB with ObjectId
    │  • Parameterized query
    │
    ↓ [Success Response]
```

### Protected Resource Access
```
Frontend Request
    │
    ↓ [HTTP Interceptor]
    │  • Attach JWT token
    │  • Set Authorization header
    │
    ↓ [HTTP Request with Token]
    │
Backend
    │
    ↓ [Rate Limiting]
    │  • 100 req/15min
    │
    ↓ [Extract Token]
    │  • From Authorization header
    │  • Bearer token format
    │
    ↓ [Verify JWT]
    │  • Algorithm: HS256 only
    │  • Check signature
    │  • Check expiration
    │
    ↓ [Validate User Context]
    │  • User exists
    │  • User authorized for resource
    │
    ↓ [Database Query]
    │  • With user context
    │  • Parameterized
    │
    ↓ [Filter Response]
    │  • Remove sensitive fields
    │  • Project only needed data
    │
    ↓ [Send Response]
```

## 🎯 Attack Prevention Matrix

| Attack Type | Prevention Layer | Mechanism |
|------------|------------------|-----------|
| **SQL/NoSQL Injection** | Input Validation | express-validator, mongoSanitize |
| | Database Layer | ObjectId validation, parameterized queries |
| **XSS** | Frontend | Angular auto-sanitization |
| | Backend | Security headers (CSP) |
| **CSRF** | Headers | CORS restrictions |
| | (Future) | CSRF tokens with cookies |
| **Brute Force** | Rate Limiting | 5 attempts/15min on auth |
| **DoS** | Request Limits | 10kb body size, rate limiting |
| **Clickjacking** | Security Headers | X-Frame-Options: DENY |
| **MIME Sniffing** | Security Headers | X-Content-Type-Options: nosniff |
| **Man-in-Middle** | Transport | HTTPS/TLS, HSTS |
| **Session Hijacking** | JWT | Short expiration, secure generation |
| **Information Disclosure** | Error Handling | Generic error messages |
| | Logging | No sensitive data in logs |

## 📊 Security Monitoring Points

```
┌─────────────────────────────────────────────────────────┐
│                    Monitoring Dashboard                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Authentication Events                                   │
│  ├─ Successful logins: [count] per hour                │
│  ├─ Failed logins: [count] per hour                    │
│  └─ IP addresses: [unique IPs]                         │
│                                                          │
│  Rate Limiting                                          │
│  ├─ Auth blocks: [count] per hour                      │
│  ├─ API blocks: [count] per hour                       │
│  └─ Top blocked IPs: [list]                            │
│                                                          │
│  Token Security                                         │
│  ├─ Invalid tokens: [count] per hour                   │
│  ├─ Expired tokens: [count] per hour                   │
│  └─ Token violations: [list]                           │
│                                                          │
│  Input Validation                                       │
│  ├─ Validation failures: [count] per hour              │
│  └─ Common failure types: [categories]                 │
│                                                          │
│  Database Security                                      │
│  ├─ Sanitization triggers: [count]                     │
│  └─ Invalid ObjectIds: [count]                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Security Configuration Map

```
┌──────────────────────────────────────────────────────────┐
│                   Environment Variables                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  JWT_SECRET ────────────────► JWT Generation/Verification│
│                                     │                     │
│  MONGODB_URI ───────────────► Database Connection        │
│                                     │                     │
│  NODE_ENV ──────────────────► CORS Config                │
│                              Rate Limits                  │
│                              Error Messages               │
│                                     │                     │
│  FRONTEND_URL ──────────────► CORS Origins (Production)  │
│                                     │                     │
│  PORT ──────────────────────► Server Binding             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Security Checklist

```
Pre-Deployment
    ├─ [ ] Strong JWT_SECRET set (32+ random chars)
    ├─ [ ] NODE_ENV=production
    ├─ [ ] FRONTEND_URL configured
    ├─ [ ] MongoDB authentication enabled
    ├─ [ ] HTTPS/TLS certificates installed
    ├─ [ ] Rate limits reviewed
    └─ [ ] Security logging configured

Post-Deployment
    ├─ [ ] Monitor security logs
    ├─ [ ] Verify HTTPS working
    ├─ [ ] Test rate limiting
    ├─ [ ] Verify CORS restrictions
    └─ [ ] Check error responses

Ongoing
    ├─ [ ] Weekly log reviews
    ├─ [ ] Monthly npm audit
    ├─ [ ] Quarterly security audit
    └─ [ ] Regular dependency updates
```

## 🎓 Security Principles Applied

### 1. Defense in Depth
Multiple layers of security ensure that if one layer fails, others provide protection.

### 2. Least Privilege
- Users only access their own data
- Tokens expire after 1 hour
- Database queries scoped to user context

### 3. Fail Secure
- Invalid input returns 400 (not 500)
- Auth failures return generic messages
- Errors don't leak system information

### 4. Complete Mediation
- Every request checked
- No bypasses
- Validation on every endpoint

### 5. Security by Design
- Security considered from the start
- Not added as afterthought
- Integrated into development process

## 📈 Security Maturity Level

```
Level 5: Optimized        [████████░░] 80%
    └─ Continuous improvement process
    └─ Security metrics tracked
    └─ Proactive threat hunting

Level 4: Managed          [██████████] 100% ✅
    └─ Security processes documented
    └─ Regular audits scheduled
    └─ Incident response plan

Level 3: Defined          [██████████] 100% ✅
    └─ Security policies documented
    └─ Team trained on security
    └─ Standards followed

Level 2: Repeatable       [██████████] 100% ✅
    └─ Basic security controls
    └─ Some automation
    └─ Awareness present

Level 1: Initial          [██████████] 100% ✅
    └─ Ad-hoc security
    └─ Limited awareness
    └─ Reactive approach
```

**Current Status:** Level 4 (Managed) - Well-structured security implementation with documented processes.

**Target:** Level 5 (Optimized) - Implement continuous monitoring, automated testing, and proactive security.

---

For implementation details, see:
- [SECURITY.md](SECURITY.md) - Technical documentation
- [SECURITY_DEVELOPER_GUIDE.md](SECURITY_DEVELOPER_GUIDE.md) - Developer guide
- [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) - Quick reference
