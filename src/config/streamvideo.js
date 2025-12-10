/**
 * Stream Video Configuration
 * Used for video/audio calling features
 */

const STREAM_VIDEO_CONFIG = {
    API_KEY: import.meta.env.VITE_STREAM_CHAT_API_KEY, // Same API key as chat
}

// Validate configuration
if (!STREAM_VIDEO_CONFIG.API_KEY) {
    console.warn('[Stream Video] API key not configured')
}

export default STREAM_VIDEO_CONFIG
