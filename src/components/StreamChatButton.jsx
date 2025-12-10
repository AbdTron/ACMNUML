import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMessageSquare } from 'react-icons/fi'
import { useStreamChat } from '../context/StreamChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { canUserMessage } from '../utils/streamChatPermissions'
import './StreamChatButton.css'

const StreamChatButton = ({ userId, userEmail, className = '' }) => {
    const navigate = useNavigate()
    const { currentUser } = useMemberAuth()
    const { isConnected, getChatSettings } = useStreamChat()
    const [checking, setChecking] = useState(false)
    const [canMessage, setCanMessage] = useState(null)

    // Check permissions when component mounts
    useEffect(() => {
        const checkPermission = async () => {
            if (!isConnected || !currentUser || !userId || !userEmail) {
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
    }, [isConnected, currentUser, userId, userEmail, getChatSettings])

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (canMessage && userId) {
            navigate(`/chat/${userId}`)
        }
    }

    // Don't show button if user is not logged in or checking permissions
    if (!isConnected || !currentUser || checking || canMessage === null) {
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
            className={`stream-chat-button ${className}`}
            onClick={handleClick}
            aria-label="Start chat"
            title="Start chat"
        >
            <FiMessageSquare />
            <span>Chat</span>
        </button>
    )
}

export default StreamChatButton
