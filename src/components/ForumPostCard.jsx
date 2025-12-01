import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiMessageSquare, 
  FiThumbsUp, 
  FiThumbsDown,
  FiClock,
  FiUser,
  FiTag
} from 'react-icons/fi'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { generateFlairs } from '../utils/flairUtils'
import { getAvatarUrlOrDefault } from '../utils/avatarUtils'
import './ForumPostCard.css'

const ForumPostCard = ({ post, showCategory = true }) => {
  const [authorFlairs, setAuthorFlairs] = useState([])
  const [authorAvatar, setAuthorAvatar] = useState(null)
  const formatDate = (date) => {
    if (!date) return ''
    const postDate = date.toDate ? date.toDate() : new Date(date)
    const now = new Date()
    const diffMs = now - postDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return postDate.toLocaleDateString()
  }

  useEffect(() => {
    const loadAuthorData = async () => {
      // If post already has stored flairs, use them
      if (post.authorFlairs && post.authorFlairs.length > 0) {
        setAuthorFlairs(post.authorFlairs)
      }

      // If post has authorAvatar, use it
      if (post.authorAvatar) {
        setAuthorAvatar(post.authorAvatar)
      }

      // For backward compatibility: fetch author's current profile to get accurate flairs and avatar
      if (post.authorId && db) {
        try {
          // Fetch author's current profile
          const userDoc = await getDoc(doc(db, 'users', post.authorId))
          if (userDoc.exists()) {
            const userProfile = userDoc.data()
            
            // Get avatar from current profile if post doesn't have it
            if (!post.authorAvatar && userProfile.avatar) {
              setAuthorAvatar(userProfile.avatar)
            }
            
            // Check if user is admin and get role
            let isAdmin = false
            let adminRole = null
            try {
              const adminDoc = await getDoc(doc(db, 'admins', post.authorId))
              if (adminDoc.exists()) {
                isAdmin = true
                adminRole = adminDoc.data().role || 'admin'
              }
            } catch (err) {
              // Ignore errors checking admin status
            }

            // Use stored flairs from user profile (computed and stored when profile changes)
            if (!post.authorFlairs || post.authorFlairs.length === 0) {
              if (userProfile.flairs && userProfile.flairs.length > 0) {
                setAuthorFlairs(userProfile.flairs)
              }
            }
          }
        } catch (error) {
          console.error('Error loading author data:', error)
        }
      } else {
        // Fallback to old post data
        if (!post.authorFlairs || post.authorFlairs.length === 0) {
          const flairs = generateFlairs({
            acmRole: post.authorRole,
            role: post.authorRole,
            degree: post.authorDegree,
            semester: post.authorSemester
          }, post.authorIsAdmin || false)
          setAuthorFlairs(flairs)
        }
      }
    }

    loadAuthorData()
  }, [post.authorId, post.authorFlairs, post.authorAvatar, post.authorRole, post.authorDegree, post.authorSemester, post.authorIsAdmin])

  const getCategoryColor = (category) => {
    const colors = {
      'General': 'category-general',
      'Technical': 'category-technical',
      'Events': 'category-events',
      'Projects': 'category-projects',
      'Help': 'category-help',
      'Announcements': 'category-announcements'
    }
    return colors[category] || 'category-general'
  }

  return (
    <Link to={`/forum/${post.id}`} className="forum-post-card">
      <div className="post-card-header">
        <div className="post-author-info">
          <div className="author-avatar">
            {(() => {
              // Try avatar from state (fetched from profile), then post data, then authorPhotoURL as fallback
              const avatarPath = authorAvatar || post.authorAvatar
              const avatarUrl = getAvatarUrlOrDefault(avatarPath || post.authorPhotoURL)
              return avatarUrl ? (
                <img src={avatarUrl} alt={post.authorName} />
              ) : (
                <FiUser />
              )
            })()}
          </div>
          <div className="author-details">
            <div className="author-name-with-flairs">
              <span className="author-name">{post.authorName || 'Anonymous'}</span>
              {authorFlairs.map((flair, index) => (
                <span key={index} className={`user-flair ${flair.class}`}>
                  {flair.text}
                </span>
              ))}
            </div>
            <div className="post-meta">
              <FiClock />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
        {showCategory && post.category && (
          <span className={`category-badge ${getCategoryColor(post.category)}`}>
            <FiTag />
            {post.category}
          </span>
        )}
      </div>

      <h3 className="post-title">{post.title}</h3>
      <p className="post-preview">{post.content}</p>

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.slice(0, 5).map((tag, index) => (
            <span key={index} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="post-card-footer">
        <div className="post-stats">
          <div className="stat-item">
            <FiThumbsUp />
            <span>{post.upvotes || 0}</span>
          </div>
          <div className="stat-item">
            <FiThumbsDown />
            <span>{post.downvotes || 0}</span>
          </div>
          <div className="stat-item">
            <FiMessageSquare />
            <span>{post.replyCount || 0} {post.replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        </div>
        {post.isPinned && (
          <span className="pinned-badge">Pinned</span>
        )}
      </div>
    </Link>
  )
}

export default ForumPostCard

