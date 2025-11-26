# PWA (Progressive Web App) Setup

This website is now configured as a Progressive Web App (PWA), allowing users to install it on their devices like a native app.

## Features

- ✅ **Installable**: Users can add the app to their home screen
- ✅ **Offline Support**: Basic offline functionality via service worker
- ✅ **App-like Experience**: Standalone display mode when installed
- ✅ **Splash Screen**: Uses ACM logo as splash art
- ✅ **Install Prompt**: Automatic prompt for installation on supported browsers

## Icon Requirements

The app uses the ACM logo for icons. For best results, you should create properly sized icons:

- **icon-192.png**: 192x192 pixels (required)
- **icon-512.png**: 512x512 pixels (required)
- **apple-touch-icon.png**: 180x180 pixels (for iOS)

Currently, the logo has been copied to these files, but for optimal display, you should:

1. Use an image editor to resize the logo to the exact dimensions
2. Ensure the logo is centered and looks good at each size
3. Replace the files in the `public` folder

## How Users Install the App

### On Mobile (Android/Chrome):
1. Visit the website
2. Look for the "Install" prompt that appears at the bottom
3. Tap "Install" or use the browser menu → "Add to Home Screen"
4. The app will be installed with the ACM logo as the icon

### On Mobile (iOS/Safari):
1. Visit the website in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will be installed with the ACM logo

### On Desktop (Chrome/Edge):
1. Visit the website
2. Look for the install icon in the address bar
3. Click it and confirm installation
4. The app will open in a standalone window

## Manifest Configuration

The `manifest.json` file includes:
- App name: "ACM NUML Lahore"
- Short name: "ACM NUML"
- Theme color: Blue (#2563eb)
- Background color: Dark (#0f172a)
- Display mode: Standalone
- App shortcuts for Events, Team, and Gallery

## Service Worker

The service worker (`sw.js`) provides:
- Basic offline caching
- Automatic cache updates
- Network-first strategy with cache fallback

## Testing

To test the PWA:

1. **Development**: Run `npm run dev` and visit `http://localhost:3000`
2. **Production**: Build with `npm run build` and serve the `dist` folder
3. **HTTPS Required**: PWAs require HTTPS in production (or localhost for development)

## Browser Support

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android)
- ⚠️ Safari (Desktop) - Limited support

## Notes

- The install prompt will only show once per session
- Users who have already installed the app won't see the prompt
- The app works offline with cached resources
- Updates are handled automatically by the service worker

