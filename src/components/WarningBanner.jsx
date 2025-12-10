import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useNavigate } from 'react-router-dom'
import { FiX, FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi'
import './WarningBanner.css'

const WarningBanner = () => {
    const { currentUser, userProfile } = useMemberAuth()
    const navigate = useNavigate()
    const [warnings, setWarnings] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [autoWarningDismissed, setAutoWarningDismissed] = useState(false)

    useEffect(() => {
        if (currentUser) {
            fetchWarnings()
        }
    }, [currentUser, userProfile])

    const fetchWarnings = async () => {
        if (!db || !currentUser) return

        try {
            const allWarnings = []

            // 1. Fetch admin-sent warnings from Firestore
            const warningsRef = collection(db, 'userWarnings')
            const q = query(
                warningsRef,
                where('userId', '==', currentUser.uid),
                where('acknowledged', '==', false)
            )
            const querySnapshot = await getDocs(q)

            querySnapshot.forEach((docSnap) => {
                allWarnings.push({
                    id: docSnap.id,
                    type: 'firestore',
                    ...docSnap.data()
                })
            })

            // 2. Check if auto-warning is enabled and profile is incomplete
            if (userProfile && !userProfile.profileComplete && !autoWarningDismissed) {
                try {
                    const settingsDoc = await getDoc(doc(db, 'settings', 'general'))
                    if (settingsDoc.exists()) {
                        const settings = settingsDoc.data()
                        if (settings.autoWarnIncompleteProfiles) {
                            // Check if required fields are missing
                            const hasRequiredFields = userProfile.rollNumber &&
                                userProfile.department &&
                                userProfile.degree &&
                                userProfile.semester &&
                                userProfile.section &&
                                userProfile.shift

                            if (!hasRequiredFields) {
                                // Add local warning (not from Firestore)
                                allWarnings.unshift({
                                    id: 'auto-complete-profile',
                                    type: 'local',
                                    title: '📝 Complete Your Profile',
                                    message: 'Your profile is missing required information. Please complete your profile to fully access all features and connect with other members.',
                                    buttons: [{ text: 'Complete Profile Now', url: '/member/onboarding' }],
                                    severity: 'warning'
                                })
                            }
                        }
                    }
                } catch (settingsError) {
                    console.error('Error checking settings:', settingsError)
                }
            }

            if (allWarnings.length > 0) {
                setWarnings(allWarnings)
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        } catch (error) {
            console.error('Error fetching warnings:', error)
        }
    }

    const handleAcknowledge = async () => {
        if (warnings.length === 0) return

        try {
            const currentWarning = warnings[currentIndex]

            if (currentWarning.type === 'firestore' && db) {
                // Update Firestore warning
                await updateDoc(doc(db, 'userWarnings', currentWarning.id), {
                    acknowledged: true,
                    acknowledgedAt: new Date()
                })
            } else if (currentWarning.type === 'local') {
                // For local auto-warnings, just mark as dismissed for this session
                setAutoWarningDismissed(true)
            }

            // Move to next warning or close
            if (currentIndex < warnings.length - 1) {
                setCurrentIndex(prev => prev + 1)
            } else {
                setIsVisible(false)
            }
        } catch (error) {
            console.error('Error acknowledging warning:', error)
        }
    }

    const handleButtonClick = (url) => {
        // Check if it's an internal link
        if (url.startsWith('/')) {
            navigate(url)
            // Don't acknowledge on button click - let user complete the action first
        } else {
            window.open(url, '_blank')
        }
    }

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <FiAlertCircle className="warning-icon critical" />
            case 'warning':
                return <FiAlertTriangle className="warning-icon warning" />
            case 'info':
                return <FiInfo className="warning-icon info" />
            default:
                return <FiAlertTriangle className="warning-icon warning" />
        }
    }

    if (!isVisible || warnings.length === 0) return null

    const currentWarning = warnings[currentIndex]

    return (
        <div className={`warning-banner ${currentWarning.severity || 'warning'}`}>
            <div className="warning-banner-content">
                {getSeverityIcon(currentWarning.severity)}
                <div className="warning-banner-text">
                    <h4>{currentWarning.title}</h4>
                    <p>{currentWarning.message}</p>
                    {currentWarning.buttons && currentWarning.buttons.length > 0 && (
                        <div className="warning-banner-buttons">
                            {currentWarning.buttons.map((button, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleButtonClick(button.url)}
                                    className="warning-action-btn"
                                >
                                    {button.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="warning-banner-actions">
                    {warnings.length > 1 && (
                        <span className="warning-count">
                            {currentIndex + 1} of {warnings.length}
                        </span>
                    )}
                    <button
                        className="warning-dismiss-btn"
                        onClick={handleAcknowledge}
                        title="Dismiss"
                    >
                        <FiX />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default WarningBanner

