import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { FiLock, FiMail, FiAlertCircle, FiUser } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import './MemberLogin.css'

const MemberLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const { login, signup, signInWithGoogle } = useMemberAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        await signup(email, password, name)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || `Failed to ${isSignup ? 'sign up' : 'login'}. Please check your credentials.`)
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
                required
                placeholder="Enter your password"
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
            </button>
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




