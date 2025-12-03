/**
 * CometChat Configuration
 * Loads configuration from environment variables
 */

const COMETCHAT_CONFIG = {
  APP_ID: import.meta.env.VITE_COMETCHAT_APP_ID,
  REGION: import.meta.env.VITE_COMETCHAT_REGION ? import.meta.env.VITE_COMETCHAT_REGION.toLowerCase() : 'us',
  AUTH_KEY: import.meta.env.VITE_COMETCHAT_AUTH_KEY,
  REST_API_KEY: import.meta.env.VITE_COMETCHAT_REST_API_KEY,
}

// Debug: Log configuration status
console.log('[CometChat Config] APP_ID:', COMETCHAT_CONFIG.APP_ID ? '✓' : '✗')
console.log('[CometChat Config] REGION:', COMETCHAT_CONFIG.REGION)
console.log('[CometChat Config] AUTH_KEY:', COMETCHAT_CONFIG.AUTH_KEY ? '✓' : '✗')
console.log('[CometChat Config] REST_API_KEY:', COMETCHAT_CONFIG.REST_API_KEY ? '✓' : '✗')

// Validate configuration
if (!COMETCHAT_CONFIG.APP_ID || !COMETCHAT_CONFIG.AUTH_KEY) {
  console.error('❌ CometChat configuration missing!')
  console.error('Please create a .env file with the following variables:')
  console.error('VITE_COMETCHAT_APP_ID=your_app_id')
  console.error('VITE_COMETCHAT_REGION=us (or eu/in)')
  console.error('VITE_COMETCHAT_AUTH_KEY=your_auth_key')
  console.error('VITE_COMETCHAT_REST_API_KEY=your_rest_api_key (for user creation/updates)')
  console.error('Get your credentials from: https://app.cometchat.com/')
}

export default COMETCHAT_CONFIG

