/**
 * Parse markdown-style links in message text
 * Converts [text](url) format to HTML anchor tags
 * @param {string} message - Message text with markdown links
 * @returns {string} - HTML string with parsed links
 */
export const parseMessageLinks = (message) => {
  if (!message) return ''
  
  // Pattern to match [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
  
  return message.replace(linkPattern, (match, text, url) => {
    // Validate URL
    let href = url.trim()
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/')) {
      href = `https://${href}`
    }
    
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="message-link">${text}</a>`
  })
}




