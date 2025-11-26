import { FiMail, FiGithub, FiLinkedin } from 'react-icons/fi'
import abdullahImage from '../assets/Abdullah.jpg'
import './DeveloperProfile.css'

const DeveloperProfile = () => {
  return (
    <div className="developer-profile-page">
      <section className="section profile-section">
        <div className="container profile-wrap">
          <div className="profile-card">
            <div className="profile-avatar">
              <img 
                src={abdullahImage}
                alt="Abdullah Irshad"
              />
            </div>
            <h1 className="profile-name">ATRONS (Abdullah Irshad)</h1>
            <p className="profile-role">Lead Developer</p>
            <p className="profile-bio">
              Full‑stack engineer with a focus on backend systems, APIs, and deployment pipelines.
              Drives the technical roadmap for ACM NUML, ensuring scalability, security, and a smooth user experience.
            </p>
            <div className="profile-actions">
              <a 
                className="btn btn-blue" 
                href="mailto:abdullah.tron@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiMail />
                Mail
              </a>
              <a 
                className="btn btn-blue" 
                href="https://github.com/AbdTron" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FiGithub />
                GitHub
              </a>
              <a 
                className="btn btn-blue" 
                href="https://www.linkedin.com/in/atrons/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FiLinkedin />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DeveloperProfile

