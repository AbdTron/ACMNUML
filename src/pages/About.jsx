import { FiTarget, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi'
import './About.css'

const About = () => {
  const values = [
    {
      icon: FiTarget,
      title: 'Our Mission',
      description: 'To foster innovation, collaboration, and excellence in computer science education and practice.',
    },
    {
      icon: FiUsers,
      title: 'Community',
      description: 'Building a strong network of students, alumni, and industry professionals.',
    },
    {
      icon: FiAward,
      title: 'Excellence',
      description: 'Striving for excellence in all our activities, events, and initiatives.',
    },
    {
      icon: FiTrendingUp,
      title: 'Growth',
      description: 'Empowering members to grow their skills and advance their careers.',
    },
  ]

  const activities = [
    'Technical Workshops',
    'Hackathons & Coding Competitions',
    'Industry Visits',
    'Tech Talks & Seminars',
    'Networking Events',
    'Project Collaborations',
    'Career Development Sessions',
    'Community Service Projects',
  ]

  return (
    <div className="about-page">
      <div className="page-header">
        <div className="container">
          <h1>About ACM NUML</h1>
          <p>Empowering the next generation of computer scientists</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="about-intro">
            <h2>Who We Are</h2>
            <p>
              ACM NUML is the official student chapter of the Association for Computing
              Machinery at the National University of Modern Languages. We are a vibrant
              community of computer science students passionate about technology,
              innovation, and making a positive impact.
            </p>
            <p>
              Our society serves as a platform for students to enhance their technical
              skills, network with industry professionals, and participate in various
              tech-related activities. We organize workshops, hackathons, industrial visits,
              tech talks, and many other events throughout the academic year.
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
              ACM NUML organizes a wide range of activities to help students grow
              professionally and personally:
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
            <h2>Join Our Community</h2>
            <p>
              Whether you're a beginner or an experienced developer, there's a place
              for you in ACM NUML. Join us to be part of an amazing community that's
              shaping the future of technology.
            </p>
            <a href="/join" className="btn btn-primary btn-large">
              Become a Member
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About

