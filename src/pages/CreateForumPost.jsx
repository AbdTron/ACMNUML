import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { 
  FiArrowLeft, 
  FiType, 
  FiAlignLeft, 
  FiTag,
  FiPlus,
  FiX,
  FiSend
} from 'react-icons/fi'
import './CreateForumPost.css'

const CATEGORIES = [
  'General',
  'Technical',
  'Events',
  'Projects',
  'Help',
  'Announcements'
]

const CreateForumPost = () => {
  const { currentUser, userProfile } = useMemberAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: []
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/member/login')
      return
    }

    // Check if profile is complete
    if (userProfile && !userProfile.profileComplete) {
      navigate('/member/onboarding')
      return
    }
  }, [currentUser, userProfile, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleAddTag = (e) => {
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    
    if (!tag) return
    
    if (formData.tags.includes(tag)) {
      setError('Tag already added')
      return
    }

    if (formData.tags.length >= 5) {
      setError('Maximum 5 tags allowed')
      return
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }))
    setTagInput('')
    setError(null)
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (formData.title.length < 10) {
      setError('Title must be at least 10 characters')
      return
    }

    if (!formData.content.trim()) {
      setError('Content is required')
      return
    }

    if (formData.content.length < 20) {
      setError('Content must be at least 20 characters')
      return
    }

    setLoading(true)

    try {
      // Create forum post
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        authorId: currentUser.uid,
        authorName: userProfile?.name || currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || null,
        authorRole: userProfile?.acmRole || null,
        authorSemester: userProfile?.semester || null,
        upvotes: 0,
        downvotes: 0,
        replyCount: 0,
        isPinned: false,
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'forumPosts'), postData)

      // Redirect to the new post
      navigate(`/forum/${docRef.id}`)
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-post-page">
      {/* Header */}
      <div className="create-post-header">
        <div className="container">
          <Link to="/forum" className="back-link">
            <FiArrowLeft />
            Back to Forum
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <section className="section create-post-section">
        <div className="container">
          <div className="create-post-container">
            <div className="form-header">
              <h1>Create New Post</h1>
              <p>Share your thoughts, questions, or projects with the community</p>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <form className="create-post-form" onSubmit={handleSubmit}>
              {/* Title */}
              <div className="form-field">
                <label htmlFor="title">
                  <FiType />
                  Post Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="What's your post about?"
                  required
                  maxLength={200}
                />
                <small className="field-hint">
                  {formData.title.length}/200 characters (min. 10)
                </small>
              </div>

              {/* Category */}
              <div className="form-field">
                <label htmlFor="category">
                  <FiTag />
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div className="form-field">
                <label htmlFor="content">
                  <FiAlignLeft />
                  Content <span className="required">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write your post content here... You can use ```language for code blocks"
                  rows={12}
                  required
                />
                <small className="field-hint">
                  {formData.content.length} characters (min. 20) • Supports markdown code blocks: ```language
                </small>
              </div>

              {/* Tags */}
              <div className="form-field">
                <label htmlFor="tags">
                  <FiTag />
                  Tags (optional)
                </label>
                <div className="tags-input-wrapper">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(e)
                      }
                    }}
                    placeholder="Add tags (press Enter)"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    className="add-tag-btn"
                    onClick={handleAddTag}
                  >
                    <FiPlus />
                  </button>
                </div>
                <small className="field-hint">
                  Add relevant tags to help others find your post (max 5)
                </small>
                {formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag-item">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="remove-tag-btn"
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div className="guidelines-box">
                <h3>Posting Guidelines</h3>
                <ul>
                  <li>Be respectful and constructive in your posts</li>
                  <li>Stay on topic and choose the appropriate category</li>
                  <li>Use code blocks for sharing code: ```language</li>
                  <li>Search before posting to avoid duplicates</li>
                  <li>No spam, self-promotion, or offensive content</li>
                </ul>
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate('/forum')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Publishing...' : (
                    <>
                      <FiSend />
                      Publish Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CreateForumPost



