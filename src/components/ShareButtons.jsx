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

  const buttonClass = `share-button share-button-${variant}`
  const containerClass = `share-buttons share-buttons-${variant}`

  return (
    <div className={containerClass}>
      {showNativeShare && isNativeShareSupported && (
        <button
          className={`${buttonClass} share-button-native`}
          onClick={() => handleShare('native')}
          aria-label="Share via native share"
          title="Share"
        >
          <FiShare2 />
          {showLabels && <span>Share</span>}
        </button>
      )}

      <button
        className={`${buttonClass} share-button-facebook`}
        onClick={() => handleShare('facebook')}
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <FiFacebook />
        {showLabels && <span>Facebook</span>}
      </button>

      <button
        className={`${buttonClass} share-button-instagram`}
        onClick={() => handleShare('instagram')}
        aria-label="Share on Instagram"
        title="Share on Instagram"
      >
        <FiInstagram />
        {showLabels && <span>Instagram</span>}
      </button>

      <button
        className={`${buttonClass} share-button-linkedin`}
        onClick={() => handleShare('linkedin')}
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <FiLinkedin />
        {showLabels && <span>LinkedIn</span>}
      </button>

      <button
        className={`${buttonClass} share-button-whatsapp`}
        onClick={() => handleShare('whatsapp')}
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
      >
        <FiMessageCircle />
        {showLabels && <span>WhatsApp</span>}
      </button>

      <button
        className={`${buttonClass} share-button-copy ${copied ? 'copied' : ''}`}
        onClick={() => handleShare('copy')}
        aria-label="Copy link"
        title="Copy link"
      >
        {copied ? <FiCheck /> : <FiCopy />}
        {showLabels && <span>{copied ? 'Copied!' : 'Copy Link'}</span>}
      </button>
    </div>
  )
}

export default ShareButtons

