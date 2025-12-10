import { useState, useEffect } from 'react'
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi'
import { useStreamVideo } from '../context/StreamVideoContext'
import './IncomingCallNotification.css'

const IncomingCallNotification = () => {
    const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useStreamVideo()
    const [callerInfo, setCallerInfo] = useState({ name: 'Someone', image: null })

    // Get caller info from the call
    useEffect(() => {
        if (!incomingCall) {
            setCallerInfo({ name: 'Someone', image: null })
            return
        }

        const getCallerInfo = async () => {
            try {
                // Try different ways to access caller info from Stream Video SDK
                let caller = null

                // Method 1: From call.state.createdBy (the caller)
                if (incomingCall.state?.createdBy) {
                    caller = incomingCall.state.createdBy
                }

                // Method 2: From call.state.members array
                if (!caller && incomingCall.state?.members) {
                    const members = Array.isArray(incomingCall.state.members)
                        ? incomingCall.state.members
                        : Object.values(incomingCall.state.members || {})

                    caller = members.find(m => m.user?.id !== incomingCall.currentUserId)?.user
                }

                // Method 3: From call createdBy property
                if (!caller && incomingCall.createdBy) {
                    caller = incomingCall.createdBy
                }

                // Method 4: From call data
                if (!caller && incomingCall.data?.created_by) {
                    caller = incomingCall.data.created_by
                }

                console.log('[Incoming Call] Caller info:', caller)

                if (caller) {
                    setCallerInfo({
                        name: caller.name || caller.id || 'Someone',
                        image: caller.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(caller.name || caller.id || 'User')}&background=6366f1&color=fff`
                    })
                }
            } catch (error) {
                console.error('[Incoming Call] Error getting caller info:', error)
            }
        }

        getCallerInfo()
    }, [incomingCall])

    if (!incomingCall) return null

    const callerImage = callerInfo.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerInfo.name)}&background=6366f1&color=fff`

    return (
        <div className="incoming-call-overlay">
            <div className="incoming-call-modal">
                <div className="incoming-call-header">
                    <FiVideo className="call-type-icon" />
                    <span>Incoming Video Call</span>
                </div>

                <div className="caller-info">
                    <img
                        src={callerImage}
                        alt={callerInfo.name}
                        className="caller-avatar"
                    />
                    <h3 className="caller-name">{callerInfo.name}</h3>
                    <p className="call-status">is calling you...</p>
                </div>

                <div className="incoming-call-actions">
                    <button
                        className="call-action-btn reject"
                        onClick={rejectIncomingCall}
                        title="Decline"
                    >
                        <FiPhoneOff />
                        <span>Decline</span>
                    </button>

                    <button
                        className="call-action-btn accept"
                        onClick={acceptIncomingCall}
                        title="Accept"
                    >
                        <FiPhone />
                        <span>Accept</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default IncomingCallNotification
