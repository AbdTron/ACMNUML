# Testing Locally

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Go to `http://localhost:3000`
   - The website should load even without Firebase configured

## What to Expect

### Without Firebase Configured
- ✅ Website will load and display
- ✅ All pages will be accessible
- ⚠️ Data sections will be empty (no events, team, gallery)
- ⚠️ Console will show: "⚠️ Firebase not configured"
- ✅ You can navigate all pages and see the UI

### With Firebase Configured
- ✅ All features work
- ✅ Data loads from Firestore
- ✅ Admin panel accessible

## Testing Checklist

### Basic Navigation
- [ ] Home page loads
- [ ] All navigation links work
- [ ] Footer displays correctly
- [ ] Mobile menu works (on small screens)

### Pages to Test
- [ ] `/` - Home page
- [ ] `/events` - Events page (will be empty without Firebase)
- [ ] `/team` - Team page (will be empty without Firebase)
- [ ] `/gallery` - Gallery page (will be empty without Firebase)
- [ ] `/join` - Join page
- [ ] `/about` - About page
- [ ] `/contact` - Contact page

### Admin Panel (Requires Firebase)
- [ ] `/admin/login` - Login page
- [ ] Login with admin credentials
- [ ] `/admin` - Dashboard
- [ ] `/admin/events` - Events management
- [ ] `/admin/notifications` - Notifications management
- [ ] `/admin/settings` - Settings management

## Common Issues

### "Can't reach" Error
**Solution:**
1. Make sure the dev server is running (`npm run dev`)
2. Check the terminal for the correct URL (usually `http://localhost:3000`)
3. Try `http://127.0.0.1:3000` instead
4. Check if another application is using port 3000

### Port Already in Use
**Solution:**
```bash
# Change port in vite.config.js or use:
npm run dev -- --port 3001
```

### Firebase Errors in Console
**This is normal if Firebase isn't configured yet!**
- The app will still work
- You'll see warnings in the console
- Configure Firebase to enable full functionality

### Blank Pages
- Check browser console for errors
- Make sure all dependencies are installed (`npm install`)
- Try clearing browser cache

## Next Steps

1. **Test the UI** - Navigate around and see how it looks
2. **Configure Firebase** - Follow `DEPLOYMENT.md` Step 2
3. **Add Sample Data** - Follow `SAMPLE_DATA.md`
4. **Test Admin Panel** - Follow `ADMIN_SETUP.md`

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

