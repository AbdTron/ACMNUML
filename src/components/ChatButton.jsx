import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMessageSquare } from 'react-icons/fi'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { canUserMessage } from '../utils/chatPermissions'
import './ChatButton.css'

const ChatButton = ({ userId, userEmail, className = '' }) => {
  const navigate = useNavigate()
  const { currentUser } = useMemberAuth()
  const { isLoggedIn, getChatSettings } = useCometChat()
  const [checking, setChecking] = useState(false)
  const [canMessage, setCanMessage] = useState(null)

  // Check permissions when component mounts
  useEffect(() => {
    const checkPermission = async () => {
      if (!isLoggedIn || !currentUser || !userId || !userEmail) {
        setCanMessage(false)
        return
      }

      setChecking(true)
      try {
        const allowed = await canUserMessage(currentUser.email, userId, getChatSettings)
        setCanMessage(allowed)
      } catch (error) {
        console.error('Error checking chat permission:', error)
        setCanMessage(false)
      } finally {
        setChecking(false)
      }
    }

    checkPermission()
  }, [isLoggedIn, currentUser, userId, userEmail, getChatSettings])

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (canMessage && userId) {
      navigate(`/chat/${userId}`)
    }
  }

  // Don't show button if user is not logged in or checking permissions
  if (!isLoggedIn || !currentUser || checking || canMessage === null) {
    return null
  }

  // Don't show button if user can't message
  if (!canMessage) {
    return null
  }

  // Don't show button if it's the current user
  if (userId === currentUser.uid) {
    return null
  }

  return (
    <button
      className={`chat-button ${className}`}
      onClick={handleClick}
      aria-label="Start chat"
      title="Start chat"
    >
      <FiMessageSquare />
      <span>Chat</span>
    </button>
  )
}

export default ChatButton

