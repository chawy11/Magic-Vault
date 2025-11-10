# Security Checklist

Quick reference checklist for maintaining security in Magic Vault.

## 🚀 Initial Setup

### Backend Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Generate strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set JWT_SECRET in `.env` (minimum 32 characters)
- [ ] Configure MONGODB_URI with authentication
- [ ] Set NODE_ENV appropriately (development/production)
- [ ] Install dependencies: `npm install`
- [ ] Run security audit: `npm run security:audit`
- [ ] Fix vulnerabilities: `npm run security:fix`

### Frontend Setup
- [ ] Install dependencies: `npm install`
- [ ] Configure environment files (environment.ts / environment.prod.ts)
- [ ] Verify API URL matches backend
- [ ] Test build: `npm run build`

## 📝 Before Every Commit

- [ ] No secrets in code (check for API keys, passwords, tokens)
- [ ] No `.env` file in commit
- [ ] No `node_modules` in commit
- [ ] All inputs validated on backend
- [ ] No `bypassSecurityTrust*` in Angular (unless absolutely necessary)
- [ ] No SQL/NoSQL concatenation - use parameterized queries
- [ ] Password fields properly validated
- [ ] Sensitive data not logged to console

## 🔒 Security Code Review

### Backend Endpoint Checklist
- [ ] Input validation with express-validator
- [ ] Authentication required (if needed)
- [ ] User authorization checked (owns resource)
- [ ] Error messages don't leak sensitive info
- [ ] Data sanitized before DB operations
- [ ] Rate limiting applied (if auth/sensitive)
- [ ] ObjectId validation for MongoDB IDs
- [ ] No direct object reference without validation

### Frontend Component Checklist
- [ ] Form validation on client side
- [ ] User input not directly rendered as HTML
- [ ] Sensitive data not in localStorage (use secure cookies for tokens in future)
- [ ] HTTP errors handled gracefully
- [ ] No sensitive info in URL parameters
- [ ] XSS protection not bypassed

## 🚦 Before Deployment

### Development Environment
- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] CORS configured for localhost
- [ ] Rate limits appropriate for testing
- [ ] MongoDB connection string correct
- [ ] All dependencies installed
- [ ] No build errors

### Production Environment
- [ ] JWT_SECRET is production-grade (64+ random characters, rotated regularly)
- [ ] CORS restricted to production frontend domain
- [ ] Rate limits set for production traffic
- [ ] MongoDB has authentication enabled
- [ ] MongoDB network access restricted
- [ ] HTTPS/TLS configured and forced (HSTS enabled)
- [ ] Environment variables set correctly
- [ ] NODE_ENV=production
- [ ] All secrets in environment variables, not code
- [ ] Security logging configured
- [ ] Monitoring and alerting set up
- [ ] Backup strategy in place
- [ ] npm audit shows 0 vulnerabilities
- [ ] Angular production build tested

## 🔄 Regular Maintenance

### Weekly
- [ ] Review security logs for suspicious activity
- [ ] Check for failed authentication attempts patterns
- [ ] Monitor rate limiting events
- [ ] Review error logs for security issues

### Monthly
- [ ] Run `npm audit` on backend
- [ ] Run `npm audit` on frontend
- [ ] Update vulnerable dependencies
- [ ] Review and update security headers if needed
- [ ] Check for new OWASP guidelines
- [ ] Review user permissions and access logs

### Quarterly
- [ ] Full security audit of code
- [ ] Review and update security policies
- [ ] Team security training/review
- [ ] Penetration testing (if possible)
- [ ] Review and rotate secrets (JWT_SECRET, DB passwords)
- [ ] Update security documentation

## 🚨 Security Incident Response

If you discover a security vulnerability:

1. **Do NOT** disclose publicly
2. **Document** the issue:
   - What is the vulnerability?
   - How can it be exploited?
   - What is the potential impact?
   - Steps to reproduce
3. **Assess** severity:
   - Critical: Immediate data breach risk
   - High: Significant security compromise possible
   - Medium: Limited security impact
   - Low: Minimal risk
4. **Notify** team immediately
5. **Create** private fix branch
6. **Test** the fix thoroughly
7. **Deploy** fix as soon as possible
8. **Document** lessons learned
9. **Update** security measures

## ⚡ Quick Security Tests

### Test Rate Limiting
```bash
# Should block after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"usuario":"test","password":"wrong"}'
done
```

### Test Input Validation
```bash
# Should return validation error
curl -X POST http://localhost:3000/api/registro \
  -H "Content-Type: application/json" \
  -d '{"usuario":"ab","email":"invalid","password":"weak"}'
```

### Test NoSQL Injection
```bash
# Should be sanitized/blocked
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":{"$ne":null},"password":{"$ne":null}}'
```

### Test JWT Expiration
```bash
# Use expired token - should return 403
curl -X GET http://localhost:3000/api/user/profile/me \
  -H "Authorization: Bearer <expired_token>"
```

## 📚 Resources

- [SECURITY.md](SECURITY.md) - Detailed security implementation
- [SECURITY_DEVELOPER_GUIDE.md](SECURITY_DEVELOPER_GUIDE.md) - Developer guide with examples
- [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) - Implementation summary
- [.env.example](Back/magic-trading-backend/.env.example) - Environment template

## 🎯 Security Metrics

Track these metrics to measure security posture:

- Failed authentication attempts per day
- Rate limit hits per day
- Invalid token attempts per day
- Average time to patch vulnerabilities
- Number of open vulnerabilities
- Time since last security audit
- Time since last npm audit

## ✅ Production Ready Checklist

Before going live:

- [ ] All items in "Before Deployment" section completed
- [ ] Security testing performed
- [ ] Load testing with rate limits verified
- [ ] Error handling tested (don't leak info)
- [ ] Logging configured and working
- [ ] Monitoring and alerts configured
- [ ] Backup and recovery tested
- [ ] Incident response plan documented
- [ ] Team trained on security practices
- [ ] Security contacts established
- [ ] Legal/compliance requirements met
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance verified (if applicable)

---

**Remember:** Security is not a one-time task, it's an ongoing process. Stay vigilant! 🛡️
