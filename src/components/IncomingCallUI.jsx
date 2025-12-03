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

  // Helper function to stop ringtone
  const stopRingtone = () => {
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
        ringtoneRef.current = null
        console.log('[IncomingCallUI] Ringtone stopped')
      } catch (e) {
        console.warn('[IncomingCallUI] Error stopping ringtone:', e)
      }
    }
  }

  // Helper function to stop ALL audio on the page
  const stopAllAudio = () => {
    console.log('[IncomingCallUI] Stopping all audio on page')
    stopRingtone()

    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach((audio) => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (e) {
        // Ignore
      }
    })
  }

  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !currentUser) return

    const callListenerID = 'incoming-call-ui-listener'

    const callListener = new CometChat.CallListener({
      onIncomingCallReceived: async (call) => {
        console.log('[IncomingCallUI] Incoming call received:', call)

        // Get caller information
        let caller = null
        try {
          const callerId = call.getCallInitiator()?.getUid() || call.getCallInitiator()?.uid
          if (callerId) {
            caller = await CometChat.getUser(callerId)
          }
        } catch (e) {
          console.warn('Could not get caller info:', e)
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
      onIncomingCallCancelled: (call) => {
        console.log('[IncomingCallUI] Incoming call cancelled:', call)
        stopAllAudio()
        setIncomingCall(null)
        setCallerInfo(null)
      },
      onCallEnded: (call) => {
        console.log('[IncomingCallUI] Call ended:', call)
        stopAllAudio()
        setIncomingCall(null)
        setCallerInfo(null)
      },
      onOutgoingCallAccepted: (call) => {
        console.log('[IncomingCallUI] Call accepted (ongoing):', call)
        stopAllAudio()
      },
    })

    CometChat.addCallListener(callListenerID, callListener)

    // Also listen to custom events
    const handleIncomingCall = (event) => {
      const { call } = event.detail
      setIncomingCall(call)
      if (event.detail.callerName) {
        setCallerInfo({
          name: event.detail.callerName,
          avatar: event.detail.callerAvatar || '',
        })
      }
    }

    const handleCallCancelled = (event) => {
      console.log('[IncomingCallUI] Call cancelled event')
      stopAllAudio()
      setIncomingCall(null)
      setCallerInfo(null)
    }

    const handleCallEnded = (event) => {
      console.log('[IncomingCallUI] Call ended event')
      stopAllAudio()
      setIncomingCall(null)
      setCallerInfo(null)
    }

    const handleCallAccepted = (event) => {
      console.log('[IncomingCallUI] Call accepted event')
      stopAllAudio()
    }

    window.addEventListener('cometchat:incoming-call', handleIncomingCall)
    window.addEventListener('cometchat:call-cancelled', handleCallCancelled)
    window.addEventListener('cometchat:call-ended', handleCallEnded)
    window.addEventListener('cometchat:call-accepted', handleCallAccepted)

    return () => {
      stopAllAudio()
      CometChat.removeCallListener(callListenerID)
      window.removeEventListener('cometchat:incoming-call', handleIncomingCall)
      window.removeEventListener('cometchat:call-cancelled', handleCallCancelled)
      window.removeEventListener('cometchat:call-ended', handleCallEnded)
      window.removeEventListener('cometchat:call-accepted', handleCallAccepted)
    }
  }, [isInitialized, isLoggedIn, currentUser])

  const handleAcceptCall = async () => {
    if (!incomingCall || isAccepting || isRejecting) return

    setIsAccepting(true)

    // Stop all audio
    if (window.stopAllPageAudio) {
      window.stopAllPageAudio()
    } else {
      stopAllAudio()
    }

    try {
      console.log('[IncomingCallUI] Accepting call:', incomingCall.getSessionId())
      const acceptedCall = await CometChat.acceptCall(incomingCall.getSessionId())
      console.log('[IncomingCallUI] Call accepted successfully')

      // Dispatch event
      window.dispatchEvent(new CustomEvent('cometchat:call-accepted', {
        detail: { call: acceptedCall }
      }))

      setIncomingCall(null)
      setCallerInfo(null)
    } catch (error) {
      console.error('[IncomingCallUI] Failed to accept call:', error)
      alert('Failed to accept call. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectCall = async () => {
    if (!incomingCall || isAccepting || isRejecting) return

    setIsRejecting(true)

    // Stop all audio
    if (window.stopAllPageAudio) {
      window.stopAllPageAudio()
    } else {
      stopAllAudio()
    }

    try {
      console.log('[IncomingCallUI] Rejecting call:', incomingCall.getSessionId())
      await CometChat.rejectCall(incomingCall.getSessionId(), CometChat.CALL_STATUS.REJECTED)
      console.log('[IncomingCallUI] Call rejected successfully')

      // Dispatch event
      window.dispatchEvent(new CustomEvent('cometchat:call-rejected', {
        detail: { call: incomingCall }
      }))

      setIncomingCall(null)
      setCallerInfo(null)
    } catch (error) {
      console.error('[IncomingCallUI] Failed to reject call:', error)
      setIncomingCall(null)
      setCallerInfo(null)
    } finally {
      setIsRejecting(false)
    }
  }

  // Don't show UI if no incoming call
  if (!incomingCall || !callerInfo) {
    return null
  }

  const isVideoCall = incomingCall.getType() === CometChat.CALL_TYPE.VIDEO
  const callerName = callerInfo.name || 'Unknown'
  const callerAvatar = callerInfo.avatar || ''

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-container">
        <div className="incoming-call-header">
          <h2>Incoming {isVideoCall ? 'Video' : 'Voice'} Call</h2>
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
            aria-label="Accept call"
          >
            {isVideoCall ? <FiVideo /> : <FiPhone />}
            <span>{isAccepting ? 'Accepting...' : 'Accept'}</span>
          </button>

          <button
            className="incoming-call-btn reject-btn"
            onClick={handleRejectCall}
            disabled={isAccepting || isRejecting}
            aria-label="Reject call"
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
