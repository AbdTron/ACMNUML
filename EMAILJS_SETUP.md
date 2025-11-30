# EmailJS Setup Guide

This guide will help you set up EmailJS to send verification emails automatically.

## What is EmailJS?

EmailJS is a free email service that allows you to send emails directly from your frontend application without a backend server. It's perfect for sending verification emails, notifications, and more.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (100 emails/month free)
3. Verify your email address

## Step 2: Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions to connect your email
5. **Copy the Service ID** (you'll need this later)

## Step 3: Create Email Template

1. Go to **Email Templates** in EmailJS dashboard
2. Click **Create New Template**
3. Use this template:

**Template Name:** Display Email Verification

**Subject:** Verify Your Display Email - ACM NUML

**Content (HTML):**
```html
<h2>Verify Your Display Email</h2>
<p>Hello {{user_name}},</p>
<p>You requested to use this email address ({{to_email}}) as your display email on the ACM NUML members page.</p>
<p>Please click the link below to verify this email address:</p>
<p><a href="{{verification_url}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{{verification_url}}</p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>ACM NUML Team</p>
```

4. **Copy the Template ID** (you'll need this later)

## Step 4: Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** (also called API Key)
3. **Copy the Public Key**

## Step 5: Add Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID_DISPLAY_EMAIL=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Replace:**
- `your_service_id_here` with the Service ID from Step 2
- `your_template_id_here` with the Template ID from Step 3
- `your_public_key_here` with the Public Key from Step 4

## Step 6: Install EmailJS Package

Run this command in your terminal:

```bash
npm install @emailjs/browser
```

## Step 7: Restart Your Development Server

After adding the environment variables, restart your development server:

```bash
npm start
```

## Step 8: Test

1. Go to your profile edit page
2. Enter a display email address
3. Click "Verify Email"
4. Check the email inbox for the verification email
5. Click the verification link

## Troubleshooting

### Emails not sending?

1. **Check environment variables:** Make sure all three variables are set correctly
2. **Check EmailJS dashboard:** Verify your service and template are active
3. **Check browser console:** Look for any error messages
4. **Verify email limits:** Free tier allows 100 emails/month

### Email going to spam?

1. **Verify sender email:** Make sure your connected email is verified in EmailJS
2. **Check email content:** Avoid spam trigger words
3. **Use a custom domain:** For better deliverability, consider using a custom email domain

## Alternative: Firebase Functions

If you prefer a more secure backend solution, you can use Firebase Functions with nodemailer:

1. Set up Firebase Functions
2. Install nodemailer: `npm install nodemailer`
3. Create a Cloud Function to send emails
4. Call the function from your frontend

## Need Help?

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Support: [https://www.emailjs.com/support/](https://www.emailjs.com/support/)

