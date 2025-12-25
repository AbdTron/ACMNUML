import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStreamChat } from '../context/StreamChatContext'
import { useStreamVideo } from '../context/StreamVideoContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import {
    Chat,
    Channel,
    ChannelHeader,
    ChannelList,
    MessageInput,
    MessageList,
    Thread,
    Window,
    useChannelStateContext,
    useMessageInputContext,
    useChatContext,
    useMessageContext,
    Attachment,
    MessageSimple,
    ReactionSelector,
    ReactionsList,
} from 'stream-chat-react'
import { FiArrowLeft, FiVideo, FiPhone, FiMic, FiPaperclip, FiSmile, FiSend, FiX, FiSquare, FiMessageSquare, FiCornerUpLeft, FiMoreVertical } from 'react-icons/fi'
import VideoCallUI from '../components/VideoCallUI'
import { useStreamNotifications } from '../hooks/useStreamNotifications'
import 'stream-chat-react/dist/css/v2/index.css'
import './StreamChat.css'

// Extended emoji list like WhatsApp
const EMOJI_CATEGORIES = {
    'Recently Used': ['👍', '❤️', '😂', '😮', '😢', '🙏'],
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Celebrations': ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🥂', '🍾', '✨', '🌟', '⭐', '💫', '🔥', '💥', '🎆', '🎇'],
    'Nature': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🍀', '🍁', '🍂', '🍃', '🌈', '☀️', '🌙', '⭐', '🌊', '🔥', '❄️', '💧'],
    'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍔', '🍕', '🌮', '🍜', '🍣', '🍦', '🍩', '🍪', '☕', '🍵'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🎮', '🎯', '🎲', '🧩', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸'],
    'Objects': ['💼', '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📹', '🎥', '📞', '☎️', '📺', '📻', '🧭', '⏰', '🔑', '🗝️', '🔒', '💡', '🔦', '📚', '📖', '✏️', '✒️', '🖊️'],
    'Symbols': ['✅', '❌', '❓', '❗', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '🔄', '🔃']
};

// Reaction emojis for quick reactions (like WhatsApp)
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

// Custom Channel Header with Video Call button
const CustomChannelHeader = () => {
    const { channel, setActiveChannel } = useChatContext()
    const { startCall, activeCall } = useStreamVideo()
    const { currentUser } = useMemberAuth()
    const navigate = useNavigate()
    const [isStartingCall, setIsStartingCall] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    // Get the other member in a 1-on-1 chat
    const getOtherMember = () => {
        if (!channel) return null
        const members = Object.values(channel.state?.members || {})
        return members.find(member => member.user_id !== currentUser?.uid?.toLowerCase())?.user
    }

    const otherMember = getOtherMember()

    // Use Stream Chat data directly - no Firestore fallback
    // User names are set when users connect to Stream Chat
    const displayMember = otherMember

    const handleVideoCall = async () => {
        if (!displayMember || isStartingCall) return
        setIsStartingCall(true)
        try {
            await startCall(displayMember.id)
        } catch (error) {
            console.error('Failed to start call:', error)
        } finally {
            setIsStartingCall(false)
        }
    }

    // Go back to channel list on mobile
    const handleBack = () => {
        // Clear the active channel to show channel list
        if (setActiveChannel) {
            setActiveChannel(undefined)
        }
        // Force re-render by navigating to chat without userId
        navigate('/chat', { replace: true })
    }

    // Hide conversation (archive)
    const handleHideConversation = async () => {
        if (!channel) return
        if (!window.confirm('Hide this conversation? You can find it again in your message list.')) return

        try {
            await channel.hide()
            setShowMenu(false)
            handleBack()
        } catch (error) {
            console.error('Failed to hide conversation:', error)
            alert('Failed to hide conversation')
        }
    }

    // Delete conversation
    const handleDeleteConversation = async () => {
        if (!channel) return
        if (!window.confirm('Delete this conversation? This will remove all messages permanently.')) return

        try {
            await channel.delete()
            setShowMenu(false)
            handleBack()
        } catch (error) {
            console.error('Failed to delete conversation:', error)
            alert('Failed to delete conversation')
        }
    }

    return (
        <div className="custom-channel-header">
            <button className="header-back-btn" onClick={handleBack}>
                <FiArrowLeft />
            </button>

            <div className="header-info">
                {displayMember && (
                    <>
                        <img
                            src={displayMember.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayMember.name || 'U')}&background=6366f1&color=fff`}
                            alt={displayMember.name}
                            className="header-avatar"
                        />
                        <div className="header-text">
                            <h3 className="header-name">{displayMember.name || 'Loading...'}</h3>
                            <span className="header-status">
                                {displayMember.online ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="header-actions">
                <button
                    className="header-action-btn"
                    onClick={handleVideoCall}
                    disabled={isStartingCall || !!activeCall}
                    title="Video Call"
                >
                    <FiVideo />
                </button>
                <button
                    className="header-action-btn"
                    onClick={handleVideoCall}
                    disabled={isStartingCall || !!activeCall}
                    title="Voice Call"
                >
                    <FiPhone />
                </button>
                <div className="header-menu-container">
                    <button
                        className="header-action-btn"
                        onClick={() => setShowMenu(!showMenu)}
                        title="More options"
                    >
                        <FiMoreVertical />
                    </button>
                    {showMenu && (
                        <div className="header-dropdown-menu">
                            <button onClick={handleHideConversation}>
                                Hide Conversation
                            </button>
                            <button onClick={handleDeleteConversation} className="delete-option">
                                Delete Conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Custom Message Input with Voice Notes, File Upload, and Emoji Picker
const CustomMessageInput = () => {
    const {
        text = '',
        setText,
        handleChange,
        handleSubmit,
        uploadNewFiles,
        attachments = [],
        removeAttachments,
        isUploadEnabled,
        textareaRef,
    } = useMessageInputContext() || {}

    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const timerRef = useRef(null)
    const fileInputRef = useRef(null)
    const inputRef = useRef(null)

    // Voice Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' })

                // Upload as attachment
                uploadNewFiles([audioFile])

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('Failed to start recording:', error)
            alert('Could not access microphone. Please check permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            audioChunksRef.current = []
            setIsRecording(false)
            clearInterval(timerRef.current)
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // File Upload
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            uploadNewFiles(files)
        }
        e.target.value = ''
    }

    // Emoji
    const [activeEmojiCategory, setActiveEmojiCategory] = useState('Smileys')

    const handleEmojiSelect = (emoji) => {
        if (setText) {
            setText((text || '') + emoji)
        }
        setShowEmojiPicker(false)
    }

    // Submit
    const handleFormSubmit = (e) => {
        e.preventDefault()
        if (text.trim() || (attachments && attachments.length > 0)) {
            handleSubmit(e)
            setShowEmojiPicker(false)
        }
    }

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    if (isRecording) {
        return (
            <div className="custom-message-input recording">
                <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                </div>
                <div className="recording-actions">
                    <button
                        type="button"
                        className="recording-cancel"
                        onClick={cancelRecording}
                    >
                        <FiX />
                    </button>
                    <button
                        type="button"
                        className="recording-stop"
                        onClick={stopRecording}
                    >
                        <FiSquare />
                        <span>Stop</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="custom-message-input">
            {/* Attachments Preview */}
            {attachments && attachments.length > 0 && (
                <div className="attachments-preview">
                    {attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                            {attachment.type === 'image' ? (
                                <img src={attachment.image_url || attachment.thumb_url} alt="attachment" />
                            ) : (
                                <div className="file-attachment">
                                    <FiPaperclip />
                                    <span>{attachment.title || 'File'}</span>
                                </div>
                            )}
                            <button
                                className="remove-attachment"
                                onClick={() => removeAttachments([attachment.id])}
                            >
                                <FiX />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Extended Emoji Picker like WhatsApp */}
            {showEmojiPicker && (
                <div className="emoji-picker-container">
                    <div className="emoji-picker-whatsapp">
                        <div className="emoji-categories">
                            {Object.keys(EMOJI_CATEGORIES).map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    className={`emoji-category-btn ${activeEmojiCategory === category ? 'active' : ''}`}
                                    onClick={() => setActiveEmojiCategory(category)}
                                    title={category}
                                >
                                    {EMOJI_CATEGORIES[category][0]}
                                </button>
                            ))}
                        </div>
                        <div className="emoji-grid">
                            {EMOJI_CATEGORIES[activeEmojiCategory]?.map((emoji, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="emoji-btn"
                                    onClick={() => handleEmojiSelect(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="input-form">
                {/* File Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isUploadEnabled}
                    title="Attach file"
                >
                    <FiPaperclip />
                </button>

                {/* Text Input */}
                <input
                    ref={textareaRef || inputRef}
                    type="text"
                    className="message-text-input"
                    placeholder="Type a message..."
                    value={text || ''}
                    onChange={(e) => {
                        if (setText) {
                            setText(e.target.value)
                        } else if (handleChange) {
                            handleChange(e)
                        }
                    }}
                />

                {/* Emoji Button */}
                <button
                    type="button"
                    className={`input-action-btn ${showEmojiPicker ? 'active' : ''}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Emoji"
                >
                    <FiSmile />
                </button>

                {/* Voice Note Button - always visible */}
                <button
                    type="button"
                    className="voice-btn"
                    onClick={startRecording}
                    title="Record voice note"
                >
                    <FiMic />
                </button>

                {/* Send Button */}
                <button
                    type="submit"
                    className="send-btn"
                    title="Send"
                    disabled={!text.trim() && (!attachments || attachments.length === 0)}
                >
                    <FiSend />
                </button>
            </form>
        </div>
    )
}

// Simple Voice Note Button that works with default MessageInput
const VoiceNoteButton = () => {
    const { channel } = useChatContext()
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const timerRef = useRef(null)
    const streamRef = useRef(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

                // Send voice note as message with attachment
                if (channel && audioBlob.size > 0) {
                    try {
                        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
                        const response = await channel.sendFile(file)
                        if (response.file) {
                            await channel.sendMessage({
                                text: '🎤 Voice Note',
                                attachments: [{
                                    type: 'audio',
                                    asset_url: response.file,
                                    title: 'Voice Note'
                                }]
                            })
                        }
                    } catch (err) {
                        console.error('Failed to send voice note:', err)
                    }
                }

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('Failed to start recording:', error)
            alert('Could not access microphone')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            clearInterval(timerRef.current)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            audioChunksRef.current = []
            setIsRecording(false)
            clearInterval(timerRef.current)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (isRecording) {
        return (
            <div className="voice-note-recording">
                <span className="recording-dot"></span>
                <span className="recording-time">{formatTime(recordingTime)}</span>
                <button type="button" onClick={cancelRecording} className="cancel-btn"><FiX /></button>
                <button type="button" onClick={stopRecording} className="stop-btn"><FiSquare /> Send</button>
            </div>
        )
    }

    return (
        <button
            type="button"
            className="voice-note-btn"
            onClick={startRecording}
            title="Record voice note"
        >
            <FiMic />
        </button>
    )
}

// Custom Message component with quick quote action
const CustomMessage = () => {
    const {
        message,
        handleOpenThread,
        setQuotedMessage,
        isMyMessage,
        isReactionEnabled,
        reactionSelectorRef,
        showDetailedReactions,
    } = useMessageContext()
    const { client, channel } = useChatContext()
    const [showReactionPicker, setShowReactionPicker] = useState(false)
    const [showActionsMenu, setShowActionsMenu] = useState(false)
    const reactionPickerRef = useRef(null)
    const actionsMenuRef = useRef(null)

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
                setShowReactionPicker(false)
            }
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
                setShowActionsMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle quote reply
    const handleQuoteReply = () => {
        if (setQuotedMessage) {
            setQuotedMessage(message)
        }
    }

    // Handle reaction with single-reaction-per-user limit
    const handleReaction = async (reactionType) => {
        if (!channel || !message) return

        try {
            // Get user's current reactions on this message
            const userId = client.userID
            const existingReactions = message.own_reactions || []

            // If user already reacted with this emoji, remove it
            const existingReaction = existingReactions.find(r => r.type === reactionType)
            if (existingReaction) {
                await channel.deleteReaction(message.id, reactionType)
            } else {
                // Remove any existing reaction from this user first (single reaction per user)
                for (const reaction of existingReactions) {
                    await channel.deleteReaction(message.id, reaction.type)
                }
                // Add the new reaction
                await channel.sendReaction(message.id, { type: reactionType })
            }
        } catch (error) {
            console.error('Failed to handle reaction:', error)
        }
        setShowReactionPicker(false)
    }

    // Get reaction counts for display
    const getReactionCounts = () => {
        const counts = {}
        const reactions = message.reaction_counts || {}
        Object.entries(reactions).forEach(([type, count]) => {
            if (count > 0) {
                counts[type] = count
            }
        })
        return counts
    }

    const reactionCounts = getReactionCounts()
    const hasReactions = Object.keys(reactionCounts).length > 0
    const isMine = isMyMessage()

    return (
        <div className={`custom-message-wrapper ${isMine ? 'custom-message--mine' : 'custom-message--other'}`}>
            <div className="custom-message-content">
                {/* Message bubble using MessageSimple */}
                <MessageSimple />

                {/* Quick Actions */}
                <div className={`message-quick-actions ${isMine ? 'left' : 'right'}`}>
                    {/* Quick Quote Reply */}
                    <button
                        className="quick-action-btn quote-btn"
                        onClick={handleQuoteReply}
                        title="Quote Reply"
                    >
                        <FiCornerUpLeft />
                    </button>

                    {/* Emoji Reaction Button */}
                    <button
                        className="quick-action-btn react-btn"
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                        title="React"
                    >
                        <FiSmile />
                    </button>

                    {/* More Actions (3-dots menu) */}
                    <button
                        className="quick-action-btn menu-btn"
                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                        title="More"
                    >
                        <FiMoreVertical />
                    </button>
                </div>

                {/* Reaction Picker */}
                {showReactionPicker && (
                    <div
                        ref={reactionPickerRef}
                        className={`reaction-picker ${isMine ? 'left' : 'right'}`}
                    >
                        {REACTION_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                className="reaction-emoji-btn"
                                onClick={() => handleReaction(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {/* Actions Menu (threaded reply, pin, delete, etc.) */}
                {showActionsMenu && (
                    <div
                        ref={actionsMenuRef}
                        className={`actions-menu ${isMine ? 'left' : 'right'}`}
                    >
                        <button onClick={() => { handleOpenThread(); setShowActionsMenu(false); }}>
                            <FiMessageSquare /> Reply in Thread
                        </button>
                        {isMine && (
                            <>
                                <button onClick={() => setShowActionsMenu(false)}>
                                    Edit
                                </button>
                                <button className="delete-action" onClick={() => setShowActionsMenu(false)}>
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Display Reactions */}
            {hasReactions && (
                <div className={`message-reactions ${isMine ? 'right' : 'left'}`}>
                    {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <span key={emoji} className="reaction-badge" onClick={() => handleReaction(emoji)}>
                            {emoji} {count > 1 && <span className="reaction-count">{count}</span>}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// Main Chat Content that uses Stream Chat's context for channel management
const ChatContent = ({ showChannelList, setShowChannelList, userId, client }) => {
    const { channel } = useChatContext()

    // Auto-scroll to bottom when channel changes
    useEffect(() => {
        if (channel) {
            // Wait for messages to load, then scroll to bottom
            const timer = setTimeout(() => {
                const messageList = document.querySelector('.str-chat__message-list-scroll')
                if (messageList) {
                    messageList.scrollTop = messageList.scrollHeight
                }
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [channel?.cid])

    return (
        <div className="stream-chat-container">
            {/* Channel List Sidebar */}
            <div className={`stream-chat-sidebar ${!channel ? 'show' : showChannelList ? 'show' : 'hide'}`}>
                <div className="sidebar-header">
                    <h2>Messages</h2>
                </div>
                <ChannelList
                    filters={{
                        type: 'messaging',
                        members: { $in: [client.userID] },
                    }}
                    sort={{ last_message_at: -1 }}
                    options={{ limit: 30 }}
                    showChannelSearch
                    additionalChannelSearchProps={{
                        searchForChannels: true,
                        searchQueryParams: {
                            channelFilters: {
                                filters: { members: { $in: [client.userID] } },
                            },
                        },
                    }}
                />
            </div>

            {/* Main Chat Area */}
            <div className={`stream-chat-main ${channel ? 'show' : 'hide'}`}>
                {channel ? (
                    <>
                        {/* Header OUTSIDE of Channel/Window for guaranteed visibility */}
                        <CustomChannelHeader onBack={() => setShowChannelList(true)} />

                        <Channel>
                            <Window hideOnThread>
                                <MessageList
                                    disableDateSeparator={false}
                                    Message={CustomMessage}
                                    messageLimit={50}
                                    highlightedMessageId={null}
                                    stickToBottomScrollBehavior="smooth"
                                />
                                <div className="message-input-with-voice">
                                    <MessageInput />
                                    <VoiceNoteButton />
                                </div>
                            </Window>
                            <Thread />
                        </Channel>
                    </>
                ) : (
                    <div className="no-channel-selected">
                        <div className="no-channel-content">
                            <FiMessageSquare className="no-channel-icon" />
                            <h3>Select a conversation</h3>
                            <p>Choose a chat from the list or start a new one</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const StreamChatPage = () => {
    const { userId } = useParams()
    const { currentUser } = useMemberAuth()
    const { client, isConnected, isLoading } = useStreamChat()
    const { activeCall } = useStreamVideo()
    const navigate = useNavigate()
    const [showChannelList, setShowChannelList] = useState(true)

    // Setup notifications using the custom hook
    const { requestNotificationPermission } = useStreamNotifications()

    // Request notification permission on mount
    useEffect(() => {
        if (client && isConnected) {
            requestNotificationPermission()
        }
    }, [client, isConnected, requestNotificationPermission])

    // If userId is provided in URL, create/open a direct message channel with that user
    useEffect(() => {
        if (!client || !isConnected || !userId) return

        const openDirectMessage = async () => {
            try {
                const targetUserId = userId.toLowerCase()

                // Create or get the channel - Stream Chat will create user if needed
                const channel = client.channel('messaging', {
                    members: [client.userID, targetUserId],
                })

                // Watch the channel
                await channel.watch()
                setShowChannelList(false)
            } catch (error) {
                console.error('Failed to open direct message:', error)
            }
        }

        openDirectMessage()
    }, [client, isConnected, userId])


    if (!currentUser) {
        return (
            <div className="stream-chat-page">
                <div className="container">
                    <div className="stream-chat-error">
                        <p>Please log in to use chat</p>
                        <button onClick={() => navigate('/member/login')} className="btn btn-primary">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading || !client) {
        return (
            <div className="stream-chat-page">
                <div className="container">
                    <div className="stream-chat-loading">
                        <div className="loading">Initializing chat...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="stream-chat-page">
                <div className="container">
                    <div className="stream-chat-loading">
                        <div className="loading">Connecting to chat...</div>
                    </div>
                </div>
            </div>
        )
    }

    // Show video call UI if in a call
    if (activeCall) {
        return <VideoCallUI />
    }

    return (
        <div className="stream-chat-page">
            <Chat client={client} theme="str-chat__theme-light">
                <ChatContent
                    showChannelList={showChannelList}
                    setShowChannelList={setShowChannelList}
                    userId={userId}
                    client={client}
                />
            </Chat>
        </div>
    )
}

export default StreamChatPage
