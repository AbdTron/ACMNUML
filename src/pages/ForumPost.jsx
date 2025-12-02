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
  deleteDoc,
  increment,
  serverTimestamp,
  orderBy
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useAuth } from '../context/AuthContext'
// Flairs are now stored in user profiles and fetched directly
import { getAvatarUrlOrDefault } from '../utils/avatarUtils'
import { getAuthorData, getAuthorDataBatch } from '../utils/authorDataCache'
import { 
  FiArrowLeft, 
  FiThumbsUp, 
  FiThumbsDown,
  FiMessageSquare,
  FiClock,
  FiUser,
  FiTag,
  FiSend,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck
} from 'react-icons/fi'
import CodeSnippet from '../components/CodeSnippet'
import './ForumPost.css'

const ForumPost = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { currentUser, userProfile } = useMemberAuth()
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [userVote, setUserVote] = useState(null) // 'up', 'down', or null
  const [postAuthorFlairs, setPostAuthorFlairs] = useState([])
  const [postAuthorAvatar, setPostAuthorAvatar] = useState(null)
  const [replyAuthorsFlairs, setReplyAuthorsFlairs] = useState({}) // Map of replyId -> flairs
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [requestingDeletion, setRequestingDeletion] = useState(false)
  const [editingReplyId, setEditingReplyId] = useState(null)
  const [editReplyContent, setEditReplyContent] = useState('')
  
  // Use AuthContext for admin status (already cached)
  const { isAdmin: isAdminUser, userRole, isMainAdmin: isMainAdminUser } = useAuth()
  const isAdmin = isAdminUser
  const isMainAdmin = isMainAdminUser
  const adminName = userProfile?.name || currentUser?.email?.split('@')[0] || 'Admin'

  useEffect(() => {
    fetchPost()
    fetchReplies()
  }, [postId, currentUser])

  // Load author flairs for the post using cached data
  useEffect(() => {
    const loadPostAuthorFlairs = async () => {
      if (!post || !post.authorId || !db) return

      // If post already has stored flairs, use them (preferred - no query needed)
      if (post.authorFlairs && post.authorFlairs.length > 0) {
        setPostAuthorFlairs(post.authorFlairs)
      }

      // If post has authorAvatar, use it (preferred - no query needed)
      if (post.authorAvatar) {
        setPostAuthorAvatar(post.authorAvatar)
      }

      // For backward compatibility: fetch author's current profile using cached data
      try {
        const { userData: userProfile, adminRole } = await getAuthorData(post.authorId)
        
        if (userProfile) {
          // Get avatar from current profile if post doesn't have it
          if (!post.authorAvatar && userProfile.avatar) {
            setPostAuthorAvatar(userProfile.avatar)
          }

          // Use stored flairs from user profile (computed and stored when profile changes)
          if (!post.authorFlairs || post.authorFlairs.length === 0) {
            if (userProfile.flairs && userProfile.flairs.length > 0) {
              setPostAuthorFlairs(userProfile.flairs)
            }
          }
        }
      } catch (error) {
        console.error('Error loading post author data:', error)
      }
    }

    loadPostAuthorFlairs()
  }, [post])

  // Load author flairs for replies using batch fetch with cache
  useEffect(() => {
    const loadReplyAuthorsFlairs = async () => {
      if (!replies.length || !db) return

      const flairsMap = {}
      
      // Get unique author IDs that need data fetching
      const authorIdsNeedingData = replies
        .filter(reply => reply.authorId && (!reply.authorFlairs || reply.authorFlairs.length === 0))
        .map(reply => reply.authorId)
      
      // Remove duplicates
      const uniqueAuthorIds = [...new Set(authorIdsNeedingData)]
      
      // Batch fetch all author data at once (uses cache)
      if (uniqueAuthorIds.length > 0) {
        try {
          const authorsData = await getAuthorDataBatch(uniqueAuthorIds)
          
          // Map author data to replies
          replies.forEach(reply => {
            // If reply already has stored flairs, use them
            if (reply.authorFlairs && reply.authorFlairs.length > 0) {
              flairsMap[reply.id] = reply.authorFlairs
              return
            }
            
            if (reply.authorId && authorsData.has(reply.authorId)) {
              const { userData, adminRole } = authorsData.get(reply.authorId)
              if (userData) {
                // Use stored flairs from user profile
                if (userData.flairs && userData.flairs.length > 0) {
                  flairsMap[reply.id] = userData.flairs
                }
              }
            }
          })
        } catch (error) {
          console.error('Error loading reply author flairs:', error)
        }
      } else {
        // All replies already have flairs stored
        replies.forEach(reply => {
          if (reply.authorFlairs && reply.authorFlairs.length > 0) {
            flairsMap[reply.id] = reply.authorFlairs
          }
        })
      }

      setReplyAuthorsFlairs(flairsMap)
    }

    loadReplyAuthorsFlairs()
  }, [replies])

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

    // Check if voting is disabled
    if (post?.votingDisabled || post?.isDeletedByUser) {
      alert('Voting is disabled for this post.')
      return
    }

    try {
      const postRef = doc(db, 'forumPosts', postId)
      
      // Prepare updates object with only vote fields
      const updates = {}
      
      if (userVote === voteType) {
        // Remove vote - decrement the current vote type
        updates[voteType === 'up' ? 'upvotes' : 'downvotes'] = increment(-1)
        setUserVote(null)
      } else {
        // Add or change vote
        if (userVote) {
          // Remove previous vote
          updates[userVote === 'up' ? 'upvotes' : 'downvotes'] = increment(-1)
        }
        // Add new vote
        updates[voteType === 'up' ? 'upvotes' : 'downvotes'] = increment(1)
        setUserVote(voteType)
      }
      
      // Only update vote fields - this ensures other fields remain unchanged
      await updateDoc(postRef, updates)

      // Refresh post data
      fetchPost()
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to vote. Please try again.')
    }
  }

  const handleEditPost = () => {
    if (!post) return
    setEditContent(post.content || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!post || !editContent.trim()) return

    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        content: editContent.trim(),
        editedAt: serverTimestamp(),
        editedBy: currentUser.uid,
        isAdminEdit: isAdmin && !isMainAdmin, // Track if admin (but not super admin) edited
        isMainAdminEdit: isMainAdmin, // Track if super admin edited
        editedByAdminName: isAdmin && !isMainAdmin ? adminName : null // Store admin name if admin (not super admin)
      })

      setPost({ 
        ...post, 
        content: editContent.trim(), 
        editedAt: new Date(), 
        editedBy: currentUser.uid, 
        isAdminEdit: isAdmin && !isMainAdmin,
        isMainAdminEdit: isMainAdmin,
        editedByAdminName: isAdmin && !isMainAdmin ? adminName : null
      })
      setIsEditing(false)
      setEditContent('')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post')
    }
  }

  const handleDeletePost = async () => {
    if (!post) return
    if (!confirm('Are you sure you want to delete this post? The content will be removed and voting/replies will be disabled. You can request permanent deletion from an admin later.')) {
      return
    }

    setIsDeleting(true)
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        content: 'This post was deleted by the user.',
        isDeletedByUser: true,
        deletedAt: serverTimestamp(),
        votingDisabled: true,
        repliesDisabled: true,
        updatedAt: serverTimestamp()
      })

      // Refresh post data
      await fetchPost()
      alert('Post deleted. You can request permanent deletion from an admin.')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRequestPermanentDeletion = async () => {
    if (!post) return
    if (!confirm('Request permanent deletion of this post? An admin will review and delete it completely.')) {
      return
    }

    setRequestingDeletion(true)
    try {
      // Create a deletion request
      await addDoc(collection(db, 'postDeletionRequests'), {
        postId: postId,
        postTitle: post.title,
        authorId: post.authorId,
        authorName: post.authorName,
        requestedBy: currentUser.uid,
        requestedAt: serverTimestamp(),
        status: 'pending',
        reason: 'User requested permanent deletion'
      })

      alert('Deletion request submitted. An admin will review it.')
    } catch (error) {
      console.error('Error requesting deletion:', error)
      alert('Failed to submit deletion request')
    } finally {
      setRequestingDeletion(false)
    }
  }

  const handleEditReply = (reply) => {
    if (!reply) return
    setEditReplyContent(reply.content || '')
    setEditingReplyId(reply.id)
  }

  const handleCancelEditReply = () => {
    setEditingReplyId(null)
    setEditReplyContent('')
  }

  const handleSaveEditReply = async (replyId) => {
    if (!replyId || !editReplyContent.trim()) return

    try {
      await updateDoc(doc(db, 'forumReplies', replyId), {
        content: editReplyContent.trim(),
        editedAt: serverTimestamp(),
        editedBy: currentUser.uid,
        isAdminEdit: isAdmin && !isMainAdmin, // Track if admin (but not super admin) edited
        isMainAdminEdit: isMainAdmin, // Track if super admin edited
        editedByAdminName: isAdmin && !isMainAdmin ? adminName : null // Store admin name if admin (not super admin)
      })

      // Refresh replies
      await fetchReplies()
      setEditingReplyId(null)
      setEditReplyContent('')
    } catch (error) {
      console.error('Error updating reply:', error)
      alert('Failed to update reply')
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    
    if (!currentUser) {
      alert('Please login to reply')
      return
    }

    // Check if replies are disabled
    if (post?.repliesDisabled || post?.isDeletedByUser) {
      alert('Replies are disabled for this post.')
      return
    }

    if (!replyContent.trim()) return

    setSubmittingReply(true)
    try {
      await addDoc(collection(db, 'forumReplies'), {
        postId,
        content: replyContent,
        authorId: currentUser.uid,
        authorName: userProfile?.name || currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || null,
        authorAvatar: userProfile?.avatar || null,
        authorFlairs: userProfile?.flairs || [], // Use stored flairs from profile
        createdAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0
      })

      // Update reply count in post
      await updateDoc(doc(db, 'forumPosts', postId), {
        replyCount: increment(1)
      })

      setReplyContent('')
      // Refresh both replies and post to get updated replyCount
      await Promise.all([
        fetchReplies(),
        fetchPost() // This ensures replyCount is updated
      ])
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
                      {(() => {
                        // Try avatar from state (fetched from profile), then post data, then authorPhotoURL as fallback
                        const avatarPath = postAuthorAvatar || post?.authorAvatar
                        const avatarUrl = getAvatarUrlOrDefault(avatarPath || post?.authorPhotoURL)
                        return avatarUrl ? (
                          <img src={avatarUrl} alt={post?.authorName} />
                        ) : (
                          <FiUser />
                        )
                      })()}
                    </div>
                    <div className="author-details">
                      <div className="author-name-with-flairs">
                        <span className="author-name">{post.authorName || 'Anonymous'}</span>
                        {postAuthorFlairs.map((flair, index) => (
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
                  {post.category && (
                    <span className="category-badge">
                      <FiTag />
                      {post.category}
                    </span>
                  )}
                  {/* Edit/Delete buttons - show if user is author or admin */}
                  {(currentUser && (post.authorId === currentUser.uid || isAdmin)) && !post.isDeletedByUser && (
                    <div className="post-actions-menu">
                      {!isEditing && (
                        <>
                          <button
                            onClick={handleEditPost}
                            className="btn-icon"
                            title="Edit post"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={handleDeletePost}
                            className="btn-icon btn-danger"
                            title="Delete post"
                            disabled={isDeleting}
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {/* Request permanent deletion button - only for post author when deleted */}
                  {post.isDeletedByUser && currentUser && post.authorId === currentUser.uid && (
                    <div className="post-actions-menu">
                      <button
                        onClick={handleRequestPermanentDeletion}
                        className="btn btn-danger btn-small"
                        title="Request permanent deletion from admin"
                        disabled={requestingDeletion}
                      >
                        <FiTrash2 />
                        {requestingDeletion ? 'Requesting...' : 'Request Permanent Deletion'}
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="post-title">{post.title}</h1>

                {isEditing ? (
                  <div className="edit-post-form">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="edit-content-input"
                      rows={10}
                      placeholder="Edit your post content..."
                    />
                    <div className="edit-actions">
                      <button
                        onClick={handleSaveEdit}
                        className="btn btn-primary btn-small"
                        disabled={!editContent.trim()}
                      >
                        <FiCheck />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn btn-secondary btn-small"
                      >
                        <FiX />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="post-content">
                    {post.isDeletedByUser ? (
                      <div className="deleted-post-message">
                        <p>This post was deleted by the user.</p>
                      </div>
                    ) : (
                      contentParts.map((part, index) => {
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
                      })
                    )}
                  </div>
                )}

                {/* Edited label - show for regular users, show with admin name for admins, hide for super admin */}
                {post.editedAt && !post.isMainAdminEdit && (
                  <div className="edited-label">
                    {post.isAdminEdit && post.editedByAdminName ? (
                      <span>Edited (Admin {post.editedByAdminName})</span>
                    ) : (
                      <span>Edited</span>
                    )}
                  </div>
                )}

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
                    disabled={post?.votingDisabled || post?.isDeletedByUser}
                    title={post?.votingDisabled || post?.isDeletedByUser ? 'Voting is disabled' : 'Upvote'}
                  >
                    <FiThumbsUp />
                    <span>{post.upvotes || 0}</span>
                  </button>
                  <button 
                    className={`vote-btn ${userVote === 'down' ? 'active' : ''}`}
                    onClick={() => handleVote('down')}
                    disabled={post?.votingDisabled || post?.isDeletedByUser}
                    title={post?.votingDisabled || post?.isDeletedByUser ? 'Voting is disabled' : 'Downvote'}
                  >
                    <FiThumbsDown />
                    <span>{post.downvotes || 0}</span>
                  </button>
                  <div className="reply-count">
                    <FiMessageSquare />
                    <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                    {(post?.repliesDisabled || post?.isDeletedByUser) && (
                      <span className="disabled-badge">(Disabled)</span>
                    )}
                  </div>
                </div>
              </article>

              {/* Replies Section */}
              <div className="replies-section">
                <h2>
                  <FiMessageSquare />
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h2>

                {currentUser && !post?.repliesDisabled && !post?.isDeletedByUser && (
                  <form className="reply-form" onSubmit={handleSubmitReply}>
                    <div className="reply-input-wrapper">
                      <div className="author-avatar small">
                        {(() => {
                          const avatarUrl = getAvatarUrlOrDefault(userProfile?.avatar || currentUser.photoURL)
                          return avatarUrl ? (
                            <img src={avatarUrl} alt={currentUser.displayName} />
                          ) : (
                            <FiUser />
                          )
                        })()}
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

                {!currentUser && !post?.repliesDisabled && !post?.isDeletedByUser && (
                  <div className="login-prompt-box">
                    <p>
                      <Link to="/member/login">Login</Link> to reply to this post
                    </p>
                  </div>
                )}
                {(post?.repliesDisabled || post?.isDeletedByUser) && (
                  <div className="replies-disabled-message">
                    <p>Replies are disabled for this post.</p>
                  </div>
                )}

                {replies.length > 0 ? (
                  <div className="replies-list">
                    {replies.map(reply => {
                      const replyParts = parseContent(reply.content)
                      const isEditingThisReply = editingReplyId === reply.id
                      const canEditReply = currentUser && (reply.authorId === currentUser.uid || isAdmin)
                      return (
                        <div key={reply.id} className="reply-card">
                          <div className="reply-header">
                            <div className="author-avatar small">
                              {(() => {
                                const avatarUrl = getAvatarUrlOrDefault(reply.authorAvatar || reply.authorPhotoURL)
                                return avatarUrl ? (
                                  <img src={avatarUrl} alt={reply.authorName} />
                                ) : (
                                  <FiUser />
                                )
                              })()}
                            </div>
                            <div className="reply-author-info">
                              <div className="author-name-with-flairs">
                                <span className="author-name">{reply.authorName || 'Anonymous'}</span>
                                {(replyAuthorsFlairs[reply.id] || []).map((flair, index) => (
                                  <span key={index} className={`user-flair ${flair.class}`}>
                                    {flair.text}
                                  </span>
                                ))}
                              </div>
                              <div className="post-meta">
                                <FiClock />
                                <span>{formatDate(reply.createdAt)}</span>
                                {reply.editedAt && !reply.isMainAdminEdit && (
                                  <span className="edited-label">
                                    {reply.isAdminEdit && reply.editedByAdminName ? (
                                      `(edited by Admin ${reply.editedByAdminName})`
                                    ) : (
                                      '(edited)'
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Edit/Delete buttons for reply */}
                            {canEditReply && !isEditingThisReply && (
                              <div className="reply-actions">
                                <button
                                  onClick={() => handleEditReply(reply)}
                                  className="btn-icon btn-small"
                                  title="Edit reply"
                                >
                                  <FiEdit2 />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="reply-content">
                            {isEditingThisReply ? (
                              <div className="edit-reply-form">
                                <textarea
                                  value={editReplyContent}
                                  onChange={(e) => setEditReplyContent(e.target.value)}
                                  rows={4}
                                  className="edit-reply-textarea"
                                />
                                <div className="edit-reply-actions">
                                  <button
                                    onClick={handleCancelEditReply}
                                    className="btn-icon btn-secondary"
                                  >
                                    <FiX />
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditReply(reply.id)}
                                    className="btn-icon btn-primary"
                                    disabled={!editReplyContent.trim()}
                                  >
                                    <FiCheck />
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              replyParts.map((part, index) => {
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
                              })
                            )}
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

          </div>
        </div>
      </section>
    </div>
  )
}

export default ForumPost

