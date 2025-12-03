import { useEffect } from 'react'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'

/**
 * Handles message notifications and system notifications for new messages
 */
const MessageNotificationHandler = () => {
  const { isInitialized, isLoggedIn } = useCometChat()
  const { currentUser } = useMemberAuth()

  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !currentUser) return

    const messageListenerID = 'message-notification-handler'
    
    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: async (message) => {
        // Only show notification if app is not in focus or user is not viewing this conversation
        const isAppFocused = document.hasFocus()
        const currentPath = window.location.pathname
        const isViewingChat = currentPath.startsWith('/chat')
        
        // Get sender info
        let senderName = 'Unknown'
        let senderAvatar = ''
        try {
          const sender = message.getSender()
          if (sender) {
            senderName = sender.getName() || sender.name || 'Unknown'
            senderAvatar = sender.getAvatar() || sender.avatar || ''
          }
        } catch (e) {
          console.warn('Could not get sender info:', e)
        }

        // Show notification if app is not focused or not viewing chat
        if ((!isAppFocused || !isViewingChat) && 'Notification' in window && Notification.permission === 'granted') {
          const messageText = message.getText() || message.text || ''
          const messageId = message.getId() || message.id || Date.now().toString()
          
          const notification = new Notification(`New message from ${senderName}`, {
            body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
            icon: senderAvatar || '/badge.png',
            badge: '/badge.png',
            tag: `message-${messageId}`,
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: {
              messageId,
              senderId: sender?.getUid?.() || sender?.uid,
              senderName,
              url: `/chat/${sender?.getUid?.() || sender?.uid}`,
            },
          })

          notification.onclick = () => {
            window.focus()
            notification.close()
            // Navigate to chat with sender
            if (sender?.getUid || sender?.uid) {
              window.location.href = `/chat/${sender.getUid?.() || sender.uid}`
            } else {
              window.location.href = '/chat'
            }
          }

          // Auto-close after 5 seconds
          setTimeout(() => {
            notification.close()
          }, 5000)
        }

        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('cometchat:new-message', {
          detail: { message, senderName, senderAvatar }
        }))
      },
      onMediaMessageReceived: async (message) => {
        // Similar handling for media messages
        const isAppFocused = document.hasFocus()
        const currentPath = window.location.pathname
        const isViewingChat = currentPath.startsWith('/chat')
        
        let senderName = 'Unknown'
        try {
          const sender = message.getSender()
          if (sender) {
            senderName = sender.getName() || sender.name || 'Unknown'
          }
        } catch (e) {
          console.warn('Could not get sender info:', e)
        }

        if ((!isAppFocused || !isViewingChat) && 'Notification' in window && Notification.permission === 'granted') {
          const messageType = message.getType() === CometChat.MESSAGE_TYPE.IMAGE ? 'image' : 'file'
          
          const notification = new Notification(`New ${messageType} from ${senderName}`, {
            body: `${senderName} sent a ${messageType}`,
            icon: '/badge.png',
            badge: '/badge.png',
            tag: `message-${message.getId() || message.id}`,
            requireInteraction: false,
            vibrate: [200, 100, 200],
          })

          notification.onclick = () => {
            window.focus()
            notification.close()
            window.location.href = '/chat'
          }

          setTimeout(() => {
            notification.close()
          }, 5000)
        }
      },
    })

    CometChat.addMessageListener(messageListenerID, messageListener)

    return () => {
      CometChat.removeMessageListener(messageListenerID)
    }
  }, [isInitialized, isLoggedIn, currentUser])

  return null
}

export default MessageNotificationHandler

