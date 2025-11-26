import { FiTarget, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi'
import './About.css'

const About = () => {
  const values = [
    {
      icon: FiTarget,
      title: 'Our Mission',
      description: 'To create opportunities, foster innovation, and build a vibrant CS community at NUML.',
    },
    {
      icon: FiUsers,
      title: 'Collaboration',
      description: 'Connecting students, alumni, and industry to work together on impactful initiatives.',
    },
    {
      icon: FiAward,
      title: 'Impact',
      description: 'Delivering meaningful events, projects, and experiences that leave a lasting mark.',
    },
    {
      icon: FiTrendingUp,
      title: 'Growth',
      description: 'Empowering members to develop leadership, technical, and professional skills.',
    },
  ]

  const activities = [
    'Organizing Hackathons & Coding Competitions',
    'Technical Workshops & Skill Sessions',
    'Industry Visits & Guest Talks',
    'Project Collaboration & Team Challenges',
    'Networking Events & Alumni Mentorship',
    'Career Development Sessions',
    'Community & Social Initiatives',
  ]

  return (
    <div className="about-page">
      <div className="page-header">
        <div className="container">
          <h1>About ACM NUML</h1>
          <p>Connecting CS students through events, innovation, and collaboration.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="about-intro">
            <h2>Who We Are</h2>
            <p>
              ACM NUML is the official student chapter of National University of Modern Languages. We are a dynamic
              community of CS students passionate about technology, innovation, and making a tangible impact.
            </p>
            <p>
              Our society provides a platform for students to enhance their skills, network
              with peers and industry mentors, and actively participate in workshops,
              hackathons, and other high-impact events throughout the academic year.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-title">
            <h2>Our Values</h2>
            <p>What drives us forward</p>
          </div>
          <div className="values-grid">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="value-card">
                  <div className="value-icon">
                    <Icon />
                  </div>
                  <h3 className="value-title">{value.title}</h3>
                  <p className="value-description">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="activities-section">
            <h2>What We Do</h2>
            <p className="activities-intro">
              ACM NUML organizes impactful activities to help students grow, collaborate,
              and contribute to the CS community:
            </p>
            <div className="activities-grid">
              {activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-bullet">•</span>
                  <span>{activity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="join-cta">
            <h2>Join Our Team</h2>
            <p>
              ACM NUML is looking for dedicated students to help run our society. Take
              ownership of events, collaborate with peers, and make a real impact on the
              CS community at NUML.
            </p>
            <a href="/join" className="btn btn-primary btn-large">
              Apply to Join the Core Team
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
