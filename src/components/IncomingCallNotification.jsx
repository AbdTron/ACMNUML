import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi'
import { useStreamVideo } from '../context/StreamVideoContext'
import './IncomingCallNotification.css'

const IncomingCallNotification = () => {
    const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useStreamVideo()

    if (!incomingCall) return null

    // Get caller info from the call
    const caller = incomingCall.state?.members?.find(
        (member) => member.user?.id !== incomingCall.currentUserId
    )?.user

    const callerName = caller?.name || 'Someone'
    const callerImage = caller?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=6366f1&color=fff`

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
                        alt={callerName}
                        className="caller-avatar"
                    />
                    <h3 className="caller-name">{callerName}</h3>
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
