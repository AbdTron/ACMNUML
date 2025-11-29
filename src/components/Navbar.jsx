import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiX, FiShield, FiMoon, FiSun, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useMemberAuth } from '../context/MemberAuthContext'
import { useTheme } from '../context/ThemeContext'
import acmLogo from '../assets/acmlog.png'
import './Navbar.css'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { isAdmin } = useAuth()
  const memberAuth = useMemberAuth()
  const memberUser = memberAuth?.currentUser || null
  const { theme, toggleTheme } = useTheme()
  const navbarRef = useRef(null)

  const isActive = (path) => location.pathname === path

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
    { path: '/team', label: 'Team' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/members', label: 'Members' },
    { path: '/about', label: 'About' },
    { path: '/join', label: 'Join Us' },
    { path: '/contact', label: 'Contact' },
  ]

  return (
    <nav className="navbar" ref={navbarRef}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={acmLogo} alt="ACM NUML Logo" className="logo-image" />
          <span className="logo-text">ACM</span>
          <span className="logo-subtitle">NUML</span>
        </Link>

        <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.path} className="navbar-item">
              <Link
                to={link.path}
                className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {!memberUser && (
            <li className="navbar-item">
              <Link
                to="/member/login"
                className={`navbar-link ${isActive('/member/login') ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <FiUser />
                Login
              </Link>
            </li>
          )}
          {memberUser && (
            <li className="navbar-item">
              <Link
                to="/member"
                className={`navbar-link ${isActive('/member') ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <FiUser />
                Dashboard
              </Link>
            </li>
          )}
          {isAdmin && (
            <li className="navbar-item">
              <Link
                to="/admin"
                className={`navbar-link admin-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <FiShield />
                Admin
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <button
            className="navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

