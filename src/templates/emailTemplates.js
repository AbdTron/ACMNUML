/**
 * Email templates for event registrations
 */

/**
 * Generate registration confirmation email HTML
 * @param {object} data - Email data
 * @returns {string} HTML email template
 */
export const registrationConfirmationTemplate = (data) => {
  const { eventTitle, eventDate, eventTime, eventLocation, registrationId, userName } = data
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Registration Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${userName || 'Member'},</p>
          <p>Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
          
          <div class="info-box">
            <h3>Event Details</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            ${eventTime ? `<p><strong>Time:</strong> ${eventTime}</p>` : ''}
            ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
            <p><strong>Registration ID:</strong> ${registrationId}</p>
          </div>
          
          <p>We look forward to seeing you at the event!</p>
          <p>If you have any questions, please contact us.</p>
        </div>
        <div class="footer">
          <p>ACM NUML - Computer Science Department</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate event reminder email HTML
 * @param {object} data - Email data
 * @returns {string} HTML email template
 */
export const eventReminderTemplate = (data) => {
  const { eventTitle, eventDate, eventTime, eventLocation, reminderTime, userName } = data
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Event Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${userName || 'Member'},</p>
          <p>This is a reminder that <strong>${eventTitle}</strong> is coming up in ${reminderTime}!</p>
          
          <div class="info-box">
            <h3>Event Details</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            ${eventTime ? `<p><strong>Time:</strong> ${eventTime}</p>` : ''}
            ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
          </div>
          
          <p>We hope to see you there!</p>
        </div>
        <div class="footer">
          <p>ACM NUML - Computer Science Department</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate waitlist notification email HTML
 * @param {object} data - Email data
 * @returns {string} HTML email template
 */
export const waitlistNotificationTemplate = (data) => {
  const { eventTitle, eventDate, waitlistPosition, userName } = data
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're on the Waitlist</h1>
        </div>
        <div class="content">
          <p>Dear ${userName || 'Member'},</p>
          <p>Thank you for your interest in <strong>${eventTitle}</strong>.</p>
          <p>The event is currently full, but we've added you to the waitlist.</p>
          
          <div class="info-box">
            <h3>Waitlist Information</h3>
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            ${waitlistPosition ? `<p><strong>Your Position:</strong> #${waitlistPosition}</p>` : ''}
          </div>
          
          <p>If a spot becomes available, we'll notify you immediately.</p>
        </div>
        <div class="footer">
          <p>ACM NUML - Computer Science Department</p>
        </div>
      </div>
    </body>
    </html>
  `
}



