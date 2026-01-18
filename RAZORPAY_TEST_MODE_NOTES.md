# Razorpay Test Mode - Important Notes for UPI Testing

## ⚠️ Test Mode Limitations

### UPI Payments in Test Mode

**Important:** When using Razorpay in **Test Mode**, UPI payments behave differently than in production:

1. **No Real UPI Requests:** Test mode does NOT send actual UPI payment requests to UPI apps (Google Pay, PhonePe, etc.)

2. **Handler Called Immediately:** The payment handler callback may be triggered immediately when you enter a UPI ID, even without actual payment

3. **Simulated Flow:** Test mode simulates the payment flow for testing purposes

### How to Test UPI Payments Properly

1. **Use Test Cards Instead:**
   - For testing payment flow, use Razorpay test cards instead of UPI
   - Test cards work reliably in test mode
   - Example: `4111 1111 1111 1111` (CVV: any 3 digits, Expiry: any future date)

2. **Use Razorpay Dashboard:**
   - Check payment status in Razorpay Dashboard → Payments
   - Verify webhook delivery in Webhooks section

3. **For Real UPI Testing:**
   - Switch to **Production Mode** (requires real Razorpay account)
   - Use real UPI apps and IDs
   - Payment requests will actually be sent

### Current Implementation

The checkout flow now includes:

1. **Payment Verification:** For UPI payments, the system verifies payment status with backend before showing success
2. **Multiple Verification Attempts:** Checks payment status up to 8 times (16 seconds total)
3. **Error Handling:** Shows appropriate error messages if verification fails

### Test Mode UPI Behavior

When testing UPI in test mode:
- ✅ Enter UPI ID: `test@upi` or any format
- ⚠️ Handler may be called immediately (this is expected in test mode)
- ⚠️ No actual UPI request will be sent to your phone
- ✅ System verifies payment status with backend
- ⚠️ Verification may fail if webhook hasn't processed (normal in test mode)
- ✅ For real testing, use production mode or test cards

### Recommended Testing Approach

**For Development/Testing:**
1. Use **Test Cards** for payment testing
2. Use **COD** to test order flow without payment
3. Test UPI flow in **Production Mode** only

**For Production:**
1. Switch to production Razorpay keys
2. Configure webhook URL in Razorpay Dashboard
3. Test with real UPI payments
4. Monitor webhook delivery

### Switching to Production

When ready for production:

1. **Razorpay Dashboard:**
   - Get production Key ID and Secret
   - Configure production webhook URL
   - Test webhook delivery

2. **Backend Configuration:**
   - Update `RAZORPAY_KEY_ID` with production key
   - Update `RAZORPAY_KEY_SECRET` with production secret
   - Update `RAZORPAY_WEBHOOK_SECRET` with production webhook secret

3. **Frontend:**
   - No changes needed - uses keys from backend payment response

### Troubleshooting

**Issue:** Handler called but no payment request received
- **Cause:** Test mode limitation
- **Solution:** Use test cards or switch to production mode

**Issue:** Verification fails even after entering UPI ID
- **Cause:** Webhook may not fire in test mode for UPI
- **Solution:** This is expected behavior - webhooks work reliably in production

**Issue:** Payment shows success but order not confirmed
- **Cause:** Webhook not received or verification failed
- **Solution:** Check Razorpay dashboard for payment status, verify webhook configuration

