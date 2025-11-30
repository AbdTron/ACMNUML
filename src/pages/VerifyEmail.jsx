import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi'
import './VerifyEmail.css'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail } = useMemberAuth()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const actionCode = searchParams.get('oobCode')
    const mode = searchParams.get('mode')

    if (!actionCode) {
      setStatus('error')
      setMessage('Invalid verification link. Please request a new verification email.')
      return
    }

    const handleVerification = async () => {
      try {
        await verifyEmail(actionCode)
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        setTimeout(() => {
          navigate('/member/login')
        }, 3000)
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        if (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code') {
          setMessage('This verification link has expired or is invalid. Please request a new verification email.')
        } else {
          setMessage(error.message || 'Failed to verify email. Please try again.')
        }
      }
    }

    if (mode === 'verifyEmail' || actionCode) {
      handleVerification()
    } else {
      setStatus('error')
      setMessage('Invalid verification link.')
    }
  }, [searchParams, verifyEmail, navigate])

  return (
    <div className="verify-email-page">
      <div className="verify-container">
        <div className="verify-card">
          {status === 'verifying' && (
            <div className="verify-status verifying">
              <FiLoader className="spinner" />
              <h2>Verifying Email</h2>
              <p>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-status success">
              <FiCheckCircle />
              <h2>Email Verified!</h2>
              <p>{message}</p>
              <p className="redirect-message">Redirecting to login page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-status error">
              <FiAlertCircle />
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <div className="verify-actions">
                <button
                  onClick={() => navigate('/member/login')}
                  className="btn btn-primary"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail

