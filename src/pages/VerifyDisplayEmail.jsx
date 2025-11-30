import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'
import './VerifyEmail.css'

const VerifyDisplayEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser, refreshProfile } = useMemberAuth()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('Verifying your display email...')

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      setStatus('error')
      setMessage('Invalid verification link. Please request a new verification email.')
      return
    }

    if (!currentUser || !db) {
      setStatus('error')
      setMessage('Please log in to verify your display email.')
      return
    }

    const handleVerification = async () => {
      try {
        // Get user profile
        const userRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userRef)
        
        if (!userDoc.exists()) {
          setStatus('error')
          setMessage('User profile not found.')
          return
        }

        const userData = userDoc.data()
        
        // Verify token and email match
        if (userData.displayEmail === decodeURIComponent(email) && 
            userData.displayEmailVerificationToken === token) {
          // Mark as verified and clear token
          await updateDoc(userRef, {
            displayEmailVerified: true,
            displayEmailVerificationToken: null,
            updatedAt: new Date().toISOString()
          })
          
          // Refresh the user profile in context
          if (refreshProfile) {
            await refreshProfile()
          }
          
          setStatus('success')
          setMessage('Your display email has been verified successfully!')
          setTimeout(() => {
            navigate('/member/profile')
          }, 3000)
        } else {
          setStatus('error')
          setMessage('Email verification failed. Invalid or expired verification link.')
        }
      } catch (error) {
        console.error('Display email verification error:', error)
        setStatus('error')
        setMessage(error.message || 'Failed to verify display email. Please try again.')
      }
    }

    handleVerification()
  }, [searchParams, currentUser, navigate])

  return (
    <div className="verify-email-page">
      <div className="verify-container">
        <div className="verify-card">
          {status === 'verifying' && (
            <div className="verify-status verifying">
              <FiLoader className="spinner" />
              <h2>Verifying Display Email</h2>
              <p>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-status success">
              <FiCheckCircle />
              <h2>Display Email Verified!</h2>
              <p>{message}</p>
              <p className="redirect-message">Redirecting to profile page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-status error">
              <FiAlertCircle />
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="verify-actions">
                <button
                  onClick={() => navigate('/member/profile')}
                  className="btn btn-primary"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyDisplayEmail

