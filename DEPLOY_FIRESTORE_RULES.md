# Deploy Firestore Rules

The Firestore security rules need to be deployed to Firebase for voting to work.

## Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste it into the rules editor
6. Click **Publish**

## Option 2: Using Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy only the rules
firebase deploy --only firestore:rules
```

## Option 3: Using npm script (if configured)

```bash
npm run deploy:rules
```

## Verify Deployment

After deploying, try voting on a forum post. The permission error should be resolved.

## Current Rules Summary

The rules allow:
- ✅ Anyone to read posts (public forum)
- ✅ Authenticated users to create posts
- ✅ Post authors to update/delete their own posts
- ✅ Admins to update/delete any post
- ✅ **Authenticated users to vote on posts** (as long as authorId doesn't change)


