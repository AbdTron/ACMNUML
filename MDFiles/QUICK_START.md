# Quick Start Guide

Get your ACM NUML website up and running in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Copy your Firebase config from Project Settings
4. Paste it into `src/config/firebase.js`

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your website!

## 📝 Next Steps

1. **Add Sample Data**
   - See `SAMPLE_DATA.md` for data structure examples
   - Add events, team members, and gallery images to Firestore

2. **Customize Content**
   - Update social media links in `src/components/Footer.jsx`
   - Update contact information in `src/pages/Contact.jsx`
   - Add your Google Form URL in `src/pages/Join.jsx`

3. **Deploy**
   - Follow `DEPLOYMENT.md` for full deployment instructions
   - Connect your custom domain `acm.atrons.net`

## 🎨 Customization

### Colors
Edit CSS variables in `src/styles/index.css`:
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #7c3aed;
  --accent-color: #f59e0b;
}
```

### Logo
Replace the logo text in `src/components/Navbar.jsx` or add an image logo.

### Content
- Home page: `src/pages/Home.jsx`
- About page: `src/pages/About.jsx`
- Footer: `src/components/Footer.jsx`

## 📚 Documentation

- **DEPLOYMENT.md** - Full deployment guide
- **SAMPLE_DATA.md** - Firestore data structure examples
- **README.md** - Project overview

## ⚡ Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase
firebase deploy
```

## 🐛 Troubleshooting

**Port already in use?**
- Change port in `vite.config.js` or use `npm run dev -- --port 3001`

**Firebase connection errors?**
- Check your Firebase config in `src/config/firebase.js`
- Ensure Firestore is enabled in Firebase Console

**Build errors?**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## 🎉 You're Ready!

Your website is now set up. Start adding your content and deploy when ready!

