# Admin Panel Features

Complete overview of all admin features available in the ACM NUML website.

## 🔐 Authentication System

### Login Page (`/admin/login`)
- Secure email/password authentication
- Access control based on Firestore `admins` collection
- Automatic redirect to dashboard after login
- Error handling for invalid credentials

### Protected Routes
- All admin routes require authentication
- Automatic redirect to login if not authenticated
- Role-based access control

## 📊 Admin Dashboard (`/admin`)

### Overview Statistics
- **Events Count**: Total number of events in database
- **Notifications Count**: Total notifications created
- **Team Members Count**: Number of team members
- **Gallery Images Count**: Total images in gallery
- **Contact Messages Count**: Messages received via contact form

### Quick Actions
- Direct links to all management sections
- Visual cards with icons for easy navigation

## 📅 Events Management (`/admin/events`)

### Add New Events
- **Title**: Event name
- **Description**: Detailed event information
- **Date**: Event date (date picker)
- **Time**: Event time (e.g., "10:00 AM - 2:00 PM")
- **Location**: Event venue
- **Type**: Workshop, Hackathon, Talk, Visit, or Other

### Edit Events
- Click edit button on any event
- Modify all event details
- Update event information in real-time

### Move to Past Events
- One-click button to move upcoming events to past
- Automatically sets event date to yesterday
- Useful for events that have concluded

### Delete Events
- Remove events from database
- Confirmation dialog to prevent accidental deletion

### Event Status Display
- Visual badges showing event status:
  - **Upcoming**: Green badge
  - **Today**: Yellow badge
  - **Past**: Gray badge

## 🔔 Notifications Management (`/admin/notifications`)

### Create Popup Notifications
- **Title**: Notification headline
- **Message**: Notification content
- **Link** (Optional): URL for "Learn More" button
- **Active Status**: Toggle notification on/off

### Features
- **Activate/Deactivate**: Toggle notifications without deleting
- **Edit**: Update notification content anytime
- **Delete**: Remove notifications permanently
- **Auto-display**: Active notifications appear as popups on site visit
- **Dismissible**: Users can close notifications (stored in localStorage)

### Notification Behavior
- Only one active notification shown at a time
- Most recent active notification takes priority
- Dismissed notifications won't show again for that user
- Appears in top-right corner on desktop, top on mobile

## ⚙️ Settings Management (`/admin/settings`)

### Form Links
- **Google Form URL**: Update join page form link
- Automatically updates on Join page

### Contact Information
- **Contact Email**: Primary contact email
- **Phone Number**: Contact phone
- **Address**: Physical address

### Social Media Links
- **Facebook**: Facebook page URL
- **Instagram**: Instagram profile URL
- **LinkedIn**: LinkedIn company page
- **Twitter**: Twitter handle URL
- **GitHub**: GitHub organization URL

### Site Details
- **Website URL**: Main website URL
- **Site Description**: Brief description for SEO/metadata

## 🎨 User Interface Features

### Responsive Design
- Works on desktop, tablet, and mobile
- Touch-friendly buttons and forms
- Optimized layouts for all screen sizes

### Modal Forms
- Clean modal dialogs for adding/editing
- Click outside to close
- Form validation
- Loading states

### Data Tables
- Sortable event lists
- Status indicators
- Quick action buttons
- Empty state messages

### Visual Feedback
- Success/error alerts
- Loading indicators
- Confirmation dialogs
- Status badges

## 🔒 Security Features

### Authentication
- Firebase Authentication integration
- Secure password storage
- Session management

### Access Control
- Admin-only routes
- Firestore rules enforcement
- Role-based permissions

### Data Validation
- Form validation
- Input sanitization
- Error handling

## 📱 Navigation

### Admin Link in Navbar
- Appears automatically for logged-in admins
- Direct access to dashboard
- Shield icon for identification

### Breadcrumb Navigation
- Back buttons on all admin pages
- Clear navigation hierarchy
- Easy return to dashboard

## 🚀 Quick Actions

### From Dashboard
1. **Manage Events** → Add, edit, or delete events
2. **Notifications** → Create popup notifications
3. **Settings** → Update site configuration

### From Events Page
- Add new event (top right button)
- Edit event (edit icon)
- Move to past (action button)
- Delete event (trash icon)

### From Notifications Page
- Create notification (top right button)
- Toggle active status (toggle button)
- Edit notification (edit button)
- Delete notification (delete button)

## 📝 Data Management

### Real-time Updates
- Changes reflect immediately
- No page refresh needed
- Live data synchronization

### Data Persistence
- All data stored in Firestore
- Automatic backups
- Version history (if enabled)

### Bulk Operations
- View all events at once
- Filter by status
- Quick status changes

## 🎯 Best Practices

### Event Management
- Add events well in advance
- Update event details as needed
- Move events to past after completion
- Delete only if necessary

### Notifications
- Keep notifications concise
- Use active status to control visibility
- Update links when needed
- Remove old notifications

### Settings
- Update form links when forms change
- Keep contact information current
- Maintain social media links
- Review settings periodically

## 🔧 Technical Details

### Technologies Used
- React 18
- Firebase Authentication
- Firestore Database
- React Router
- React Icons

### File Structure
```
src/
├── context/
│   └── AuthContext.jsx      # Authentication context
├── components/
│   ├── ProtectedRoute.jsx   # Route protection
│   └── NotificationPopup.jsx # Notification display
└── pages/
    └── admin/
        ├── AdminLogin.jsx
        ├── AdminDashboard.jsx
        ├── AdminEvents.jsx
        ├── AdminNotifications.jsx
        └── AdminSettings.jsx
```

## 📚 Documentation

- **ADMIN_SETUP.md**: Setup instructions
- **DEPLOYMENT.md**: Deployment guide
- **SAMPLE_DATA.md**: Data structure examples

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase configuration
3. Check Firestore rules are deployed
4. Ensure admin user exists in `admins` collection
5. Review ADMIN_SETUP.md for setup steps

