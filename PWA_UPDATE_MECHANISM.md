# PWA Service Worker Update Mechanism

## How Updates Work for Installed PWA Apps

### ✅ Yes, Service Worker Updates Work for Installed PWAs

The service worker cache update mechanism works **identically** for:
- **Browser tabs** (website view)
- **Installed PWA apps** (standalone app)

### How It Works

#### 1. **Service Worker Registration**
- Service worker is registered when the app loads (browser or installed PWA)
- Uses `updateViaCache: 'none'` to always check for updates
- Works the same regardless of how the app is opened

#### 2. **Update Detection**
Updates are checked:
- **On app open** - When user opens the installed PWA app
- **On page load** - When user visits the website
- **On visibility change** - When app comes to foreground (for installed PWAs)

#### 3. **Automatic Update Process**
When you deploy a new version:

1. **File Change Detected**
   - Browser/service worker detects that `sw.js` file has changed
   - This happens automatically - no user action needed

2. **New Service Worker Installs**
   - New service worker downloads and installs in background
   - Old service worker continues serving current version

3. **Activation**
   - New service worker sends `SKIP_WAITING` message
   - Old cache is automatically cleared
   - App automatically reloads with new version

4. **User Experience**
   - User sees the app reload
   - New version is now active
   - Old cache is cleared automatically

### Update Scenarios

#### Scenario 1: User Opens Installed PWA
```
1. User opens installed PWA app
2. Service worker checks for updates (on load)
3. If new version exists → downloads and activates
4. App reloads with new version
5. Old cache cleared automatically
```

#### Scenario 2: App Running in Background
```
1. User has PWA app open but minimized
2. You deploy new version
3. When app comes to foreground → checks for updates
4. Detects new version → downloads and activates
5. App reloads with new version
```

#### Scenario 3: App Closed
```
1. User closes installed PWA app
2. You deploy new version
3. User opens app again
4. Service worker checks for updates on open
5. Detects new version → downloads and activates
6. App reloads with new version
```

### Cache Management

#### Cache Clearing
- **Only happens when service worker updates** (new deploy)
- Old caches are automatically deleted in `activate` event
- Only caches with different version name are deleted
- Current cache (`acm-numl-v3`) is preserved

#### Cache Version
- Current version: `acm-numl-v3`
- When you update cache version (e.g., to `v4`), old `v3` cache is deleted
- This ensures users always get fresh content after updates

### Technical Details

#### Service Worker Lifecycle
```
Install → Activate → Control
   ↓         ↓          ↓
Cache    Clear Old   Serve
Resources  Caches    Requests
```

#### Update Check Triggers
1. **Page Load** - `window.addEventListener('load')`
2. **Visibility Change** - `document.addEventListener('visibilitychange')`
3. **Manual Update** - `registration.update()`

#### Automatic Reload
- When new service worker is detected
- App automatically calls `window.location.reload()`
- User sees seamless update (brief reload)

### Testing Updates

#### Test in Installed PWA:
1. Install the PWA app on your device
2. Make a change to your code
3. Build and deploy: `npm run build && firebase deploy`
4. Open the installed PWA app
5. App should automatically detect update and reload
6. Check console for: "New service worker version detected"

#### Test in Browser:
1. Open website in browser tab
2. Make a change to your code
3. Build and deploy: `npm run build && firebase deploy`
4. Refresh the page
5. Should see update message and reload

### Important Notes

✅ **Works for Installed PWAs**
- Service workers work identically in installed apps
- Updates are detected when app opens
- Automatic reload works in standalone mode

✅ **No User Action Required**
- Updates happen automatically
- Cache clears automatically
- App reloads automatically

✅ **Works Offline**
- Service worker continues to work even if app is offline
- Updates are queued and applied when connection is restored

⚠️ **First Load After Deploy**
- Users need to open/refresh the app once after you deploy
- After that, updates are automatic

### Browser Compatibility

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android)
- ⚠️ Safari (Desktop) - Limited support

### Summary

**Yes, the service worker cache update mechanism works perfectly for installed PWA apps!**

- Updates are detected automatically
- Cache is cleared automatically
- App reloads automatically
- Works the same as browser tabs
- No user action required

The only requirement is that users open the app at least once after you deploy a new version. After that, the update process is completely automatic.

