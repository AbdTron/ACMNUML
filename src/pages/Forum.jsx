import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where,
  limit as firestoreLimit
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useMemberAuth } from '../context/MemberAuthContext'
import { 
  FiPlus, 
  FiSearch, 
  FiFilter,
  FiMessageSquare,
  FiTrendingUp,
  FiClock,
  FiTag
} from 'react-icons/fi'
import ForumPostCard from '../components/ForumPostCard'
import './Forum.css'

const CATEGORIES = [
  { id: 'all', name: 'All Posts', icon: FiMessageSquare },
  { id: 'General', name: 'General', icon: FiMessageSquare },
  { id: 'Technical', name: 'Technical', icon: FiTag },
  { id: 'Events', name: 'Events', icon: FiClock },
  { id: 'Projects', name: 'Projects', icon: FiTrendingUp },
  { id: 'Help', name: 'Help', icon: FiMessageSquare },
  { id: 'Announcements', name: 'Announcements', icon: FiTrendingUp }
]

const Forum = () => {
  const { currentUser } = useMemberAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('recent') // recent, popular, trending
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalReplies: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, sortBy])

  useEffect(() => {
    calculateStats()
  }, [posts])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let postsQuery = collection(db, 'forumPosts')
      
      // Filter by category
      if (selectedCategory !== 'all') {
        postsQuery = query(postsQuery, where('category', '==', selectedCategory))
      }

      // Sort
      if (sortBy === 'recent') {
        postsQuery = query(postsQuery, orderBy('createdAt', 'desc'))
      } else if (sortBy === 'popular') {
        postsQuery = query(postsQuery, orderBy('upvotes', 'desc'))
      }

      postsQuery = query(postsQuery, firestoreLimit(50))

      const snapshot = await getDocs(postsQuery)
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setPosts(postsData)
    } catch (error) {
      console.error('Error fetching forum posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalReplies = posts.reduce((sum, post) => sum + (post.replyCount || 0), 0)
    const uniqueAuthors = new Set(posts.map(post => post.authorId)).size

    setStats({
      totalPosts: posts.length,
      totalReplies,
      activeUsers: uniqueAuthors
    })
  }

  const filteredPosts = posts.filter(post => {
    if (searchTerm === '') return true
    const searchLower = searchTerm.toLowerCase()
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.content?.toLowerCase().includes(searchLower) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  // Separate pinned and regular posts
  const pinnedPosts = filteredPosts.filter(post => post.isPinned)
  const regularPosts = filteredPosts.filter(post => !post.isPinned)

  return (
    <div className="forum-page">
      {/* Hero Section */}
      <section className="forum-hero">
        <div className="container">
          <h1>Community Forum</h1>
          <p className="hero-description">
            Connect with fellow members, share knowledge, ask questions, and collaborate on projects
          </p>
          {currentUser && (
            <Link to="/forum/new" className="btn-primary btn-create-post">
              <FiPlus />
              Create New Post
            </Link>
          )}
          {!currentUser && (
            <p className="login-prompt">
              <Link to="/member/login">Login</Link> to create posts and participate in discussions
            </p>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="forum-stats-section">
        <div className="container">
          <div className="forum-stats-grid">
            <div className="forum-stat-card">
              <FiMessageSquare />
              <div className="stat-info">
                <span className="stat-value">{stats.totalPosts}</span>
                <span className="stat-label">Posts</span>
              </div>
            </div>
            <div className="forum-stat-card">
              <FiTrendingUp />
              <div className="stat-info">
                <span className="stat-value">{stats.totalReplies}</span>
                <span className="stat-label">Replies</span>
              </div>
            </div>
            <div className="forum-stat-card">
              <FiClock />
              <div className="stat-info">
                <span className="stat-value">{stats.activeUsers}</span>
                <span className="stat-label">Active Users</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Forum Content */}
      <section className="section forum-content-section">
        <div className="container">
          <div className="forum-layout">
            {/* Sidebar */}
            <aside className="forum-sidebar">
              <div className="sidebar-section">
                <h3>Categories</h3>
                <div className="category-list">
                  {CATEGORIES.map(category => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <Icon />
                        <span>{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Sort By</h3>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              {/* Forum Guidelines */}
              <div className="sidebar-section forum-guidelines">
                <h3>Forum Guidelines</h3>
                <ul>
                  <li>Be respectful and constructive</li>
                  <li>Stay on topic</li>
                  <li>No spam or self-promotion</li>
                  <li>Search before posting</li>
                  <li>Use proper formatting</li>
                </ul>
              </div>
            </aside>

            {/* Posts Area */}
            <div className="forum-posts-area">
              {/* Search Bar */}
              <div className="forum-search-bar">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search posts, topics, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Posts List */}
              <div className="posts-container">
                {loading ? (
                  <div className="loading-state">
                    <p>Loading posts...</p>
                  </div>
                ) : (
                  <>
                    {pinnedPosts.length > 0 && (
                      <div className="pinned-posts-section">
                        <h3>
                          <FiTrendingUp />
                          Pinned Posts
                        </h3>
                        {pinnedPosts.map(post => (
                          <ForumPostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}

                    {regularPosts.length > 0 ? (
                      <div className="regular-posts-section">
                        {pinnedPosts.length > 0 && <h3>Recent Posts</h3>}
                        {regularPosts.map(post => (
                          <ForumPostCard key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <FiMessageSquare />
                        <h3>No posts found</h3>
                        <p>
                          {searchTerm 
                            ? 'Try adjusting your search terms' 
                            : 'Be the first to start a discussion!'}
                        </p>
                        {currentUser && (
                          <Link to="/forum/new" className="btn-primary">
                            <FiPlus />
                            Create First Post
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Forum

