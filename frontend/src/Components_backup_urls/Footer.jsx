import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      <footer className="footer-modern">
        <div className="footer-top">
          <div className="footer-container">
            <div className="footer-grid">
              <div className="footer-column footer-brand">
                <div className="brand-logo">
                  <svg className="brand-icon" width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18V5l12-2v13" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="url(#gradient)" strokeWidth="2"/>
                    <circle cx="18" cy="16" r="3" stroke="url(#gradient)" strokeWidth="2"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#667eea"/>
                        <stop offset="100%" stopColor="#764ba2"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <h3>KANNARI MUSIC ACADEMY</h3>
                </div>
                <p className="brand-description">
                  Structured Online Music Education for the Modern Musician.
                </p>
                <p className="footer-tagline">
                  Inspired by the Haitian kanari — a vessel that preserves fresh water — we pour structured musical knowledge into
                  every student.
                </p>
                <p className="footer-mission">
                  Music from the heart. Music that inspires. Music that grows.
                </p>
              </div>

              <div className="footer-column">
                <h4 className="footer-heading">What We Pour</h4>
                <ul className="footer-bullet-list">
                  <li>Discipline</li>
                  <li>Expression</li>
                  <li>Technique</li>
                  <li>Confidence</li>
                  <li>Artistic identity</li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-heading">Our Programs</h4>
                <ul className="footer-bullet-list">
                  <li>Beginner Foundations</li>
                  <li>Intermediate Development</li>
                  <li>Advanced Performance Training</li>
                  <li>Instrument-Specific Courses</li>
                  <li>Live Sessions &amp; Feedback</li>
                  <li>Youth &amp; Adult Tracks</li>
                </ul>
                <Link to="/all-courses" className="footer-cta-link">View All Courses</Link>
              </div>

              <div className="footer-column">
                <h4 className="footer-heading">Quick Links</h4>
                <ul className="footer-links">
                  <li><Link to="/" className="footer-link">Home</Link></li>
                  <li><Link to="/aboutus" className="footer-link">Our Story</Link></li>
                  <li><Link to="/all-courses" className="footer-link">Explore Courses</Link></li>
                  <li><Link to="/faq" className="footer-link">FAQs &amp; Help</Link></li>
                  <li><Link to="/policy" className="footer-link">Privacy &amp; Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-container">
            <div className="footer-bottom-content">
              <div className="copyright">
                <p>&copy; 2026 <Link to="/">KANNARI MUSIC ACADEMY</Link>. All Rights Reserved.</p>
              </div>
              <div className="footer-menu">
                <Link to="/" className="footer-menu-link">Start Learning Today</Link>
                <Link to="/all-courses" className="footer-menu-link">Explore Courses</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={scrollToTop}
        className="back-to-top"
        aria-label="Back to top"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </button>
    </>
  )
}

export default Footer