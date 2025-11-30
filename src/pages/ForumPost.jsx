import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  orderBy
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { 
  FiArrowLeft, 
  FiThumbsUp, 
  FiThumbsDown,
  FiMessageSquare,
  FiClock,
  FiUser,
  FiTag,
  FiSend
} from 'react-icons/fi'
import CodeSnippet from '../components/CodeSnippet'
import './ForumPost.css'

const ForumPost = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useMemberAuth()
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [userVote, setUserVote] = useState(null) // 'up', 'down', or null

  useEffect(() => {
    fetchPost()
    fetchReplies()
  }, [postId])

  const fetchPost = async () => {
    try {
      const postDoc = await getDoc(doc(db, 'forumPosts', postId))
      if (postDoc.exists()) {
        setPost({ id: postDoc.id, ...postDoc.data() })
      } else {
        console.error('Post not found')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReplies = async () => {
    try {
      const repliesQuery = query(
        collection(db, 'forumReplies'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      )
      const snapshot = await getDocs(repliesQuery)
      const repliesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setReplies(repliesData)
    } catch (error) {
      console.error('Error fetching replies:', error)
    }
  }

  const handleVote = async (voteType) => {
    if (!currentUser) {
      alert('Please login to vote')
      return
    }

    try {
      const postRef = doc(db, 'forumPosts', postId)
      
      if (userVote === voteType) {
        // Remove vote
        await updateDoc(postRef, {
          [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(-1)
        })
        setUserVote(null)
      } else {
        // Add or change vote
        const updates = {}
        if (userVote) {
          // Remove previous vote
          updates[userVote === 'up' ? 'upvotes' : 'downvotes'] = increment(-1)
        }
        // Add new vote
        updates[voteType === 'up' ? 'upvotes' : 'downvotes'] = increment(1)
        
        await updateDoc(postRef, updates)
        setUserVote(voteType)
      }

      // Refresh post data
      fetchPost()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    
    if (!currentUser) {
      alert('Please login to reply')
      return
    }

    if (!replyContent.trim()) return

    setSubmittingReply(true)
    try {
      await addDoc(collection(db, 'forumReplies'), {
        postId,
        content: replyContent,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0
      })

      // Update reply count in post
      await updateDoc(doc(db, 'forumPosts', postId), {
        replyCount: increment(1)
      })

      setReplyContent('')
      fetchReplies()
      fetchPost()
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Failed to submit reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    const postDate = date.toDate ? date.toDate() : new Date(date)
    return postDate.toLocaleString()
  }

  const parseContent = (content) => {
    // Parse content to detect code blocks
    // Format: ```language\ncode\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        })
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'javascript',
        content: match[2].trim()
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }]
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

  if (loading) {
    return (
      <div className="forum-post-page">
        <div className="container">
          <div className="loading-state">Loading post...</div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="forum-post-page">
        <div className="container">
          <div className="error-state">
            <h2>Post Not Found</h2>
            <p>The post you're looking for doesn't exist or has been removed.</p>
            <Link to="/forum" className="btn-primary">
              <FiArrowLeft />
              Back to Forum
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const contentParts = parseContent(post.content)

  return (
    <div className="forum-post-page">
      {/* Back Button */}
      <div className="back-to-forum">
        <div className="container">
          <Link to="/forum" className="back-link">
            <FiArrowLeft />
            Back to Forum
          </Link>
        </div>
      </div>

      <section className="section post-section">
        <div className="container">
          <div className="post-layout">
            {/* Main Post */}
            <div className="post-main">
              <article className="post-content-card">
                <div className="post-header">
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
                        {getRoleFlair(post.authorRole) && (
                          <span className={`user-flair ${getRoleFlair(post.authorRole).class}`}>
                            {getRoleFlair(post.authorRole).text}
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
                  {post.category && (
                    <span className="category-badge">
                      <FiTag />
                      {post.category}
                    </span>
                  )}
                </div>

                <h1 className="post-title">{post.title}</h1>

                <div className="post-content">
                  {contentParts.map((part, index) => {
                    if (part.type === 'code') {
                      return (
                        <CodeSnippet 
                          key={index}
                          code={part.content}
                          language={part.language}
                        />
                      )
                    }
                    return (
                      <p key={index} style={{ whiteSpace: 'pre-wrap' }}>
                        {part.content}
                      </p>
                    )
                  })}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="post-actions">
                  <button 
                    className={`vote-btn ${userVote === 'up' ? 'active' : ''}`}
                    onClick={() => handleVote('up')}
                  >
                    <FiThumbsUp />
                    <span>{post.upvotes || 0}</span>
                  </button>
                  <button 
                    className={`vote-btn ${userVote === 'down' ? 'active' : ''}`}
                    onClick={() => handleVote('down')}
                  >
                    <FiThumbsDown />
                    <span>{post.downvotes || 0}</span>
                  </button>
                  <div className="reply-count">
                    <FiMessageSquare />
                    <span>{post.replyCount || 0} {post.replyCount === 1 ? 'reply' : 'replies'}</span>
                  </div>
                </div>
              </article>

              {/* Replies Section */}
              <div className="replies-section">
                <h2>
                  <FiMessageSquare />
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h2>

                {currentUser && (
                  <form className="reply-form" onSubmit={handleSubmitReply}>
                    <div className="reply-input-wrapper">
                      <div className="author-avatar small">
                        {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt={currentUser.displayName} />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply... (Use ```language for code blocks)"
                        rows={4}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn-submit-reply"
                      disabled={submittingReply || !replyContent.trim()}
                    >
                      <FiSend />
                      {submittingReply ? 'Posting...' : 'Post Reply'}
                    </button>
                  </form>
                )}

                {!currentUser && (
                  <div className="login-prompt-box">
                    <p>
                      <Link to="/member/login">Login</Link> to reply to this post
                    </p>
                  </div>
                )}

                {replies.length > 0 ? (
                  <div className="replies-list">
                    {replies.map(reply => {
                      const replyParts = parseContent(reply.content)
                      return (
                        <div key={reply.id} className="reply-card">
                          <div className="reply-header">
                            <div className="author-avatar small">
                              {reply.authorPhotoURL ? (
                                <img src={reply.authorPhotoURL} alt={reply.authorName} />
                              ) : (
                                <FiUser />
                              )}
                            </div>
                            <div className="reply-author-info">
                              <div className="author-name-with-flairs">
                                <span className="author-name">{reply.authorName || 'Anonymous'}</span>
                                {getRoleFlair(reply.authorRole) && (
                                  <span className={`user-flair ${getRoleFlair(reply.authorRole).class}`}>
                                    {getRoleFlair(reply.authorRole).text}
                                  </span>
                                )}
                                {reply.authorSemester && (
                                  <span className="user-flair flair-semester">
                                    Sem {reply.authorSemester}
                                  </span>
                                )}
                              </div>
                              <div className="post-meta">
                                <FiClock />
                                <span>{formatDate(reply.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="reply-content">
                            {replyParts.map((part, index) => {
                              if (part.type === 'code') {
                                return (
                                  <CodeSnippet 
                                    key={index}
                                    code={part.content}
                                    language={part.language}
                                  />
                                )
                              }
                              return (
                                <p key={index} style={{ whiteSpace: 'pre-wrap' }}>
                                  {part.content}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  !currentUser && (
                    <div className="no-replies">
                      <p>No replies yet. Be the first to respond!</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="post-sidebar">
              <div className="sidebar-card">
                <h3>About This Discussion</h3>
                <div className="discussion-stats">
                  <div className="stat-item">
                    <span className="stat-label">Created</span>
                    <span className="stat-value">{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Replies</span>
                    <span className="stat-value">{post.replyCount || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Upvotes</span>
                    <span className="stat-value">{post.upvotes || 0}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ForumPost

