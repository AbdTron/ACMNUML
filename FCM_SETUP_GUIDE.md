# Firebase Cloud Messaging (FCM) Setup Guide

## ✅ What's Already Done

1. ✅ Firebase Cloud Messaging API (V1) is enabled
2. ✅ Sender ID configured: `1097867001966`
3. ✅ FCM service files created
4. ✅ Notification permission request component added
5. ✅ Background notification handler created

## 🔧 What You Need to Do

### Step 1: Get Your VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **acmnuml**
3. Go to **Project Settings** (gear icon)
4. Click on the **Cloud Messaging** tab
5. Scroll down to **Web Push certificates**
6. If you don't have a key pair:
   - Click **Generate key pair**
   - Copy the key that appears
7. If you already have one, copy the existing key

### Step 2: Add VAPID Key to Code

1. Open `src/config/firebaseMessaging.js`
2. Find this line:
   ```javascript
   const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'
   ```
3. Replace `'YOUR_VAPID_KEY_HERE'` with your actual VAPID key
4. Save the file

### Step 3: Test Notifications

1. **Build and deploy** your app
2. **Open the app** in a browser
3. **Allow notifications** when prompted (or click "Enable Notifications")
4. **Check the browser console** - you should see:
   - "Notification permission granted"
   - "FCM Token: [your-token]"
   - "FCM token saved to Firestore"

### Step 4: Send a Test Notification

#### Option A: Using Firebase Console (Easiest)

1. Go to Firebase Console → **Cloud Messaging**
2. Click **Send your first message**
3. Enter:
   - **Notification title**: "Test Notification"
   - **Notification text**: "This is a test message"
4. Click **Next**
5. Select **Send test message**
6. Paste your FCM token (from browser console)
7. Click **Test**

#### Option B: Using Firebase Admin SDK (For Production)

You can create a backend service to send notifications programmatically.

## 📱 How It Works

### Foreground Notifications (App is Open)
- When the app is open, notifications appear as in-app notifications
- Styled notification appears in the top-right corner
- Clicking navigates to the relevant page

### Background Notifications (App is Closed)
- When the app is closed, notifications appear as system notifications
- Handled by `firebase-messaging-sw.js`
- Clicking opens the app to the relevant page

### Token Management
- FCM tokens are automatically saved to Firestore collection `fcmTokens`
- Each device gets a unique token
- Tokens are stored with device info for targeted notifications

## 🔔 Sending Notifications

### From Firebase Console:
1. Firebase Console → Cloud Messaging → New Campaign
2. Create notification
3. Target: All users or specific segments
4. Schedule: Now or later

### From Code (Backend):
```javascript
// Using Firebase Admin SDK
const admin = require('firebase-admin')
const message = {
  notification: {
    title: 'New Event',
    body: 'Check out our latest workshop!'
  },
  data: {
    url: '/events/123'
  },
  token: 'user-fcm-token'
}
admin.messaging().send(message)
```

## 📋 Firestore Collection Structure

The app automatically creates a `fcmTokens` collection:

```
fcmTokens/
  └── device_1234567890_abc123/
      ├── token: "FCM_TOKEN_HERE"
      ├── deviceId: "device_1234567890_abc123"
      ├── createdAt: Timestamp
      ├── updatedAt: Timestamp
      ├── userAgent: "Mozilla/5.0..."
      └── platform: "Win32"
```

## 🐛 Troubleshooting

### Notifications Not Working?

1. **Check VAPID Key**: Make sure it's correctly added to `firebaseMessaging.js`
2. **Check Permissions**: User must grant notification permission
3. **Check Console**: Look for errors in browser console
4. **Check Service Worker**: Ensure `firebase-messaging-sw.js` is accessible at `/firebase-messaging-sw.js`
5. **HTTPS Required**: FCM requires HTTPS (except localhost)

### Common Issues:

- **"messaging/unsupported-browser"**: Browser doesn't support FCM
- **"messaging/permission-blocked"**: User denied permission
- **"messaging/invalid-vapid-key"**: VAPID key is incorrect
- **Token not generated**: Check browser console for errors

## ✅ Checklist

- [ ] VAPID key added to `firebaseMessaging.js`
- [ ] App built and deployed
- [ ] Notification permission granted
- [ ] FCM token visible in console
- [ ] Test notification sent successfully
- [ ] Foreground notifications working
- [ ] Background notifications working

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

