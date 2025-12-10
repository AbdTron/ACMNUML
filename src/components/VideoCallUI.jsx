import { useState } from 'react'
import {
    useCall,
    useCallStateHooks,
    ParticipantView,
    StreamTheme,
} from '@stream-io/video-react-sdk'
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMonitor, FiMaximize2, FiMinimize2 } from 'react-icons/fi'
import { useStreamVideo } from '../context/StreamVideoContext'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import './VideoCallUI.css'

const VideoCallUI = () => {
    const call = useCall()
    const { endCall } = useStreamVideo()
    const {
        useLocalParticipant,
        useRemoteParticipants,
        useCameraState,
        useMicrophoneState,
        useScreenShareState,
    } = useCallStateHooks()

    const localParticipant = useLocalParticipant()
    const remoteParticipants = useRemoteParticipants()
    const { camera, isMute: isCameraMuted } = useCameraState()
    const { microphone, isMute: isMicMuted } = useMicrophoneState()
    const { screenShare, isMute: isScreenShareOff } = useScreenShareState()

    const [isFullscreen, setIsFullscreen] = useState(false)

    if (!call) return null

    const handleToggleCamera = async () => {
        if (isCameraMuted) {
            await camera.enable()
        } else {
            await camera.disable()
        }
    }

    const handleToggleMic = async () => {
        if (isMicMuted) {
            await microphone.enable()
        } else {
            await microphone.disable()
        }
    }

    const handleToggleScreenShare = async () => {
        if (isScreenShareOff) {
            await screenShare.enable()
        } else {
            await screenShare.disable()
        }
    }

    const handleEndCall = async () => {
        await endCall()
    }

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    return (
        <StreamTheme>
            <div className={`video-call-ui ${isFullscreen ? 'fullscreen' : ''}`}>
                {/* Remote Participants */}
                <div className="video-call-participants">
                    {remoteParticipants.length > 0 ? (
                        remoteParticipants.map((participant) => (
                            <div key={participant.sessionId} className="video-call-participant remote">
                                <ParticipantView
                                    participant={participant}
                                    trackType="videoTrack"
                                />
                                <div className="participant-name">{participant.name || 'Unknown'}</div>
                            </div>
                        ))
                    ) : (
                        <div className="video-call-waiting">
                            <div className="waiting-spinner"></div>
                            <p>Waiting for others to join...</p>
                        </div>
                    )}
                </div>

                {/* Local Participant (Picture-in-Picture) */}
                {localParticipant && (
                    <div className="video-call-participant local">
                        <ParticipantView
                            participant={localParticipant}
                            trackType="videoTrack"
                        />
                        <div className="participant-name">You</div>
                    </div>
                )}

                {/* Call Controls */}
                <div className="video-call-controls">
                    <button
                        className={`control-btn ${isMicMuted ? 'muted' : ''}`}
                        onClick={handleToggleMic}
                        title={isMicMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMicMuted ? <FiMicOff /> : <FiMic />}
                    </button>

                    <button
                        className={`control-btn ${isCameraMuted ? 'muted' : ''}`}
                        onClick={handleToggleCamera}
                        title={isCameraMuted ? 'Enable Camera' : 'Disable Camera'}
                    >
                        {isCameraMuted ? <FiVideoOff /> : <FiVideo />}
                    </button>

                    <button
                        className={`control-btn ${!isScreenShareOff ? 'active' : ''}`}
                        onClick={handleToggleScreenShare}
                        title={isScreenShareOff ? 'Share Screen' : 'Stop Sharing'}
                    >
                        <FiMonitor />
                    </button>

                    <button
                        className="control-btn fullscreen-btn"
                        onClick={handleToggleFullscreen}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                    </button>

                    <button
                        className="control-btn end-call"
                        onClick={handleEndCall}
                        title="End Call"
                    >
                        <FiPhoneOff />
                    </button>
                </div>
            </div>
        </StreamTheme>
    )
}

export default VideoCallUI
