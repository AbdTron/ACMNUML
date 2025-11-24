# Deployment Guide for ACM NUML Website

## Prerequisites

1. Node.js (v16 or higher)
2. Firebase account
3. Domain access for `acm.atrons.net`

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "acmnuml-website")
4. Follow the setup wizard

### 2.2 Enable Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **test mode** (we'll update rules later)
4. Choose a location closest to your users

### 2.3 Enable Storage (Optional, for gallery images)

1. Go to "Storage"
2. Click "Get started"
3. Use default security rules for now

### 2.4 Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (`</>`)
4. Register app with nickname "ACM NUML Website"
5. Copy the `firebaseConfig` object

### 2.5 Update Firebase Config

Open `src/config/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}
```

### 2.6 Update Firebase Project ID

Open `.firebaserc` and replace `your-firebase-project-id` with your actual project ID.

## Step 3: Set Up Firestore Data Structure

### 3.1 Create Collections

In Firestore, create the following collections:

#### Events Collection (`events`)
Each document should have:
```javascript
{
  title: "Workshop on React",
  description: "Learn React from scratch...",
  date: Timestamp, // Firestore timestamp
  time: "10:00 AM",
  location: "NUML Campus",
  type: "Workshop", // Workshop, Hackathon, Talk, Visit, Other
  imageUrl: "https://..." // Optional
}
```

#### Team Collection (`team`)
Each document should have:
```javascript
{
  name: "John Doe",
  role: "President", // President, Vice President, Secretary, Treasurer, Member
  bio: "Computer Science student...",
  email: "john@example.com", // Optional
  image: "https://...", // Optional
  linkedin: "https://...", // Optional
  github: "https://...", // Optional
  twitter: "https://...", // Optional
  order: 1 // For sorting (lower numbers first)
}
```

#### Gallery Collection (`gallery`)
Each document should have:
```javascript
{
  url: "https://...", // Image URL
  caption: "Workshop event photo",
  eventName: "React Workshop", // Optional
  uploadDate: Timestamp // Firestore timestamp
}
```

#### Contacts Collection (`contacts`)
This will be auto-created when users submit the contact form. Structure:
```javascript
{
  name: "User Name",
  email: "user@example.com",
  subject: "Question about...",
  message: "Message content...",
  timestamp: Timestamp
}
```

### 3.2 Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## Step 4: Update Google Form URL (Optional)

If you want to use Google Forms for the join page:

1. Create a Google Form
2. Open `src/pages/Join.jsx`
3. Find `const googleFormUrl = 'https://forms.gle/YOUR_FORM_ID'`
4. Replace with your actual Google Form URL

## Step 5: Build and Test Locally

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Step 6: Deploy to Firebase Hosting

### 6.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 6.2 Login to Firebase

```bash
firebase login
```

### 6.3 Initialize Firebase (if not done)

```bash
firebase init
```

Select:
- ✅ Hosting
- ✅ Firestore
- Use existing project
- Select your project
- Public directory: `dist`
- Single-page app: `Yes`
- Overwrite index.html: `No`

### 6.4 Deploy

```bash
# Build first
npm run build

# Deploy
firebase deploy
```

Or deploy only hosting:
```bash
firebase deploy --only hosting
```

## Step 7: Set Up Custom Domain

### 7.1 Add Custom Domain in Firebase

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter `acm.atrons.net`
4. Click "Continue"

### 7.2 Configure DNS

Firebase will provide DNS records. Add them to your domain registrar:

**Type A records:**
- Add the provided A records to your DNS settings

**Or use CNAME (if supported):**
- Add CNAME record pointing to Firebase hosting

### 7.3 SSL Certificate

Firebase automatically provisions SSL certificates. Wait for verification (can take a few hours).

### 7.4 Verify Domain

Once DNS propagates (can take up to 48 hours), Firebase will verify and activate your domain.

## Step 8: Update Firestore Security Rules

After initial setup, update `firestore.rules` for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Add authentication checks for write operations
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.admin == true;
    }
    // Similar for other collections...
  }
}
```

## Step 9: Ongoing Maintenance

### Adding Events
- Go to Firestore Console
- Add documents to `events` collection
- Use Firestore Timestamp for dates

### Adding Team Members
- Add documents to `team` collection
- Set `order` field for display order

### Adding Gallery Images
- Upload images to Firebase Storage
- Get public URL
- Add document to `gallery` collection with URL

## Troubleshooting

### Build Errors
- Check Node.js version: `node --version` (should be 16+)
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Firebase Connection Issues
- Verify Firebase config in `src/config/firebase.js`
- Check Firestore rules allow reads
- Ensure Firestore is enabled in Firebase Console

### Domain Not Working
- Check DNS propagation: `nslookup acm.atrons.net`
- Verify DNS records in domain registrar
- Wait up to 48 hours for full propagation

### Images Not Loading
- Check image URLs are publicly accessible
- For Firebase Storage, ensure rules allow public reads
- Verify CORS settings if using external image hosting

## Support

For issues or questions:
- Check Firebase documentation: https://firebase.google.com/docs
- React documentation: https://react.dev
- Firestore documentation: https://firebase.google.com/docs/firestore

