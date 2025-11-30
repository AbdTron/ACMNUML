/**
 * Email service utilities
 * Note: For production, you'll need to set up Firebase Functions or use an external service
 * like EmailJS, SendGrid, or AWS SES
 */

/**
 * Send registration confirmation email
 * @param {object} registrationData - Registration data
 * @param {object} eventData - Event data
 * @returns {Promise<void>}
 */
export const sendRegistrationConfirmation = async (registrationData, eventData) => {
  // TODO: Implement email sending via Firebase Functions or external service
  // For now, this is a placeholder that logs the email data
  console.log('Registration confirmation email:', {
    to: registrationData.email,
    subject: `Registration Confirmed: ${eventData.title}`,
    event: eventData.title,
    registrationId: registrationData.id
  })
  
  // Example implementation with EmailJS (requires setup):
  // import emailjs from '@emailjs/browser'
  // await emailjs.send(
  //   'service_id',
  //   'template_id',
  //   {
  //     to_email: registrationData.email,
  //     event_title: eventData.title,
  //     event_date: eventData.date,
  //     registration_id: registrationData.id
  //   }
  // )
}

/**
 * Send event reminder email
 * @param {object} registrationData - Registration data
 * @param {object} eventData - Event data
 * @param {string} reminderType - '24h' or '1h'
 * @returns {Promise<void>}
 */
export const sendEventReminder = async (registrationData, eventData, reminderType = '24h') => {
  // TODO: Implement email sending via Firebase Functions or external service
  console.log('Event reminder email:', {
    to: registrationData.email,
    subject: `Reminder: ${eventData.title} in ${reminderType}`,
    event: eventData.title,
    reminderType
  })
}

/**
 * Send waitlist notification email
 * @param {object} registrationData - Registration data
 * @param {object} eventData - Event data
 * @returns {Promise<void>}
 */
export const sendWaitlistNotification = async (registrationData, eventData) => {
  // TODO: Implement email sending via Firebase Functions or external service
  console.log('Waitlist notification email:', {
    to: registrationData.email,
    subject: `You're on the waitlist: ${eventData.title}`,
    event: eventData.title
  })
}

/**
 * Send confirmation when moved from waitlist to confirmed
 * @param {object} registrationData - Registration data
 * @param {object} eventData - Event data
 * @returns {Promise<void>}
 */
export const sendWaitlistConfirmation = async (registrationData, eventData) => {
  // TODO: Implement email sending via Firebase Functions or external service
  console.log('Waitlist confirmation email:', {
    to: registrationData.email,
    subject: `You're confirmed: ${eventData.title}`,
    event: eventData.title
  })
}

/**
 * Send display email verification email
 * @param {string} toEmail - Email address to send verification to
 * @param {string} verificationUrl - Verification link URL
 * @param {string} userName - User's name
 * @returns {Promise<void>}
 */
export const sendDisplayEmailVerification = async (toEmail, verificationUrl, userName = 'User') => {
  // Check if EmailJS is configured
  const emailjsConfig = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_DISPLAY_EMAIL,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  }

  // Debug: Log configuration (without exposing full keys)
  console.log('EmailJS Config Check:', {
    hasServiceId: !!emailjsConfig.serviceId,
    hasTemplateId: !!emailjsConfig.templateId,
    hasPublicKey: !!emailjsConfig.publicKey,
    serviceId: emailjsConfig.serviceId,
    templateId: emailjsConfig.templateId
  })

  // If EmailJS is configured, use it
  if (emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey) {
    try {
      // Import emailjs - use the correct import syntax
      const emailjs = (await import('@emailjs/browser')).default
      
      // Initialize EmailJS with public key
      emailjs.init(emailjsConfig.publicKey)
      
      console.log('Sending email via EmailJS...', {
        to: toEmail,
        serviceId: emailjsConfig.serviceId,
        templateId: emailjsConfig.templateId
      })
      
      // Send email
      const response = await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          to_email: toEmail,
          user_name: userName,
          verification_url: verificationUrl,
          from_name: 'ACM NUML'
        }
      )
      
      console.log('EmailJS response:', response)
      console.log('✅ Display email verification sent via EmailJS to:', toEmail)
      return
    } catch (error) {
      console.error('❌ EmailJS error details:', {
        message: error.message,
        text: error.text,
        status: error.status,
        fullError: error
      })
      throw new Error(`Failed to send email: ${error.text || error.message || 'Unknown error'}`)
    }
  }

  // Fallback: EmailJS not configured
  console.warn('⚠️ EmailJS not configured. Missing:', {
    serviceId: !emailjsConfig.serviceId,
    templateId: !emailjsConfig.templateId,
    publicKey: !emailjsConfig.publicKey
  })
  console.log('Verification URL (fallback):', verificationUrl)
  
  throw new Error('Email service not configured. Please check your .env file and restart the server. See EMAILJS_SETUP.md for instructions.')
}






