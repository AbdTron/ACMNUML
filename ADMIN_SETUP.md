# Admin Panel Setup Guide

This guide will help you set up the admin authentication system for your ACM NUML website.

## Prerequisites

1. Firebase project created
2. Firebase Authentication enabled
3. Firestore Database enabled

## Step 1: Enable Firebase Authentication

1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

## Step 2: Create Admin Users

### Option A: Using Firebase Console (Recommended for first admin)

1. Go to Firebase Console > Authentication
2. Click "Add user"
3. Enter email and password
4. Copy the User UID

### Option B: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login
firebase login

# Use Firebase Admin SDK to create users programmatically
```

## Step 3: Set Up Admin Collection in Firestore

1. Go to Firestore Database
2. Create a new collection called `admins`
3. For each admin user, create a document with:
   - **Document ID**: The User UID from Authentication
   - **Fields**:
     ```json
     {
       "role": "admin",
       "email": "admin@acmnuml.com",
       "createdAt": "2024-01-01T00:00:00Z"
     }
     ```

### Example Admin Document

**Collection:** `admins`  
**Document ID:** `abc123xyz789` (User UID)  
**Fields:**
```json
{
  "role": "admin",
  "email": "president@acmnuml.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Step 4: Access Admin Panel

1. Navigate to `/admin/login` on your website
2. Login with the email and password you created
3. You'll be redirected to the admin dashboard

## Step 5: Deploy Firestore Rules

The Firestore rules have been updated to allow authenticated users to write data. Deploy them:

```bash
firebase deploy --only firestore:rules
```

## Admin Panel Features

### Dashboard (`/admin`)
- Overview statistics
- Quick access to all management sections

### Events Management (`/admin/events`)
- **Add Events**: Create new events with title, description, date, time, location, and type
- **Edit Events**: Update existing event details
- **Move to Past**: Quickly move upcoming events to past events
- **Delete Events**: Remove events from the database

### Notifications Management (`/admin/notifications`)
- **Create Notifications**: Add popup notifications that appear when users visit the site
- **Activate/Deactivate**: Toggle notifications on/off
- **Edit/Delete**: Update or remove notifications
- **Link Support**: Add optional links to notifications

### Settings (`/admin/settings`)
- **Google Form URL**: Update the join form URL
- **Contact Information**: Update email, phone, and address
- **Social Media Links**: Update all social media links
- **Site Details**: Update website URL and description

## Security Notes

1. **Admin Collection**: Only users with documents in the `admins` collection can access the admin panel
2. **Firestore Rules**: The rules allow authenticated users to write, but you should verify admin status in your code (already implemented)
3. **Password Security**: Use strong passwords for admin accounts
4. **Regular Updates**: Regularly review and update admin access

## Adding More Admins

1. Create user in Firebase Authentication
2. Add document to `admins` collection with their User UID
3. They can now login at `/admin/login`

## Removing Admin Access

1. Delete the document from `admins` collection in Firestore
2. Optionally delete the user from Authentication

## Troubleshooting

### "Access denied" error
- Check that the user exists in the `admins` collection
- Verify the document ID matches the User UID exactly
- Check Firestore rules are deployed

### Can't login
- Verify Email/Password authentication is enabled
- Check that the user exists in Authentication
- Verify credentials are correct

### Can't save changes
- Check Firestore rules are deployed
- Verify you're logged in
- Check browser console for errors

## Best Practices

1. **Limit Admin Access**: Only give admin access to trusted team members
2. **Regular Backups**: Regularly backup your Firestore data
3. **Monitor Activity**: Review Firestore activity logs regularly
4. **Strong Passwords**: Enforce strong password policies
5. **Two-Factor Authentication**: Consider enabling 2FA for admin accounts (requires additional setup)

## Admin Routes

- `/admin/login` - Login page
- `/admin` - Dashboard (protected)
- `/admin/events` - Events management (protected)
- `/admin/notifications` - Notifications management (protected)
- `/admin/settings` - Settings (protected)

All admin routes except `/admin/login` are protected and require authentication.

