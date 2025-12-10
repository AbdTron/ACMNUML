/**
 * Stream Chat Configuration
 * Loads configuration from environment variables
 */

const STREAMCHAT_CONFIG = {
    API_KEY: import.meta.env.VITE_STREAM_CHAT_API_KEY,
    SECRET: import.meta.env.VITE_STREAM_CHAT_SECRET,
}

// Debug: Log configuration status
console.log('[Stream Chat Config] API_KEY:', STREAMCHAT_CONFIG.API_KEY ? '✓' : '✗')
console.log('[Stream Chat Config] SECRET:', STREAMCHAT_CONFIG.SECRET ? '✓' : '✗')

// Validate configuration
if (!STREAMCHAT_CONFIG.API_KEY) {
    console.error('❌ Stream Chat configuration missing!')
    console.error('Please create a .env file with the following variables:')
    console.error('VITE_STREAM_CHAT_API_KEY=your_api_key_here')
    console.error('VITE_STREAM_CHAT_SECRET=your_secret_here')
    console.error('Get your credentials from: https://getstream.io/dashboard/')
}

export default STREAMCHAT_CONFIG
