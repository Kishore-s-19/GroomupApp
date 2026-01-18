# Production Deployment Checklist

## 🚀 Pre-Deployment Requirements

### Backend Configuration

1. **Environment Variables** (backend/src/main/resources/application.yml or application.properties)
   ```yaml
   razorpay:
     base-url: https://api.razorpay.com
     key-id: ${RAZORPAY_KEY_ID}
     key-secret: ${RAZORPAY_KEY_SECRET}
     webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}
   
   spring:
     datasource:
       url: ${DATABASE_URL}
       username: ${DB_USERNAME}
       password: ${DB_PASSWORD}
     jwt:
       secret: ${JWT_SECRET}
   ```

2. **Razorpay Setup**
   - ✅ Get production Razorpay Key ID and Secret from Razorpay Dashboard
   - ✅ Set up Webhook URL in Razorpay Dashboard: `https://yourdomain.com/api/payments/webhook/razorpay`
   - ✅ Configure Webhook Events: `payment.captured`
   - ✅ Save Webhook Secret for signature verification

3. **Database**
   - ✅ Use production-grade database (PostgreSQL/MySQL)
   - ✅ Run migrations/schema creation
   - ✅ Set up database backups
   - ✅ Configure connection pooling

4. **Security**
   - ✅ Enable HTTPS/SSL
   - ✅ Set strong JWT secret (32+ characters)
   - ✅ Configure CORS for frontend domain only
   - ✅ Enable CSRF protection
   - ✅ Set secure session configuration

### Frontend Configuration

1. **Environment Variables** (create `.env.production`)
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

2. **Build Configuration**
   - ✅ Update API base URL in production build
   - ✅ Enable minification and code splitting
   - ✅ Configure asset optimization

3. **Razorpay Integration**
   - ✅ Verify Razorpay checkout script loads correctly
   - ✅ Test payment flow in test mode before going live

## 📋 Deployment Steps

### Backend Deployment

1. **Build Backend**
   ```bash
   cd backend
   ./mvnw clean package -DskipTests
   ```

2. **Run Tests**
   ```bash
   ./mvnw test
   ```

3. **Deploy to Server**
   - Copy JAR file to server
   - Set environment variables
   - Run with: `java -jar backend.jar --spring.profiles.active=production`

4. **Monitor**
   - Set up logging (ELK, CloudWatch, etc.)
   - Configure health checks
   - Set up monitoring/alerts

### Frontend Deployment

1. **Build Frontend**
   ```bash
   cd GroomupApp-main
   npm install
   npm run build
   ```

2. **Deploy Build Folder**
   - Upload `dist/` folder to CDN/static hosting
   - Configure routing (SPA redirect to index.html)
   - Enable GZIP compression

## 🔍 Testing Checklist

### Payment Flow Testing

- [ ] Test Card Payment (use Razorpay test cards)
- [ ] Test UPI Payment (test UPI ID)
- [ ] Test Cash on Delivery
- [ ] Verify Order Creation
- [ ] Verify Webhook Receives Payment Events
- [ ] Test Payment Failure Handling
- [ ] Test Payment Cancellation

### Integration Testing

- [ ] Cart → Checkout → Payment Flow
- [ ] Order Creation → Payment → Confirmation
- [ ] Webhook → Order Status Update
- [ ] Email Notifications (if implemented)

### Security Testing

- [ ] Authentication/Authorization
- [ ] API Rate Limiting
- [ ] SQL Injection Prevention
- [ ] XSS Protection
- [ ] CSRF Protection
- [ ] Payment Data Security (PCI Compliance)

## 🛡️ Production Security

### Backend

1. **API Security**
   - Implement rate limiting
   - Add request validation
   - Enable API versioning
   - Use HTTPS only

2. **Database Security**
   - Encrypted connections
   - Parameterized queries
   - Regular security updates

3. **Logging & Monitoring**
   - Log all payment transactions
   - Monitor failed payments
   - Alert on critical errors
   - Regular security audits

### Frontend

1. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options

2. **API Communication**
   - Always use HTTPS
   - Validate API responses
   - Handle errors gracefully

## 📊 Monitoring & Analytics

### Metrics to Track

- Payment Success Rate
- Payment Failure Reasons
- Average Order Value
- Cart Abandonment Rate
- API Response Times
- Error Rates

### Tools

- Application Performance Monitoring (APM)
- Error Tracking (Sentry, Rollbar)
- Payment Analytics (Razorpay Dashboard)
- User Analytics (Google Analytics, etc.)

## 🔄 Post-Deployment

1. **Verify Critical Paths**
   - User Registration/Login
   - Product Browsing
   - Cart Operations
   - Checkout Process
   - Payment Processing

2. **Monitor Logs**
   - Check for errors
   - Monitor payment webhooks
   - Track API performance

3. **User Acceptance Testing**
   - Test with real users
   - Collect feedback
   - Monitor conversion rates

## 🚨 Rollback Plan

1. Keep previous version available
2. Database migration rollback scripts
3. Feature flags for quick disable
4. Monitoring alerts for quick response

## 📝 Environment Variables Summary

### Backend (.env or application.yml)
```
DATABASE_URL=jdbc:postgresql://localhost:5432/groomup_prod
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_strong_jwt_secret_32_chars_min
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
SERVER_PORT=8080
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## ⚠️ Important Notes

1. **Razorpay Test Mode**: Test thoroughly with test credentials before switching to production
2. **Webhook Security**: Always verify webhook signatures
3. **Order Status**: Ensure order status is updated only via webhooks
4. **Error Handling**: Implement comprehensive error handling and user feedback
5. **Backup Strategy**: Regular database backups, especially before major changes
6. **Documentation**: Keep API documentation updated

## 🔗 Useful Links

- Razorpay Dashboard: https://dashboard.razorpay.com
- Razorpay Docs: https://razorpay.com/docs
- Spring Boot Production: https://spring.io/guides
- React Production Build: https://react.dev/learn/start-a-new-react-project

