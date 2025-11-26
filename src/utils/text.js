export const truncateText = (text, limit = 100) => {
  if (!text) return ''
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trim()}…`
}




