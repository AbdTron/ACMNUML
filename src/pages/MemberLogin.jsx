import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiLock, FiMail, FiAlertCircle, FiUser, FiCheckCircle, FiSend } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import './MemberLogin.css'

const MemberLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { login, signup, signInWithGoogle, resetPassword, sendVerificationEmail, currentUser } = useMemberAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignup) {
        await signup(email, password, name)
        setSuccess('Account created! Please check your email to verify your account.')
        // Don't navigate immediately - let user see success message
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } else {
        await login(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(err.message || `Failed to ${isSignup ? 'sign up' : 'login'}. Please check your credentials.`)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess('Password reset email sent! Please check your inbox.')
      setShowForgotPassword(false)
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await sendVerificationEmail()
      setSuccess('Verification email sent! Please check your inbox.')
    } catch (err) {
      setError(err.message || 'Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="member-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>{isSignup ? 'Create Account' : 'Member Login'}</h1>
            <p>ACM NUML Member Portal</p>
          </div>

          {error && (
            <div className="error-message">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-message">
              <FiCheckCircle />
              <span>{success}</span>
            </div>
          )}

          {currentUser && !currentUser.emailVerified && !isSignup && (
            <div className="verification-notice">
              <FiAlertCircle />
              <div>
                <p>Your email is not verified. Please verify your email to access all features.</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="link-button"
                  disabled={loading}
                >
                  Resend verification email
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {isSignup && (
              <div className="form-group">
                <label htmlFor="name">
                  <FiUser />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <FiMail />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FiLock />
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!showForgotPassword}
                placeholder="Enter your password"
                disabled={loading}
                minLength={6}
              />
              {!isSignup && !showForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError('')
                    setSuccess('')
                  }}
                  className="forgot-password-link"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {!showForgotPassword && (
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
              </button>
            )}

            {showForgotPassword && (
              <div className="forgot-password-section">
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="btn btn-primary btn-full"
                  disabled={loading || !email}
                >
                  {loading ? 'Sending...' : (
                    <>
                      <FiSend />
                      Send Reset Link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError('')
                    setSuccess('')
                  }}
                  className="link-button"
                >
                  Back to login
                </button>
              </div>
            )}
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn btn-google btn-full"
            disabled={loading}
          >
            <FcGoogle />
            Continue with Google
          </button>

          <div className="login-footer">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
              }}
              className="link-button"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
            <Link to="/" className="back-link">
              ← Back to Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberLogin






