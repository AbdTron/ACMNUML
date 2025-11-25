# ACM NUML Website

Official website for the ACM (Association for Computing Machinery) Society at NUML University.

## Features

- 🎯 **Events Management**: Display upcoming and past events
- 👥 **Team Showcase**: Showcase society members and their roles
- 📸 **Gallery**: Photo gallery of past events
- 📝 **Join Us**: Application form for new members
- 📧 **Contact**: Contact form for inquiries
- 📱 **Responsive Design**: Mobile-friendly interface

## Tech Stack

- React 18
- Firebase (Firestore, Hosting)
- Vite
- React Router
- React Icons

## Media Storage

The project can optionally connect to Supabase Storage for event covers and team portraits.

1. Create a Supabase project (already provided: `acmnuml`).
2. Create a public storage bucket named `media`.
3. Set the bucket policy to allow public reads.
4. Add the Supabase URL, anon key, and bucket name to your `.env` file:

```
VITE_SUPABASE_URL=https://vtphwfdsorogemcmcnyf.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
VITE_SUPABASE_BUCKET=media
```

**Note:** The `.env` file is gitignored and should not be committed. Each developer needs to create their own `.env` file with these variables. See `.env.example` for a template.

Admin pages now let you upload images directly; the file is stored in the `media` bucket and only the public URL is saved in Firestore.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Copy your Firebase config from Project Settings
   - Update `src/config/firebase.js` with your config

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Firebase Deployment

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init
   ```

4. **Deploy**
   ```bash
   firebase deploy
   ```

## Custom Domain Setup

After deploying to Firebase:

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter `acm.atrons.net`
4. Follow the DNS configuration instructions
5. Firebase will provide DNS records to add to your domain registrar

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── config/        # Firebase configuration
├── styles/        # Global styles
└── utils/         # Utility functions
```

## License

MIT

