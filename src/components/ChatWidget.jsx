import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMessageSquare } from 'react-icons/fi'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { CometChatUIKit } from '@cometchat/chat-uikit-react'
import './ChatWidget.css'

const ChatWidget = () => {
  const { isInitialized, isLoggedIn } = useCometChat()
  const { currentUser } = useMemberAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !currentUser) {
      setUnreadCount(0)
      return
    }

    // Listen for unread message count using UIKit
    const listenerID = 'chat-widget-listener'
    
    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: () => {
        updateUnreadCount()
      },
      onCustomMessageReceived: () => {
        updateUnreadCount()
      },
    })

    CometChat.addMessageListener(listenerID, messageListener)

    // Initial unread count
    updateUnreadCount()

    // Update unread count periodically
    const interval = setInterval(updateUnreadCount, 30000) // Every 30 seconds

    return () => {
      CometChat.removeMessageListener(listenerID)
      clearInterval(interval)
    }
  }, [isInitialized, isLoggedIn, currentUser])

  const updateUnreadCount = async () => {
    if (!isInitialized || !isLoggedIn) return

    try {
      // Try to get unread count from conversations
      const conversationsRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(100)
        .build()
      
      const conversations = await conversationsRequest.fetchNext()
      let totalUnread = 0
      
      conversations.forEach((conv) => {
        const unread = conv.getUnreadCount ? conv.getUnreadCount() : (conv.unreadMessageCount || conv.unreadCount || 0)
        totalUnread += unread
      })
      
      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('Failed to get unread count:', error)
      // Fallback to 0 if error
      setUnreadCount(0)
    }
  }

  const handleClick = () => {
    if (currentUser) {
      navigate('/chat')
    }
  }

  // Don't show widget if user is not logged in
  if (!currentUser) {
    return null
  }

  return (
    <button
      className="chat-widget"
      onClick={handleClick}
      aria-label="Open chat"
      title="Chat"
    >
      <FiMessageSquare />
      {unreadCount > 0 && (
        <span className="chat-widget-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  )
}

export default ChatWidget
