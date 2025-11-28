# Cache Clearing Instructions

## Problem
If you're seeing old CSS/JS elements after updates, the browser or service worker cache needs to be cleared.

## Quick Fix (For Users)

### Option 1: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Option 2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Clear Service Worker (For PWA)
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** for all service workers
5. Go to **Cache Storage** in the left sidebar
6. Right-click and **Delete** all caches
7. Reload the page

## For Developers

### Clear All Caches Programmatically
The app now automatically clears old caches when the service worker updates. The cache version has been updated to `acm-numl-v3`.

### Force Service Worker Update
1. Stop the dev server
2. Delete `node_modules/.vite` folder (if exists)
3. Restart the dev server
4. In browser DevTools → Application → Service Workers → Click "Update"

### Production Deployment
After deploying:
1. The new service worker will automatically activate
2. Old caches will be deleted
3. Users may need to hard refresh once to get the update

## Testing Cache Clear
1. Make a change to your code
2. Build: `npm run build`
3. Deploy to Firebase
4. Open the app in an incognito/private window to test fresh
5. Or use the hard refresh method above

