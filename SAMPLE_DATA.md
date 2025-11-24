# Sample Data Structure for Firestore

This document provides examples of how to structure data in Firestore for the ACM NUML website.

## Events Collection

### Example Event Document

**Document ID:** `event-001` (or auto-generated)

```json
{
  "title": "React Workshop 2024",
  "description": "Join us for an intensive workshop on React fundamentals. Learn about components, hooks, and state management.",
  "date": "2024-03-15T10:00:00Z", // Firestore Timestamp
  "time": "10:00 AM - 2:00 PM",
  "location": "NUML Campus, Computer Lab 3",
  "type": "Workshop",
  "imageUrl": "https://example.com/react-workshop.jpg" // Optional
}
```

**Event Types:**
- `Workshop`
- `Hackathon`
- `Talk`
- `Visit`
- `Other`

### Creating Events in Firestore Console

1. Go to Firestore Database
2. Click "Start collection"
3. Collection ID: `events`
4. Add document with fields above
5. For `date` field, use "timestamp" type and select a date/time

## Team Collection

### Example Team Member Document

**Document ID:** `member-001` (or auto-generated)

```json
{
  "name": "Ahmed Ali",
  "role": "President",
  "bio": "Final year Computer Science student passionate about web development and AI.",
  "email": "ahmed.ali@numl.edu.pk",
  "image": "https://example.com/ahmed.jpg", // Optional - use image URL
  "linkedin": "https://linkedin.com/in/ahmedali", // Optional
  "github": "https://github.com/ahmedali", // Optional
  "twitter": "https://twitter.com/ahmedali", // Optional
  "order": 1 // Lower numbers appear first
}
```

**Role Options:**
- `President`
- `Vice President`
- `Secretary`
- `Treasurer`
- `Member`

### Creating Team Members

1. Collection ID: `team`
2. Add fields as shown above
3. Set `order` field to control display order (1 = first, 2 = second, etc.)

## Gallery Collection

### Example Gallery Image Document

**Document ID:** `image-001` (or auto-generated)

```json
{
  "url": "https://example.com/gallery/event-photo-1.jpg",
  "caption": "Students participating in the React Workshop",
  "eventName": "React Workshop 2024", // Optional
  "uploadDate": "2024-03-15T12:00:00Z" // Firestore Timestamp
}
```

### Adding Gallery Images

**Option 1: Using Firebase Storage**

1. Go to Firebase Storage
2. Upload images to a folder (e.g., `gallery/`)
3. Get the download URL for each image
4. Use that URL in the `url` field

**Option 2: Using External URLs**

- Use any publicly accessible image URL
- Ensure CORS is enabled if needed

### Creating Gallery Documents

1. Collection ID: `gallery`
2. Add `url`, `caption`, `eventName` (optional), and `uploadDate`
3. Images will be displayed in reverse chronological order (newest first)

## Contacts Collection

This collection is automatically created when users submit the contact form. No manual setup needed.

### Example Contact Submission

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about membership",
  "message": "I would like to know more about joining ACM NUML...",
  "timestamp": "2024-03-15T14:30:00Z" // Auto-generated
}
```

## Quick Setup Script

You can use the Firebase Console to add sample data, or use the Firebase Admin SDK. Here's a quick reference:

### Sample Events to Add

1. **Upcoming Workshop**
   - Title: "Introduction to Machine Learning"
   - Date: Future date
   - Type: Workshop
   - Location: "NUML Campus"

2. **Past Event**
   - Title: "Web Development Bootcamp 2023"
   - Date: Past date
   - Type: Workshop
   - Location: "NUML Campus"

3. **Hackathon**
   - Title: "NUML Hackathon 2024"
   - Date: Future date
   - Type: Hackathon
   - Location: "NUML Campus"

### Sample Team Members

1. **President**
   - Name: Your name
   - Role: President
   - Order: 1

2. **Vice President**
   - Name: VP name
   - Role: Vice President
   - Order: 2

3. **Secretary**
   - Name: Secretary name
   - Role: Secretary
   - Order: 3

## Tips

1. **Dates**: Always use Firestore Timestamp type for dates
2. **Images**: Use high-quality images (recommended: 1200x800px for events, square for team members)
3. **Ordering**: Use the `order` field for team members to control display sequence
4. **URLs**: Ensure all image URLs are publicly accessible
5. **Validation**: Double-check field names match exactly (case-sensitive)

## Firestore Indexes

If you get index errors when querying:
1. Firebase will provide a link to create the required index
2. Click the link and create the index
3. Wait a few minutes for indexing to complete

Common indexes needed:
- `events` collection: `date` (ascending)
- `gallery` collection: `uploadDate` (descending)
- `team` collection: `order` (ascending)

