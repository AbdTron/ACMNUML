import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  where,
  limit
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { 
  FiArrowLeft,
  FiMessageSquare,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiSearch,
  FiClock,
  FiUser,
  FiTag,
  FiRefreshCw,
  FiTrendingUp,
  FiEdit2,
  FiCheck,
  FiX,
  FiMapPin
} from 'react-icons/fi'
import './AdminForum.css'

const AdminForum = () => {
  const [posts, setPosts] = useState([])
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, posts, replies (for main filter)
  const [postFilter, setPostFilter] = useState('all') // all, pinned, unpinned (for posts only)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalReplies: 0,
    pinnedPosts: 0
  })
  const [processing, setProcessing] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    fetchPosts()
    fetchReplies()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [posts, replies])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const postsQuery = query(
        collection(db, 'forumPosts'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const snapshot = await getDocs(postsQuery)
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      setPosts(postsData)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReplies = async () => {
    try {
      const repliesQuery = query(
        collection(db, 'forumReplies'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
      const snapshot = await getDocs(repliesQuery)
      const repliesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      setReplies(repliesData)
    } catch (error) {
      console.error('Error fetching replies:', error)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post.id)
    setEditTitle(post.title)
    setEditContent(post.content)
  }

  const handleCancelEdit = () => {
    setEditingPost(null)
    setEditTitle('')
    setEditContent('')
  }

  const handleSaveEdit = async (postId) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content are required')
      return
    }

    setProcessing(postId)
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        title: editTitle.trim(),
        content: editContent.trim(),
        editedAt: new Date().toISOString(),
        isAdminEdit: true, // Mark as admin edit so no "Edited" label shows
        updatedAt: new Date().toISOString()
      })
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? { 
          ...p, 
          title: editTitle.trim(), 
          content: editContent.trim(),
          editedAt: new Date(),
          isAdminEdit: true
        } : p
      ))
      
      setEditingPost(null)
      setEditTitle('')
      setEditContent('')
      alert('Post updated successfully')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post')
    } finally {
      setProcessing(null)
    }
  }

  const handlePinToggle = async (postId, currentPinStatus) => {
    setProcessing(postId)
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        isPinned: !currentPinStatus,
        updatedAt: new Date().toISOString()
      })
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, isPinned: !currentPinStatus } : p
      ))
    } catch (error) {
      console.error('Error toggling pin:', error)
      alert('Failed to update post')
    } finally {
      setProcessing(null)
    }
  }

  const handleToggleVisibility = async (postId, currentVisibility) => {
    setProcessing(postId)
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        isHidden: !currentVisibility,
        updatedAt: new Date().toISOString()
      })
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, isHidden: !currentVisibility } : p
      ))
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Failed to update post')
    } finally {
      setProcessing(null)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This will also delete all replies. This action cannot be undone.')) {
      return
    }

    setProcessing(postId)
    try {
      // Delete all replies for this post
      const postReplies = replies.filter(r => r.postId === postId)
      for (const reply of postReplies) {
        await deleteDoc(doc(db, 'forumReplies', reply.id))
      }

      // Delete the post
      await deleteDoc(doc(db, 'forumPosts', postId))
      
      setPosts(prev => prev.filter(p => p.id !== postId))
      setReplies(prev => prev.filter(r => r.postId !== postId))
      alert('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setProcessing(null)
    }
  }

  const handleDeleteReply = async (replyId, postId) => {
    if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return
    }

    setProcessing(replyId)
    try {
      await deleteDoc(doc(db, 'forumReplies', replyId))
      
      // Update reply count in post
      const post = posts.find(p => p.id === postId)
      if (post) {
        await updateDoc(doc(db, 'forumPosts', postId), {
          replyCount: (post.replyCount || 0) - 1
        })
      }

      setReplies(prev => prev.filter(r => r.id !== replyId))
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, replyCount: (p.replyCount || 0) - 1 } : p
      ))
      alert('Reply deleted successfully')
    } catch (error) {
      console.error('Error deleting reply:', error)
      alert('Failed to delete reply')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateStats = () => {
    setStats({
      totalPosts: posts.length,
      totalReplies: replies.length,
      pinnedPosts: posts.filter(p => p.isPinned).length
    })
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

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (postFilter === 'pinned' && !post.isPinned) return false
    if (postFilter === 'unpinned' && post.isPinned) return false
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false
    if (searchTerm && !post.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !post.content.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Filter replies
  const filteredReplies = replies.filter(reply => {
    if (searchTerm && !reply.content.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const categories = ['General', 'Technical', 'Events', 'Projects', 'Help', 'Announcements']

  return (
    <div className="admin-forum">
      <div className="container">
        <Link to="/admin" className="back-link">
          <FiArrowLeft /> Back to Admin Dashboard
        </Link>

        <div className="page-header">
          <div className="header-content">
            <h1>Forum Management</h1>
            <p>Moderate forum posts, replies, and manage community discussions</p>
          </div>
          <button onClick={() => { fetchPosts(); fetchReplies() }} className="btn btn-secondary" disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon posts">
              <FiMessageSquare />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Posts</span>
              <span className="stat-value">{stats.totalPosts}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon replies">
              <FiTrendingUp />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Replies</span>
              <span className="stat-value">{stats.totalReplies}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pinned">
              <FiClock />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pinned Posts</span>
              <span className="stat-value">{stats.pinnedPosts}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search posts and replies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <FiFilter />
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'posts' ? 'active' : ''}`}
              onClick={() => setFilter('posts')}
            >
              <FiMessageSquare />
              Posts Only
            </button>
            <button 
              className={`filter-btn ${filter === 'replies' ? 'active' : ''}`}
              onClick={() => setFilter('replies')}
            >
              <FiTrendingUp />
              Replies Only
            </button>
          </div>
          {filter === 'all' || filter === 'posts' ? (
            <>
              <div className="filter-group">
                <FiFilter />
                <button
                  className={`filter-btn ${postFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPostFilter('all')}
                >
                  All Posts
                </button>
                <button
                  className={`filter-btn ${postFilter === 'pinned' ? 'active' : ''}`}
                  onClick={() => setPostFilter('pinned')}
                >
                  Pinned
                </button>
                <button
                  className={`filter-btn ${postFilter === 'unpinned' ? 'active' : ''}`}
                  onClick={() => setPostFilter('unpinned')}
                >
                  Unpinned
                </button>
              </div>
              <div className="filter-group">
                <FiTag />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="category-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>

        {/* Content */}
        <div className="forum-content">
          {loading ? (
            <div className="loading-state">Loading forum data...</div>
          ) : (
            <>
              {/* Posts Section */}
              {(filter === 'all' || filter === 'posts') && (
                <div className="section-card">
                  <h2>
                    <FiMessageSquare />
                    Forum Posts ({filteredPosts.length})
                  </h2>
                  <div className="items-list">
                    {filteredPosts.length === 0 ? (
                      <div className="empty-state">
                        <p>No posts found</p>
                      </div>
                    ) : (
                      filteredPosts.map(post => (
                        <div key={post.id} className="forum-item post-item">
                          {editingPost === post.id ? (
                            <div className="edit-post-form">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="edit-title-input"
                                placeholder="Post title..."
                              />
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="edit-content-input"
                                rows={8}
                                placeholder="Post content..."
                              />
                              <div className="edit-actions">
                                <button
                                  onClick={() => handleSaveEdit(post.id)}
                                  className="btn btn-primary btn-small"
                                  disabled={processing === post.id || !editTitle.trim() || !editContent.trim()}
                                >
                                  <FiCheck />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="btn btn-secondary btn-small"
                                  disabled={processing === post.id}
                                >
                                  <FiX />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="item-header">
                                <div className="item-info">
                                  <Link to={`/forum/${post.id}`} className="item-title">
                                    {post.title}
                                    {post.isHidden && <span className="hidden-badge">Hidden</span>}
                                  </Link>
                                  <div className="item-meta">
                                    <span>By {post.authorName || 'Anonymous'}</span>
                                    <span>•</span>
                                    <span>{formatDate(post.createdAt)}</span>
                                    <span>•</span>
                                    <span>{post.category}</span>
                                    {post.isPinned && (
                                      <>
                                        <span>•</span>
                                        <span className="pinned-tag">Pinned</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="item-actions">
                                  <button 
                                    className="action-btn"
                                    onClick={() => handleEditPost(post)}
                                    title="Edit post"
                                    disabled={processing === post.id}
                                  >
                                    <FiEdit2 />
                                  </button>
                                  <button 
                                    className={`action-btn ${post.isPinned ? 'active' : ''}`}
                                    onClick={() => handlePinToggle(post.id, post.isPinned)}
                                    title={post.isPinned ? 'Unpin' : 'Pin'}
                                    disabled={processing === post.id}
                                  >
                                    <FiMapPin />
                                  </button>
                                  <button 
                                    className={`action-btn ${post.isHidden ? 'active' : ''}`}
                                    onClick={() => handleToggleVisibility(post.id, post.isHidden)}
                                    title={post.isHidden ? 'Show' : 'Hide'}
                                    disabled={processing === post.id}
                                  >
                                    {post.isHidden ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                  <button 
                                    className="action-btn delete-btn"
                                    onClick={() => handleDeletePost(post.id)}
                                    title="Delete"
                                    disabled={processing === post.id}
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </div>
                              <p className="item-preview">{post.content}</p>
                              <div className="item-stats">
                                <span>{post.upvotes || 0} upvotes</span>
                                <span>•</span>
                                <span>{post.replyCount || 0} replies</span>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Replies Section */}
              {(filter === 'all' || filter === 'replies') && (
                <div className="section-card">
                  <h2>
                    <FiTrendingUp />
                    Forum Replies ({filteredReplies.length})
                  </h2>
                  <div className="items-list">
                    {filteredReplies.length === 0 ? (
                      <div className="empty-state">
                        <p>No replies found</p>
                      </div>
                    ) : (
                      filteredReplies.map(reply => (
                        <div key={reply.id} className="forum-item reply-item">
                          <div className="item-header">
                            <div className="item-info">
                              <div className="item-meta">
                                <span>By {reply.authorName || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{formatDate(reply.createdAt)}</span>
                                {reply.postId && (
                                  <>
                                    <span>•</span>
                                    <Link to={`/forum/${reply.postId}`} className="post-link">
                                      View Post
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="item-actions">
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteReply(reply.id, reply.postId)}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                          <p className="item-preview">{reply.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminForum
