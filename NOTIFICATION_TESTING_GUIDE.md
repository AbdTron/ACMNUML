# Firebase Cloud Messaging - Testing Guide

## Issues Fixed

### 1. Cache Issues ✅
- **Problem**: Old CSS/JS was being served from cache
- **Solution**: 
  - Updated cache version from `v2` to `v3`
  - Added automatic cache clearing on service worker update
  - Improved service worker registration order

### 2. Notification Issues ✅
- **Problem**: Test notifications not being received
- **Solution**:
  - Fixed FCM service worker registration (must be registered before getting token)
  - Added proper service worker registration to `getToken()` calls
  - Improved error handling and logging
  - Fixed message listener to continuously listen for messages

## How to Test Notifications

### Step 1: Clear Cache and Service Workers
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. **Service Workers**: Click "Unregister" for all
4. **Cache Storage**: Right-click → Delete all
5. **Local Storage**: Clear all (optional)
6. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 2: Get Your FCM Token
1. Open the app in your browser
2. Open DevTools Console (F12)
3. Wait for the notification permission prompt (appears after 3 seconds)
4. Click "Enable Notifications"
5. Look in the console for: `FCM Token: [your-token-here]`
6. **Copy this token** - you'll need it for testing

### Step 3: Verify Token in Firestore
1. Go to Firebase Console → Firestore Database
2. Check the `fcmTokens` collection
3. You should see a document with your token and device info

### Step 4: Send Test Notification

#### Option A: Firebase Console (Easiest)
1. Go to Firebase Console → Cloud Messaging
2. Click **"Send your first message"** or **"New notification"**
3. Enter:
   - **Title**: "Test Notification"
   - **Text**: "This is a test message"
4. Click **"Next"** → **"Send test message"**
5. Paste your FCM token (from Step 2)
6. Click **"Test"**
7. You should receive the notification!

#### Option B: Using cURL (Advanced)
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/acmnuml/messages:send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "YOUR_FCM_TOKEN",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test message"
      }
    }
  }'
```

### Step 5: Test Scenarios

#### Test 1: Foreground Notification (App Open)
1. Keep the app open in a browser tab
2. Send a test notification
3. You should see an in-app notification popup (top-right corner)

#### Test 2: Background Notification (App Minimized)
1. Minimize the browser or switch to another tab
2. Send a test notification
3. You should see a browser/system notification

#### Test 3: App Closed (Service Worker)
1. Close the browser completely
2. Send a test notification
3. You should see a system notification
4. Clicking it should open the app

## Troubleshooting

### Token Not Generated
- **Check**: Browser console for errors
- **Fix**: Make sure notification permission is granted
- **Fix**: Check that service worker is registered (DevTools → Application → Service Workers)

### Notifications Not Received
1. **Check Service Worker**:
   - DevTools → Application → Service Workers
   - Should see `/firebase-messaging-sw.js` registered
   - Status should be "activated and is running"

2. **Check Token**:
   - Token should be logged in console
   - Token should be saved in Firestore `fcmTokens` collection

3. **Check Browser Permissions**:
   - Browser settings → Site settings → Notifications
   - Should be "Allow" for your site

4. **Check Console Logs**:
   - Look for `[FCM SW]` prefixed messages
   - Should see "Background message received" when notification arrives

### Old CSS/JS Still Showing
1. **Hard Refresh**: `Ctrl + Shift + R`
2. **Clear Cache**: DevTools → Application → Clear Storage → Clear site data
3. **Unregister Service Workers**: DevTools → Application → Service Workers → Unregister
4. **Rebuild**: `npm run build` and redeploy

## Expected Console Logs

When everything works, you should see:
```
Firebase Messaging Service Worker registered: http://localhost:3000/
Notification permission granted
FCM Token: [long-token-string]
FCM token saved to Firestore
[FCM SW] Firebase initialized successfully
[FCM SW] Firebase Messaging initialized
```

When a notification arrives:
```
[FCM SW] Background message received: {...}
[FCM SW] Showing notification: Test Notification {...}
```

## Production Deployment

After deploying:
1. Users need to **hard refresh once** to get the new service worker
2. New users will automatically get the latest version
3. Old caches will be automatically cleared on first visit after update

## Notes

- **VAPID Key**: Already configured in `src/config/firebaseMessaging.js`
- **Service Worker**: Must be served over HTTPS (or localhost for dev)
- **Token Expiry**: Tokens can expire; the app will request a new one automatically
- **Multiple Devices**: Each device/browser gets its own unique token

