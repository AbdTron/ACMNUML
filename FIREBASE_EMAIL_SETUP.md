# Firebase Email Configuration to Prevent Spam

## Issue
Firebase password reset emails may go to spam folders. This is a common issue with Firebase Authentication emails.

## Solutions

### 1. Configure Authorized Domains in Firebase Console
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `yourdomain.com`)
3. Remove `localhost` from production (keep only for development)

### 2. Configure Email Templates (Recommended)
1. Go to Firebase Console → Authentication → Templates
2. Click on "Password reset" template
3. Customize the email:
   - **Subject**: Make it clear and professional (e.g., "Reset Your ACM NUML Password")
   - **Body**: Use a professional template with your branding
   - **Action URL**: Ensure it points to your domain

### 3. Set Up Custom Email Domain (Best Practice)
For production, consider using a custom email domain:
1. Go to Firebase Console → Authentication → Settings → Email templates
2. Configure custom SMTP (requires Firebase Blaze plan)
3. Use your own domain for sending emails (e.g., `noreply@yourdomain.com`)

### 4. Add SPF and DKIM Records
If using custom domain:
- Add SPF record: `v=spf1 include:_spf.google.com ~all`
- Add DKIM record (provided by Firebase)
- Add DMARC record for better deliverability

### 5. Test Email Deliverability
- Use tools like Mail-Tester.com to check spam score
- Test with different email providers (Gmail, Outlook, etc.)
- Monitor spam reports and adjust accordingly

### 6. Current Implementation
The code already includes:
- `handleCodeInApp: false` - Uses email links instead of in-app handling
- Proper error handling for common issues
- Action code settings with redirect URL

### Additional Notes
- Firebase emails from `noreply@firebaseapp.com` may have lower deliverability
- Consider upgrading to Firebase Blaze plan for custom SMTP
- Monitor email delivery rates in Firebase Console

