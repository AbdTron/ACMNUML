import { Link } from 'react-router-dom'
import { 
  FiMessageSquare, 
  FiThumbsUp, 
  FiThumbsDown,
  FiClock,
  FiUser,
  FiTag
} from 'react-icons/fi'
import './ForumPostCard.css'

const ForumPostCard = ({ post, showCategory = true }) => {
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

  const getRoleFlair = (role) => {
    if (!role) return null
    const roleLower = role.toLowerCase()
    if (roleLower.includes('president')) return { text: 'President', class: 'flair-president' }
    if (roleLower.includes('vice president')) return { text: 'Vice President', class: 'flair-vp' }
    if (roleLower.includes('secretary')) return { text: 'Secretary', class: 'flair-secretary' }
    if (roleLower.includes('admin')) return { text: 'Admin', class: 'flair-admin' }
    if (roleLower.includes('moderator')) return { text: 'Moderator', class: 'flair-moderator' }
    if (roleLower.includes('member')) return { text: 'Member', class: 'flair-member' }
    return null
  }

  const roleFlair = getRoleFlair(post.authorRole)

  return (
    <Link to={`/forum/${post.id}`} className="forum-post-card">
      <div className="post-card-header">
        <div className="post-author-info">
          <div className="author-avatar">
            {post.authorPhotoURL ? (
              <img src={post.authorPhotoURL} alt={post.authorName} />
            ) : (
              <FiUser />
            )}
          </div>
          <div className="author-details">
            <div className="author-name-with-flairs">
              <span className="author-name">{post.authorName || 'Anonymous'}</span>
              {roleFlair && (
                <span className={`user-flair ${roleFlair.class}`}>
                  {roleFlair.text}
                </span>
              )}
              {post.authorSemester && (
                <span className="user-flair flair-semester">
                  Sem {post.authorSemester}
                </span>
              )}
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

