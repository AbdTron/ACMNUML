import { Link } from 'react-router-dom'
import { FiMail, FiGithub, FiLinkedin, FiTwitter, FiFacebook, FiInstagram } from 'react-icons/fi'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: FiMail, href: 'mailto:acm.numl@atrons.net', label: 'Email' },

 
 
    { icon: FiInstagram, href: 'https://www.instagram.com/acm.numllhr/', label: 'Instagram' },
  ]

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">ACM NUML</h3>
            <p className="footer-description">
            ACM NUML — Building community, creating opportunities, and shaping the future of CS at NUML.
            </p>
            <div className="footer-social">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link"
                    aria-label={social.label}
                  >
                    <Icon />
                  </a>
                )
              })}
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/team">Team</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/join">Join Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              <li>
                <FiMail />
                <a href="mailto:acm.numl@atrons.net">acm.numl@atrons.net</a>
              </li>
              <li>
                <span>National University of Modern Languages</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} ACM NUML. All rights reserved.</p>
          <p className="footer-domain">
            Developed by <Link to="/developer" className="dev-link">Abdullah Irshad</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

