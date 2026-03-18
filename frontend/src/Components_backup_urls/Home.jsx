import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import wave from './darkside.mp4'
import ab from './about.jpg'
import './Header.css'
import './main.css'
import './search.css'

const Home = () => {
  useEffect(() => {
    document.title = 'KANNARI MUSIC ACADEMY - Structured Online Music Education for the Modern Musician.'
    window.scrollTo(0, 0)
  }, [])

  const differentiators = [
    {
      title: 'Structured Learning',
      description: 'Clear curriculum. Real progress. No guesswork.'
    },
    {
      title: 'Heart-Centered Teaching',
      description: 'Music from the heart, not just theory.'
    },
    {
      title: 'Cultural Depth, Global Reach',
      description: 'Rooted in heritage. Designed for the modern musician.'
    },
    {
      title: 'Real Artistic Development',
      description: 'Technique, creativity, performance confidence.'
    }
  ]

  const programs = [
    'Beginner Foundations',
    'Intermediate Development',
    'Advanced Performance Training',
    'Instrument-Specific Courses',
    'Live Sessions & Feedback',
    'Youth & Adult Tracks'
  ]

  return (
    <>
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        <video
          src={wave}
          autoPlay
          muted
          loop
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%)',
            zIndex: 2
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 3,
            textAlign: 'center',
            color: 'white',
            padding: '0 20px',
            maxWidth: '980px'
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(14px, 2vw, 18px)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              opacity: '0.9',
              marginBottom: '16px'
            }}
          >
            KANNARI MUSIC ACADEMY
          </h2>

          <h1
            style={{
              fontSize: 'clamp(36px, 7vw, 72px)',
              fontWeight: '800',
              marginBottom: '20px',
              lineHeight: '1.1',
              letterSpacing: '-1px',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            Music Poured with Purpose.
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              margin: '0 auto 40px',
              opacity: '0.95',
              lineHeight: '1.7',
              maxWidth: '860px'
            }}
          >
            Structured Online Music Education for the Modern Musician. Inspired by the Haitian kanari — a vessel that preserves
            fresh water — Kannari Music Academy pours structured musical knowledge into every student, empowering them to share
            fresh sound with the world.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Link
              to="/user-register"
              style={{
                padding: '16px 32px',
                background: 'white',
                color: '#667eea',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
              }}
            >
              Start Learning Today
            </Link>

            <Link
              to="/all-courses"
              style={{
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '60px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
                height: '500px'
              }}
            >
              <img
                src={ab}
                alt="The Meaning Behind Kannari"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '20px',
                  marginBottom: '24px'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', letterSpacing: '0.5px' }}>OUR STORY</span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(28px, 5vw, 42px)',
                  fontWeight: '700',
                  marginBottom: '24px',
                  color: '#1a1a1a',
                  lineHeight: '1.2'
                }}
              >
                The Meaning Behind Kannari
              </h2>

              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.8', marginBottom: '16px' }}>
                In Haitian culture, the kanari is a traditional clay vessel used to keep water fresh and pure.
              </p>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.8', marginBottom: '16px' }}>
                At Kannari Music Academy, we believe music should be preserved with the same care.
              </p>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.8', marginBottom: '20px' }}>
                We don’t just teach notes. We pour discipline, expression, technique, confidence, and artistic identity into every
                student.
              </p>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.8', marginBottom: 0 }}>
                Once filled, they carry that music into the world — distributing inspiration, creativity, and light.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: '80px 20px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)'
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2
            style={{
              textAlign: 'center',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '12px'
            }}
          >
            What Makes Us Different
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '42px', fontSize: '16px' }}>
            Structured Online Music Education for the Modern Musician.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {differentiators.map((item) => (
              <div
                key={item.title}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px 28px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
              >
                <h3 style={{ fontSize: '21px', fontWeight: '600', marginBottom: '12px', color: '#1a1a1a' }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.7' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '700', color: '#1a1a1a', marginBottom: '20px' }}>
            Our Programs
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '30px'
            }}
          >
            {programs.map((program) => (
              <div
                key={program}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(102, 126, 234, 0.08)',
                  color: '#4b5563',
                  fontWeight: '500'
                }}
              >
                {program}
              </div>
            ))}
          </div>

          <Link
            to="/all-courses"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              borderRadius: '10px',
              textDecoration: 'none',
              color: 'white',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            View All Courses
          </Link>
        </div>
      </section>

      <section style={{ padding: '80px 20px', background: '#111827', color: '#f9fafb' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '700', marginBottom: '20px', color: '#f9fafb' }}>Our Mission</h2>
          <p style={{ fontSize: '22px', lineHeight: '1.8', marginBottom: '20px', opacity: 0.95 }}>
            Music from the heart. Music that inspires. Music that grows.
          </p>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '16px', lineHeight: '1.8' }}>
            Kannari Music Academy exists to develop musicians who are grounded in technique, rich in expression, and prepared to
            share their sound globally.
          </p>
        </div>
      </section>
    </>
  )
}

export default Home