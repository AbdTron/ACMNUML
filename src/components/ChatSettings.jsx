import { useState, useEffect } from 'react'
import { FiMessageSquare, FiMail, FiX, FiPlus } from 'react-icons/fi'
import { useCometChat } from '../context/CometChatContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { invalidatePermissionCache } from '../utils/chatPermissions'
import './ChatSettings.css'

const ChatSettings = () => {
  const { currentUser } = useMemberAuth()
  const { getChatSettings, updateChatSettings, isLoggedIn } = useCometChat()
  const [chatEnabled, setChatEnabled] = useState(true)
  const [allowList, setAllowList] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadSettings()
    }
  }, [isLoggedIn, currentUser])

  const loadSettings = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const settings = await getChatSettings(currentUser.uid)
      if (settings) {
        setChatEnabled(settings.chatEnabled)
        setAllowList(settings.chatAllowList || [])
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error)
      setError('Failed to load chat settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentUser) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const success = await updateChatSettings(currentUser.uid, {
        chatEnabled,
        chatAllowList: allowList,
      })

      if (success) {
        setSuccess(true)
        // Invalidate cache for this user so permission checks reflect new settings
        invalidatePermissionCache(currentUser.uid)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Failed to save chat settings')
      }
    } catch (error) {
      console.error('Error saving chat settings:', error)
      setError('Failed to save chat settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (allowList.includes(newEmail)) {
      setError('This email is already in the allow list')
      return
    }

    if (allowList.length >= 100) {
      setError('Allow list is limited to 100 emails')
      return
    }

    setAllowList([...allowList, newEmail])
    setNewEmail('')
    setError(null)
  }

  const handleRemoveEmail = (email) => {
    setAllowList(allowList.filter(e => e !== email))
  }

  if (loading) {
    return (
      <div className="chat-settings">
        <div className="loading">Loading chat settings...</div>
      </div>
    )
  }

  return (
    <div className="chat-settings">
      <h3>
        <FiMessageSquare />
        Chat Settings
      </h3>

      <div className="chat-settings-content">
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={chatEnabled}
              onChange={(e) => {
                setChatEnabled(e.target.checked)
                setError(null)
              }}
            />
            <span>Allow others to message me</span>
          </label>
          <p className="setting-description">
            When enabled, anyone can send you messages. When disabled, only users in your allow list can message you.
          </p>
        </div>

        {!chatEnabled && (
          <div className="setting-item allow-list-section">
            <label className="setting-label">Allow List</label>
            <p className="setting-description">
              When chat is disabled, only these email addresses can message you.
            </p>

            <div className="allow-list-input">
              <input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  setError(null)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddEmail()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="btn-add-email"
                disabled={!newEmail || !newEmail.includes('@')}
              >
                <FiPlus />
                Add
              </button>
            </div>

            {allowList.length > 0 && (
              <div className="allow-list-items">
                {allowList.map((email, index) => (
                  <div key={index} className="allow-list-item">
                    <FiMail />
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="btn-remove-email"
                      aria-label={`Remove ${email}`}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {allowList.length === 0 && (
              <p className="allow-list-empty">No emails in allow list. Add emails to allow specific users to message you.</p>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {success && (
          <div className="success-message">Chat settings saved successfully!</div>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="btn-save-settings"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default ChatSettings

