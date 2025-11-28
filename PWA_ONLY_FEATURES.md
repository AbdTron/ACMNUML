# PWA-Only Features

## Overview
Certain features are now **only available in the installed PWA app**, not in the browser version. This provides a better user experience by distinguishing between the website and the app.

## PWA-Only Features

### 1. Splash Screen ✅
- **Shows**: Only when app is opened as PWA (installed app)
- **Does NOT show**: In browser/website view
- **Content**: ACM NUML logo with "by Abdullah Irshad" credit
- **Duration**: 1 second

### 2. Notification Prompts ✅
- **Shows**: Only when app is opened as PWA
- **Does NOT show**: In browser/website view
- **Purpose**: Request permission for push notifications
- **Timing**: Appears 3 seconds after app opens (if permission not yet granted)

## How PWA Detection Works

The app uses multiple methods to detect if it's running as a PWA:

1. **Display Mode Check**: `window.matchMedia('(display-mode: standalone)')`
   - Most reliable method for Chrome, Edge, Firefox

2. **iOS Safari Check**: `window.navigator.standalone === true`
   - Detects iOS Safari when added to home screen

3. **Fullscreen Mode Check**: `window.matchMedia('(display-mode: fullscreen)')`
   - Catches fullscreen PWA installations

4. **Minimal UI Check**: Heuristic for Android Chrome
   - Detects when browser UI is minimized

## Service Worker Auto-Updates

### Automatic Updates ✅
- **No manual refresh required** - Updates happen automatically
- Service workers check for updates:
  - Immediately on page load
  - Every 5 minutes (main service worker)
  - Every 1 minute (FCM service worker)
- When a new version is detected:
  - New service worker installs in background
  - Automatically activates and reloads the page
  - Old caches are automatically cleared
  - Users get the latest version seamlessly

### Cache Management
- **Old caches**: Automatically deleted when new service worker activates
- **Cache version**: Updated to `v3` to force refresh of old content
- **No user action needed**: Everything happens automatically

## Testing

### Test PWA Mode
1. Install the app on your device (Add to Home Screen)
2. Open the app from home screen
3. You should see:
   - ✅ Splash screen on first open
   - ✅ Notification prompt (after 3 seconds, if not granted)

### Test Browser Mode
1. Open the website in a regular browser tab
2. You should NOT see:
   - ❌ Splash screen
   - ❌ Notification prompt

### Verify PWA Detection
Open browser console and run:
```javascript
// Should return true in PWA, false in browser
window.matchMedia('(display-mode: standalone)').matches
```

## User Experience

### For Website Users
- Clean, standard website experience
- No splash screen interruption
- No notification prompts
- All website features work normally

### For App Users
- Professional app-like experience with splash screen
- Notification prompts for staying updated
- Automatic updates (no manual refresh needed)
- Better engagement with push notifications

## Technical Details

### Files Modified
- `src/utils/isPWA.js` - PWA detection utility
- `src/components/SplashScreen.jsx` - PWA-only splash screen
- `src/components/NotificationService.jsx` - PWA-only notifications
- `src/main.jsx` - Improved service worker auto-update
- `public/sw.js` - Better cache management

### Service Worker Update Strategy
- **updateViaCache: 'none'** - Always check server for updates
- **Periodic checks** - Automatic background updates
- **Skip waiting** - Immediate activation of new workers
- **Auto-reload** - Seamless transition to new version

## Notes

- Users don't need to know about cache clearing - it's automatic
- Service workers update in the background
- New versions are deployed automatically when you run `firebase deploy`
- Users will get updates within 5 minutes of deployment (or on next page load)

