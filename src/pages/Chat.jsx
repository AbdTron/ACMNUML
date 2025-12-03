import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { CometChatProvider } from '../CometChat/src/CometChat/context/CometChatContext'
import CometChatApp from '../CometChat/src/CometChat/CometChatApp'
import '@cometchat/chat-uikit-react/css-variables.css'
import './Chat.css'

// Notification handlers
const setupNotifications = () => {
  if (!('Notification' in window)) {
    return () => {}
  }

  // Request permission if not already granted
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }

  // Listen for incoming calls
  const callListener = new CometChat.OngoingCallListener({
    onIncomingCallReceived: (call) => {
      if (Notification.permission === 'granted') {
        new Notification('Incoming Call', {
          body: `Incoming ${call.type} call from ${call.callInitiator?.name || 'Unknown'}`,
          icon: call.callInitiator?.avatar || '/favicon.ico',
          tag: `call-${call.sessionId}`,
        })
      }
    },
    onOutgoingCallAccepted: () => {},
    onOutgoingCallRejected: () => {},
    onIncomingCallCancelled: () => {},
  })

  CometChat.addCallListener('notification-listener', callListener)

  // Listen for new messages
  const messageListener = new CometChat.MessageListener({
    onTextMessageReceived: (message) => {
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification('New Message', {
          body: `${message.sender?.name || 'Someone'}: ${message.text}`,
          icon: message.sender?.avatar || '/favicon.ico',
          tag: `message-${message.id}`,
        })
      }
    },
    onMediaMessageReceived: (message) => {
      if (Notification.permission === 'granted' && document.hidden) {
        new Notification('New Message', {
          body: `${message.sender?.name || 'Someone'} sent a ${message.type}`,
          icon: message.sender?.avatar || '/favicon.ico',
          tag: `message-${message.id}`,
        })
      }
    },
  })

  CometChat.addMessageListener('notification-listener', messageListener)

  return () => {
    CometChat.removeCallListener('notification-listener')
    CometChat.removeMessageListener('notification-listener')
  }
}

const Chat = () => {
  const { userId } = useParams()
  const { currentUser } = useMemberAuth()
  const { isInitialized, isLoggedIn } = useCometChat()
  const navigate = useNavigate()
  const [defaultUser, setDefaultUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Setup notifications
  useEffect(() => {
    if (isLoggedIn && isInitialized) {
      const cleanup = setupNotifications()
      return cleanup
    }
  }, [isLoggedIn, isInitialized])

  // If userId is provided, fetch that user for CometChat
  useEffect(() => {
    if (userId && isLoggedIn && isInitialized) {
      CometChat.getUser(userId)
        .then((user) => {
          setDefaultUser(user)
          setLoading(false)
        })
        .catch((error) => {
          console.error('Failed to load user:', error)
          setDefaultUser(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [userId, isLoggedIn, isInitialized])

  if (!currentUser) {
    return (
      <div className="chat-page">
        <div className="container">
          <div className="chat-page-error">
            <p>Please log in to use chat</p>
            <button onClick={() => navigate('/member/login')} className="btn btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="chat-page">
        <div className="container">
          <div className="chat-page-loading">
            <div className="loading">Initializing chat...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="chat-page">
        <div className="container">
          <div className="chat-page-loading">
            <div className="loading">Connecting to chat...</div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="chat-page">
        <div className="container">
          <div className="chat-page-loading">
            <div className="loading">Loading conversation...</div>
          </div>
        </div>
      </div>
    )
  }

  // Render CometChat app wrapped in their provider
  return (
    <div className="chat-page">
      <CometChatProvider>
        <CometChatApp user={defaultUser} />
      </CometChatProvider>
    </div>
  )
}

export default Chat

