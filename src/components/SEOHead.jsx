import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * SEOHead Component
 * Dynamically updates meta tags for SEO, Open Graph, and structured data
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL (defaults to current URL)
 * @param {string} props.type - Open Graph type (default: 'website')
 * @param {string} props.siteName - Site name (default: 'ACM NUML')
 * @param {Object|Array} props.structuredData - JSON-LD structured data object(s)
 */
const SEOHead = ({
  title = 'ACM NUML - Computer Science Society',
  description = 'ACM NUML - Computer Science Society at National University of Modern Languages, Lahore. Join us for events, workshops, and tech talks.',
  image = '',
  url = '',
  type = 'website',
  siteName = 'ACM NUML',
  structuredData = null
}) => {
  const location = useLocation()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://acmnuml.com'
  const canonicalUrl = url || `${baseUrl}${location.pathname}`
  const ogImage = image || `${baseUrl}/icon-512.png`

  useEffect(() => {
    // Update document title
    document.title = title

    // Helper function to update or create meta tag
    const updateMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`)

      if (!meta) {
        meta = document.createElement('meta')
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property)
        } else {
          meta.setAttribute('name', property)
        }
        document.head.appendChild(meta)
      }

      meta.setAttribute('content', content)
    }

    // Basic meta tags
    updateMetaTag('description', description)

    // Open Graph tags
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:image', ogImage)
    updateMetaTag('og:url', canonicalUrl)
    updateMetaTag('og:type', type)
    updateMetaTag('og:site_name', siteName)

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', ogImage)

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)

    // JSON-LD Structured Data
    // Remove any existing SEO JSON-LD scripts
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]')
    existingScripts.forEach(script => script.remove())

    // Add new structured data if provided
    if (structuredData) {
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData]
      dataArray.forEach((data, index) => {
        if (data) {
          const script = document.createElement('script')
          script.type = 'application/ld+json'
          script.setAttribute('data-seo-jsonld', `seo-${index}`)
          script.textContent = JSON.stringify(data)
          document.head.appendChild(script)
        }
      })
    }

    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[data-seo-jsonld]')
      scripts.forEach(script => script.remove())
    }
  }, [title, description, ogImage, canonicalUrl, type, siteName, structuredData])

  return null // This component doesn't render anything
}

export default SEOHead
