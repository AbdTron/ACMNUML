import { useState } from 'react'
import { 
  FiShare2, 
  FiFacebook, 
  FiInstagram, 
  FiLinkedin, 
  FiMessageCircle,
  FiCopy,
  FiCheck
} from 'react-icons/fi'
import {
  shareToFacebook,
  shareToInstagram,
  shareToLinkedIn,
  shareToWhatsApp,
  shareNative,
  copyToClipboard,
  generateEventShareText,
  generateEventHashtags
} from '../utils/shareUtils'
import './ShareButtons.css'

/**
 * ShareButtons Component
 * 
 * @param {Object} props
 * @param {string} props.url - URL to share
 * @param {string} props.title - Title of the content
 * @param {string} props.text - Description/text to share
 * @param {string} props.image - Optional image URL for sharing
 * @param {Object} props.event - Optional event object (for event-specific sharing)
 * @param {string} props.variant - Button variant: 'horizontal' | 'vertical' | 'compact'
 * @param {boolean} props.showLabels - Whether to show text labels
 * @param {boolean} props.showNativeShare - Whether to show native share button (mobile)
 */
const ShareButtons = ({
  url,
  title = '',
  text = '',
  image = '',
  event = null,
  variant = 'horizontal',
  showLabels = false,
  showNativeShare = true
}) => {
  const [copied, setCopied] = useState(false)
  const [isNativeShareSupported] = useState(() => navigator.share !== undefined)

  const shareUrl = url || window.location.href
  const shareTitle = event ? event.title : title
  const shareText = event 
    ? generateEventShareText(event) 
    : (text || title)
  const hashtags = event ? generateEventHashtags(event) : ['ACMNUM', 'ACMNUMLLahore']

  const handleShare = async (platform) => {
    switch (platform) {
      case 'facebook':
        shareToFacebook(shareUrl, shareText)
        break
      case 'instagram':
        await shareToInstagram(shareUrl, shareText)
        break
      case 'linkedin':
        shareToLinkedIn(shareUrl, shareTitle, shareText)
        break
      case 'whatsapp':
        shareToWhatsApp(shareUrl, shareText)
        break
      case 'native':
        await shareNative({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        })
        break
      case 'copy':
        const success = await copyToClipboard(shareUrl)
        if (success) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
        break
      default:
        break
    }
  }

  const handleShareClick = (e, platform) => {
    e.preventDefault()
    e.stopPropagation()
    handleShare(platform)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '12px',
      flexWrap: 'wrap',
      width: '100%',
      minHeight: '44px',
      padding: 0,
      margin: 0
    }}>
      {showNativeShare && isNativeShareSupported && (
        <button
          onClick={(e) => handleShareClick(e, 'native')}
          aria-label="Share"
          title="Share"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            minWidth: '44px',
            minHeight: '44px',
            padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            color: '#1f2937',
            cursor: 'pointer',
            fontSize: '20px',
            flexShrink: 0
          }}
        >
          <FiShare2 style={{ fontSize: '20px' }} />
        </button>
      )}

      <button
        onClick={(e) => handleShareClick(e, 'facebook')}
        aria-label="Share on Facebook"
        title="Facebook"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '20px',
          flexShrink: 0
        }}
      >
        <FiFacebook style={{ fontSize: '20px' }} />
      </button>

      <button
        onClick={(e) => handleShareClick(e, 'instagram')}
        aria-label="Share on Instagram"
        title="Instagram"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '20px',
          flexShrink: 0
        }}
      >
        <FiInstagram style={{ fontSize: '20px' }} />
      </button>

      <button
        onClick={(e) => handleShareClick(e, 'linkedin')}
        aria-label="Share on LinkedIn"
        title="LinkedIn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '20px',
          flexShrink: 0
        }}
      >
        <FiLinkedin style={{ fontSize: '20px' }} />
      </button>

      <button
        onClick={(e) => handleShareClick(e, 'whatsapp')}
        aria-label="Share on WhatsApp"
        title="WhatsApp"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          color: '#1f2937',
          cursor: 'pointer',
          fontSize: '20px',
          flexShrink: 0
        }}
      >
        <FiMessageCircle style={{ fontSize: '20px' }} />
      </button>

      <button
        onClick={(e) => handleShareClick(e, 'copy')}
        aria-label="Copy link"
        title={copied ? 'Copied!' : 'Copy link'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: copied ? '#10b981' : '#fff',
          color: copied ? '#fff' : '#1f2937',
          cursor: 'pointer',
          fontSize: '20px',
          flexShrink: 0
        }}
      >
        {copied ? <FiCheck style={{ fontSize: '20px' }} /> : <FiCopy style={{ fontSize: '20px' }} />}
      </button>
    </div>
  )
}

export default ShareButtons

