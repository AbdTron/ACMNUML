import { useNavigate } from 'react-router-dom'
import { FiMessageSquare } from 'react-icons/fi'
import { useStreamChat } from '../context/StreamChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import './StreamChatButton.css'

const StreamChatButton = ({ userId, userEmail, className = '' }) => {
    const navigate = useNavigate()
    const { currentUser } = useMemberAuth()
    const { isConnected } = useStreamChat()

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (userId) {
            navigate(`/chat/${userId}`)
        }
    }

    // Don't show button if user is not connected
    if (!isConnected || !currentUser) {
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
