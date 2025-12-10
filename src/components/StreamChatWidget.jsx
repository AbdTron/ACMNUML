import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMessageSquare } from 'react-icons/fi'
import { useStreamChat } from '../context/StreamChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import './StreamChatWidget.css'

const StreamChatWidget = () => {
    const { client, isConnected } = useStreamChat()
    const { currentUser } = useMemberAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const navigate = useNavigate()

    useEffect(() => {
        if (!client || !isConnected || !currentUser) {
            setUnreadCount(0)
            return
        }

        // Get initial unread count
        updateUnreadCount()

        // Listen for new messages
        const handleEvent = () => {
            updateUnreadCount()
        }

        client.on('message.new', handleEvent)
        client.on('notification.message_new', handleEvent)
        client.on('notification.mark_read', handleEvent)

        // Update unread count periodically
        const interval = setInterval(updateUnreadCount, 30000) // Every 30 seconds

        return () => {
            client.off('message.new', handleEvent)
            client.off('notification.message_new', handleEvent)
            client.off('notification.mark_read', handleEvent)
            clearInterval(interval)
        }
    }, [client, isConnected, currentUser])

    const updateUnreadCount = async () => {
        if (!client || !isConnected) return

        try {
            // Get total unread count across all channels
            const totalUnread = client.user?.total_unread_count || 0
            setUnreadCount(totalUnread)
        } catch (error) {
            console.error('Failed to get unread count:', error)
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
            className="stream-chat-widget"
            onClick={handleClick}
            aria-label="Open chat"
            title="Chat"
        >
            <FiMessageSquare />
            {unreadCount > 0 && (
                <span className="stream-chat-widget-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
        </button>
    )
}

export default StreamChatWidget
