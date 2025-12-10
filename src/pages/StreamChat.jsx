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
    Attachment,
} from 'stream-chat-react'
import { FiArrowLeft, FiVideo, FiPhone, FiMic, FiPaperclip, FiSmile, FiSend, FiX, FiSquare, FiMessageSquare } from 'react-icons/fi'
import VideoCallUI from '../components/VideoCallUI'
import 'stream-chat-react/dist/css/v2/index.css'
import './StreamChat.css'

// Custom Channel Header with Video Call button
const CustomChannelHeader = () => {
    const { channel, setActiveChannel } = useChatContext()
    const { startCall, activeCall } = useStreamVideo()
    const { currentUser } = useMemberAuth()
    const navigate = useNavigate()
    const [isStartingCall, setIsStartingCall] = useState(false)

    // Get the other member in a 1-on-1 chat
    const getOtherMember = () => {
        if (!channel) return null
        const members = Object.values(channel.state?.members || {})
        return members.find(member => member.user_id !== currentUser?.uid?.toLowerCase())?.user
    }

    const otherMember = getOtherMember()

    const handleVideoCall = async () => {
        if (!otherMember || isStartingCall) return
        setIsStartingCall(true)
        try {
            await startCall(otherMember.id)
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
            setActiveChannel(null)
        }
    }

    return (
        <div className="custom-channel-header">
            <button className="header-back-btn" onClick={handleBack}>
                <FiArrowLeft />
            </button>

            <div className="header-info">
                {otherMember && (
                    <>
                        <img
                            src={otherMember.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherMember.name || 'U')}&background=6366f1&color=fff`}
                            alt={otherMember.name}
                            className="header-avatar"
                        />
                        <div className="header-text">
                            <h3 className="header-name">{otherMember.name || 'Unknown'}</h3>
                            <span className="header-status">
                                {otherMember.online ? 'Online' : 'Offline'}
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
            </div>
        </div>
    )
}

// Custom Message Input with Voice Notes, File Upload, and Emoji Picker
const CustomMessageInput = () => {
    const {
        text = '',
        handleChange,
        handleSubmit,
        uploadNewFiles,
        attachments = [],
        removeAttachments,
        isUploadEnabled,
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
    const handleEmojiSelect = (emoji) => {
        handleChange({ target: { value: text + emoji } })
        setShowEmojiPicker(false)
    }

    // Common emojis for quick selection
    const commonEmojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '👏', '😊', '🙌', '💯', '✨', '😍', '🤔', '😎', '👀', '🚀']

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

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="emoji-picker-container">
                    <div className="emoji-picker-simple">
                        {commonEmojis.map((emoji, index) => (
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
                    ref={inputRef}
                    type="text"
                    className="message-text-input"
                    placeholder="Type a message..."
                    value={text}
                    onChange={handleChange}
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

                {/* Voice Note or Send */}
                {text.trim() || (attachments && attachments.length > 0) ? (
                    <button type="submit" className="send-btn" title="Send">
                        <FiSend />
                    </button>
                ) : (
                    <button
                        type="button"
                        className="voice-btn"
                        onClick={startRecording}
                        title="Record voice note"
                    >
                        <FiMic />
                    </button>
                )}
            </form>
        </div>
    )
}

// Main Chat Content that uses Stream Chat's context for channel management
const ChatContent = ({ showChannelList, setShowChannelList, userId, client }) => {
    const { channel } = useChatContext()

    // Debug log
    useEffect(() => {
        console.log('[Stream Chat] Channel from context:', channel?.cid || 'none')
    }, [channel])

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
                    <Channel>
                        <Window>
                            <CustomChannelHeader onBack={() => setShowChannelList(true)} />
                            <MessageList
                                disableDateSeparator={false}
                                messageActions={['react', 'reply', 'quote', 'pin', 'delete', 'edit', 'flag']}
                            />
                            <MessageInput />
                        </Window>
                        <Thread />
                    </Channel>
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

    // Setup notifications
    useEffect(() => {
        if (!client || !isConnected) return

        // Request notification permission if not already granted
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }

        // Listen for new messages and show desktop notifications
        const handleNewMessage = (event) => {
            const message = event.message

            if (
                message.user?.id !== client.userID &&
                document.hidden &&
                'Notification' in window &&
                Notification.permission === 'granted'
            ) {
                new Notification('New Message', {
                    body: `${message.user?.name || 'Someone'}: ${message.text || 'Sent an attachment'}`,
                    icon: message.user?.image || '/favicon.ico',
                    tag: `message-${message.id}`,
                })
            }
        }

        client.on('message.new', handleNewMessage)

        return () => {
            client.off('message.new', handleNewMessage)
        }
    }, [client, isConnected])

    // If userId is provided in URL, create/open a direct message channel with that user
    useEffect(() => {
        if (!client || !isConnected || !userId) return

        const openDirectMessage = async () => {
            try {
                const targetUserId = userId.toLowerCase()
                const { users } = await client.queryUsers({ id: targetUserId })

                if (users.length === 0) {
                    console.error('User not found:', targetUserId)
                    return
                }

                // Create or get the channel
                const channel = client.channel('messaging', {
                    members: [client.userID, targetUserId],
                })

                // Watch the channel and let Stream Chat set it as active
                await channel.watch()
                // The ChatContent component will detect this via useChatContext
                console.log('[Stream Chat] Direct message channel ready:', channel.cid)
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
