# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for image uploads in the ACM NUML website.

## The Problem

If you're seeing errors like:
- "Bucket not found"
- "Failed to load resource: the server responded with a status of 404"
- "Image upload failed: Error: Bucket not found"

This means the Supabase storage bucket hasn't been created yet.

## Solution: Create the Storage Bucket

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in with your account
3. Select your project (or create a new one if needed)

### Step 2: Navigate to Storage

1. In the left sidebar, click on **"Storage"**
2. You should see a list of buckets (if any exist)

### Step 3: Create a New Bucket

1. Click the **"New bucket"** button (or **"Create bucket"**)
2. Fill in the bucket details:
   - **Name**: `media` (this is the default name used by the app)
   - **Public bucket**: ✅ **Check this box** (important for public image access)
   - **File size limit**: Leave default or set to 5MB
   - **Allowed MIME types**: Leave empty (allows all image types)
3. Click **"Create bucket"**

### Step 4: Set Bucket Policies (Important!)

After creating the bucket, you need to set up policies to allow public access:

1. Click on the **`media`** bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"** or use a template
5. Create a policy for **SELECT** (read access):
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'media'::text)
     ```
   - **Target roles**: `public`, `anon`
   - Click **"Review"** then **"Save policy"**

6. Create a policy for **INSERT** (upload access):
   - **Policy name**: `Public upload access`
   - **Allowed operation**: `INSERT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'media'::text)
     ```
   - **Target roles**: `public`, `anon`
   - Click **"Review"** then **"Save policy"**

7. Create a policy for **DELETE** (delete access):
   - **Policy name**: `Public delete access`
   - **Allowed operation**: `DELETE`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'media'::text)
     ```
   - **Target roles**: `public`, `anon`
   - Click **"Review"** then **"Save policy"**

### Step 5: Verify Bucket Configuration

1. Go back to the **Storage** page
2. You should see the `media` bucket listed
3. The bucket should show as **"Public"**

### Step 6: (Optional) Create .env File

If you want to customize the bucket name or use different Supabase credentials:

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=https://vtphwfdsorogemcmcnyf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0cGh3ZmRzb3JvZ2VtY21jbnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzAxOTMsImV4cCI6MjA3OTU0NjE5M30.BAR8huPc4eghksLrGfxZCFzS4TMDUhy5xqvied6wXJM
VITE_SUPABASE_BUCKET=media
```

**Note**: The app will use these values if provided, otherwise it will use the defaults from `src/config/supabase.js`.

## Testing the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Go to the admin panel and try uploading an image to an event
3. The upload should now work without errors

## Troubleshooting

### Still getting "Bucket not found" error?

1. **Verify bucket name**: Make sure the bucket is named exactly `media` (case-sensitive)
2. **Check Supabase project**: Ensure you're using the correct Supabase project URL
3. **Restart dev server**: After creating the bucket, restart your development server
4. **Check browser console**: Look for more detailed error messages

### Getting permission errors?

1. **Check bucket is public**: The bucket must be marked as "Public"
2. **Verify policies**: Make sure all three policies (SELECT, INSERT, DELETE) are created
3. **Check anon key**: Ensure your anon key is correct in the `.env` file or `supabase.js`

### Images not displaying?

1. **Check bucket policies**: Make sure SELECT policy allows public access
2. **Verify URLs**: Check that the generated URLs are correct
3. **Check CORS**: Supabase should handle CORS automatically, but verify in browser console

## Alternative: Using a Different Bucket Name

If you want to use a different bucket name (e.g., `acm-media`):

1. Create the bucket with your desired name in Supabase
2. Add to your `.env` file:
   ```env
   VITE_SUPABASE_BUCKET=acm-media
   ```
3. Restart your development server

## Security Notes

- The bucket policies allow public read/write access, which is fine for public images
- For production, you might want to restrict INSERT/DELETE to authenticated users only
- The anon key is safe to use in client-side code (it's designed for public use)

## Need Help?

If you're still having issues:
1. Check the Supabase documentation: https://supabase.com/docs/guides/storage
2. Verify your Supabase project is active and not paused
3. Check the Supabase project settings for any restrictions




