import { useState, useEffect, useRef } from 'react'
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiPhone, FiVideo, FiX } from 'react-icons/fi'
import './IncomingCallUI.css'

/**
 * Custom Incoming Call UI Component
 * Handles incoming calls with proper accept/reject functionality
 */
const IncomingCallUI = () => {
  const { isInitialized, isLoggedIn } = useCometChat()
  const { currentUser } = useMemberAuth()
  const [incomingCall, setIncomingCall] = useState(null)
  const [callerInfo, setCallerInfo] = useState(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const ringtoneRef = useRef(null)

  // Helper function to stop ALL audio
  const stopAllAudio = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
      ringtoneRef.current = null
    }

    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach((audio) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (e) { }
    })
  }

  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !currentUser) return

    const callListenerID = 'incoming-call-ui-listener'

    const callListener = new CometChat.CallListener({
      onIncomingCallReceived: async (call) => {
        console.log('[IncomingCallUI] Incoming call received:', call)

        let caller = null
        try {
          const callerId = call.getCallInitiator()?.getUid() || call.getCallInitiator()?.uid
          if (callerId) {
            caller = await CometChat.getUser(callerId)
          }
        } catch (e) {
          const initiator = call.getCallInitiator()
          if (initiator) {
            caller = {
              uid: initiator.getUid?.() || initiator.uid,
              name: initiator.getName?.() || initiator.name || 'Unknown',
              avatar: initiator.getAvatar?.() || initiator.avatar || '',
            }
          }
        }

        setIncomingCall(call)
        setCallerInfo(caller)
      },
      onIncomingCallCancelled: () => {
        stopAllAudio()
        setIncomingCall(null)
        setCallerInfo(null)
      },
      onCallEnded: () => {
        stopAllAudio()
        setIncomingCall(null)
        setCallerInfo(null)
      },
    })

    CometChat.addCallListener(callListenerID, callListener)

    return () => {
      stopAllAudio()
      CometChat.removeCallListener(callListenerID)
    }
  }, [isInitialized, isLoggedIn, currentUser])

  const handleAcceptCall = async () => {
    if (!incomingCall || isAccepting || isRejecting) return
    setIsAccepting(true)

    if (window.stopAllPageAudio) window.stopAllPageAudio()
    else stopAllAudio()

    try {
      const acceptedCall = await CometChat.acceptCall(incomingCall.getSessionId())
      window.dispatchEvent(new CustomEvent('cometchat:call-accepted', {
        detail: { call: acceptedCall }
      }))
      setIncomingCall(null)
      setCallerInfo(null)
    } catch (error) {
      console.error('Failed to accept call:', error)
      alert('Failed to accept call. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectCall = async () => {
    if (!incomingCall || isAccepting || isRejecting) return
    setIsRejecting(true)

    if (window.stopAllPageAudio) window.stopAllPageAudio()
    else stopAllAudio()

    try {
      await CometChat.rejectCall(incomingCall.getSessionId(), CometChat.CALL_STATUS.REJECTED)
      window.dispatchEvent(new CustomEvent('cometchat:call-rejected', {
        detail: { call: incomingCall }
      }))
      setIncomingCall(null)
      setCallerInfo(null)
    } catch (error) {
      console.error('Failed to reject call:', error)
      setIncomingCall(null)
      setCallerInfo(null)
    } finally {
      setIsRejecting(false)
    }
  }

  // Manual close for stuck UI
  const handleClose = () => {
    console.log('[IncomingCallUI] Manually closed')
    stopAllAudio()
    setIncomingCall(null)
    setCallerInfo(null)
  }

  if (!incomingCall || !callerInfo) return null

  const isVideoCall = incomingCall.getType() === CometChat.CALL_TYPE.VIDEO
  const callerName = callerInfo.name || 'Unknown'
  const callerAvatar = callerInfo.avatar || ''

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-container">
        <div className="incoming-call-header">
          <h2>Incoming {isVideoCall ? 'Video' : 'Voice'} Call</h2>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '5px 12px',
              borderRadius: '50%',
              lineHeight: '1',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="incoming-call-content">
          <div className="incoming-call-avatar">
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName} />
            ) : (
              <div className="incoming-call-avatar-placeholder">
                {callerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="incoming-call-info">
            <h3>{callerName}</h3>
            <p>is calling you...</p>
          </div>
        </div>

        <div className="incoming-call-actions">
          <button
            className="incoming-call-btn accept-btn"
            onClick={handleAcceptCall}
            disabled={isAccepting || isRejecting}
          >
            {isVideoCall ? <FiVideo /> : <FiPhone />}
            <span>{isAccepting ? 'Accepting...' : 'Accept'}</span>
          </button>

          <button
            className="incoming-call-btn reject-btn"
            onClick={handleRejectCall}
            disabled={isAccepting || isRejecting}
          >
            <FiX />
            <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallUI
