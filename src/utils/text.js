/**
 * Text utility functions
 */

/**
 * Truncate text to a specified length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Convert URLs in text to clickable links
 * Returns an array of React elements (strings and <a> tags)
 */
export const linkifyText = (text) => {
  if (!text) return ''

  // Regex to match URLs (http, https, and www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

  const parts = text.split(urlRegex)
  const matches = text.match(urlRegex) || []

  const result = []
  let matchIndex = 0

  parts.forEach((part, index) => {
    if (part) {
      // Check if this part is a URL
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0 // Reset regex state
        const href = part.startsWith('http') ? part : `https://${part}`
        result.push(
          <a
            key={`link-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            {part}
          </a>
        )
      } else {
        result.push(part)
      }
    }
  })

  return result
}

/**
 * Render text with line breaks and clickable links
 * Preserves newlines and makes URLs clickable
 */
export const renderTextWithLinks = (text) => {
  if (!text) return null

  // Split by newlines first
  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    // Linkify each line
    const linkedContent = linkifyText(line)

    return (
      <span key={`line-${lineIndex}`}>
        {linkedContent}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}
