import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { 
  FiMessageSquare, 
  FiTrash2, 
  FiEye, 
  FiEyeOff,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiClock
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import './AdminForum.css'

const AdminForum = () => {
  const [posts, setPosts] = useState([])
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, posts, replies
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalReplies: 0,
    pinnedPosts: 0
  })

  useEffect(() => {
    fetchForumData()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [posts, replies])

  const fetchForumData = async () => {
    setLoading(true)
    try {
      // Fetch posts
      const postsQuery = query(
        collection(db, 'forumPosts'),
        orderBy('createdAt', 'desc')
      )
      const postsSnapshot = await getDocs(postsQuery)
      const postsData = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      // Fetch replies
      const repliesQuery = query(
        collection(db, 'forumReplies'),
        orderBy('createdAt', 'desc')
      )
      const repliesSnapshot = await getDocs(repliesQuery)
      const repliesData = repliesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      setPosts(postsData)
      setReplies(repliesData)
    } catch (error) {
      console.error('Error fetching forum data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    setStats({
      totalPosts: posts.length,
      totalReplies: replies.length,
      pinnedPosts: posts.filter(p => p.isPinned).length
    })
  }

  const handleTogglePin = async (postId, currentPinStatus) => {
    try {
      await updateDoc(doc(db, 'forumPosts', postId), {
        isPinned: !currentPinStatus
      })
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, isPinned: !currentPinStatus } : post
      ))
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This will also delete all replies.')) return

    try {
      // Delete the post
      await deleteDoc(doc(db, 'forumPosts', postId))
      
      // Delete associated replies
      const postReplies = replies.filter(r => r.postId === postId)
      for (const reply of postReplies) {
        await deleteDoc(doc(db, 'forumReplies', reply.id))
      }

      setPosts(prev => prev.filter(p => p.id !== postId))
      setReplies(prev => prev.filter(r => r.postId !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleDeleteReply = async (replyId, postId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return

    try {
      await deleteDoc(doc(db, 'forumReplies', replyId))
      
      // Update reply count in post
      const post = posts.find(p => p.id === postId)
      if (post) {
        await updateDoc(doc(db, 'forumPosts', postId), {
          replyCount: Math.max(0, (post.replyCount || 1) - 1)
        })
      }

      setReplies(prev => prev.filter(r => r.id !== replyId))
    } catch (error) {
      console.error('Error deleting reply:', error)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return date.toLocaleDateString()
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredReplies = replies.filter(reply => {
    const matchesSearch = searchTerm === '' || 
      reply.content?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="admin-forum-page">
      {/* Header */}
      <div className="admin-header">
        <h1>Forum Management</h1>
        <p>Moderate forum posts, replies, and manage community discussions</p>
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
                        <div className="item-header">
                          <div className="item-info">
                            <Link to={`/forum/${post.id}`} className="item-title">
                              {post.title}
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
                              className={`action-btn ${post.isPinned ? 'active' : ''}`}
                              onClick={() => handleTogglePin(post.id, post.isPinned)}
                              title={post.isPinned ? 'Unpin' : 'Pin'}
                            >
                              {post.isPinned ? <FiEyeOff /> : <FiEye />}
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeletePost(post.id)}
                              title="Delete"
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
  )
}

export default AdminForum




