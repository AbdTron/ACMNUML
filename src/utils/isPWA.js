/**
 * Detects if the app is running as a PWA (installed app) vs browser
 * @returns {boolean} true if running as PWA, false if in browser
 */
export const isPWA = () => {
  // Check for standalone display mode (most browsers)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check for iOS Safari standalone mode
  if (window.navigator.standalone === true) {
    return true
  }

  // Check for fullscreen mode (sometimes used for PWAs)
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true
  }

  // Check if launched from home screen (Android Chrome)
  // This is a heuristic - if there's no browser UI and it's not in an iframe
  if (
    window.matchMedia('(display-mode: minimal-ui)').matches &&
    !window.matchMedia('(display-mode: browser)').matches
  ) {
    return true
  }

  return false
}

