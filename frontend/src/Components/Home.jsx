import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'
import './main.css'
import './search.css'
import whyKannariImg from './why-kannari.jpg'

const Home = () => {
  useEffect(() => {
    document.title = 'KANNARI MUSIC ACADEMY - Structured Online Music Education for the Modern Musician.'
    window.scrollTo(0, 0)
  }, [])

  const [backToTop, setBackToTop] = useState(false)

  const handleScroll = () => {
    if (window.scrollY > 400) {
      setBackToTop(true)
    } else {
      setBackToTop(false)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const GOLD = '#c9a84c'
  const DARK = '#0a0a0f'
  const CHAR = '#111318'
  const INDIGO = '#141830'
  const IVORY = '#faf5ec'

  const methodSteps = [
    {
      num: '01',
      title: 'Foundations',
      body: 'Build solid technique, music theory, and ear training from day one.'
    },
    {
      num: '02',
      title: 'Development',
      body: 'Deepen expression, style, and musical vocabulary with structured progression.'
    },
    {
      num: '03',
      title: 'Performance',
      body: 'Rehearse, record, and perform — sharing your sound with confidence.'
    }
  ]

  const programs = [
    { icon: '🎵', label: 'Beginner Foundations', level: 'Beginner', accent: '#c9a84c', desc: 'Your first notes, first rhythms, first wins.' },
    { icon: '🎸', label: 'Instrument-Specific Courses', level: 'All Levels', accent: '#3d7ac7', desc: 'Guitar, piano, vocals, percussion and more.' },
    { icon: '🎼', label: 'Intermediate Development', level: 'Intermediate', accent: '#8a5cf5', desc: 'Theory, improvisation, advanced technique.' },
    { icon: '🎤', label: 'Live Sessions & Feedback', level: 'All Levels', accent: '#c96e3d', desc: 'Real-time coaching with Kannari instructors.' },
    { icon: '🏆', label: 'Advanced Performance Training', level: 'Advanced', accent: '#2ea87e', desc: 'Stage presence, recording, professional mindset.' },
    { icon: '👥', label: 'Youth & Adult Tracks', level: 'All Ages', accent: '#c9a84c', desc: 'Tailored pacing for every age group.' }
  ]

  const whyBullets = [
    { icon: '♩', title: 'Structured Curriculum', body: 'Clear paths. Measurable milestones. No guesswork.' },
    { icon: '♥', title: 'Heart-Centered Teaching', body: 'Music from the soul — not just theory on a page.' },
    { icon: '🌍', title: 'Cultural Depth', body: 'Rooted in heritage. Designed for the global musician.' },
    { icon: '★', title: 'Artistic Development', body: 'Technique + creativity + performance confidence.' }
  ]

  const journeySteps = [
    { step: 'Beginner', desc: 'Notes, rhythm, posture' },
    { step: 'Intermediate', desc: 'Theory, style, expression' },
    { step: 'Advanced', desc: 'Repertoire, improvisation' },
    { step: 'Performer', desc: 'Stage, studio, confidence' }
  ]

  const quote = {
    text: 'Kannari did not just teach me music. It taught me how to listen, feel, and share — and that changed everything.',
    author: 'Kannari Student, Advanced Track'
  }

  const teacherBullets = [
    'Design your own curriculum & schedule',
    'Access a built-in student management platform',
    'Send audio lessons, assignments & feedback',
    'Track student progress with analytics'
  ]

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          1. HERO — image background with overlay + CTAs
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: DARK
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(6, 5, 12, 0.72)',
            zIndex: 1
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '-5%',
            bottom: '8%',
            fontSize: '260px',
            color: `rgba(201, 168, 76, 0.06)`,
            zIndex: 0,
            pointerEvents: 'none',
            lineHeight: '280px'
          }}
        >
          𝄞
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            color: 'white',
            padding: '50px 20px',
            maxWidth: '780px',
            margin: '0 auto'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '3px',
              backgroundColor: GOLD,
              borderRadius: '2px',
              margin: '0 auto 16px'
            }}
          />

          <p
            style={{
              color: GOLD,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '4px',
              textAlign: 'center',
              marginBottom: '16px',
              textTransform: 'uppercase'
            }}
          >
            Kannari Music Academy
          </p>

          <h1
            style={{
              color: '#f7f0e0',
              fontSize: 'clamp(32px, 7vw, 44px)',
              lineHeight: '1.3',
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: '18px',
              letterSpacing: '-1px'
            }}
          >
            Music Poured with Purpose.
          </h1>

          <div style={{ marginBottom: '18px' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  height: '1.5px',
                  backgroundColor: `rgba(201, 168, 76, 0.3)`,
                  borderRadius: '1px',
                  marginBottom: '6px'
                }}
              />
            ))}
          </div>

          <p
            style={{
              color: '#cec5b4',
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              lineHeight: '1.6',
              textAlign: 'center',
              marginBottom: '36px',
              maxWidth: '620px',
              margin: '0 auto 36px'
            }}
          >
            Structured online music education for every stage of your journey. Inspired by the Haitian <em>kanari</em> — a vessel that keeps water fresh — we pour
            discipline, technique, and artistic identity into every student.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Link
              to="/student/register"
              style={{
                display: 'inline-block',
                minWidth: '280px',
                minHeight: '56px',
                borderRadius: '12px',
                backgroundColor: GOLD,
                color: DARK,
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '15px',
                letterSpacing: '0.4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 14px rgba(201, 168, 76, 0.4)`,
                transition: 'all 0.3s ease'
              }}
            >
              Start Learning Today
            </Link>

            <Link
              to="/all-courses"
              style={{
                display: 'inline-block',
                minWidth: '280px',
                minHeight: '56px',
                borderRadius: '12px',
                backgroundColor: `rgba(201, 168, 76, 0.08)`,
                color: '#f0d078',
                border: `1.5px solid rgba(201, 168, 76, 0.5)`,
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. PROOF BAR — gold strip with 4 stats
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: GOLD,
          padding: '26px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '780px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '28px',
            textAlign: 'center'
          }}
        >
          {[
            { v: '500+', l: 'Students Enrolled' },
            { v: '20+', l: 'Courses Available' },
            { v: '100%', l: 'Online & On-Demand' },
            { v: '∞', l: 'Lifetime Access' }
          ].map((item, i) => (
            <div key={i}>
              <div
                style={{
                  color: DARK,
                  fontSize: '26px',
                  fontWeight: '900',
                  lineHeight: '32px',
                  marginBottom: '2px'
                }}
              >
                {item.v}
              </div>
              <div
                style={{
                  color: '#4a3800',
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  textAlign: 'center'
                }}
              >
                {item.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. THE KANNARI METHOD — 3 steps on dark background
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: DARK,
          padding: '80px 20px',
          color: 'white'
        }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '3.5px',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}
          >
            The Kannari Method
          </p>

          <h2
            style={{
              color: '#f5efe0',
              fontSize: 'clamp(22px, 5vw, 26px)',
              lineHeight: '1.3',
              fontWeight: '800',
              marginBottom: '32px'
            }}
          >
            How We Teach
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {methodSteps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  position: 'relative'
                }}
              >
                {i < methodSteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '23px',
                      top: '48px',
                      width: '2px',
                      height: '40px',
                      backgroundColor: `rgba(201, 168, 76, 0.3)`,
                      zIndex: 0
                    }}
                  />
                )}

                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '24px',
                    border: `2px solid ${GOLD}`,
                    backgroundColor: `rgba(201, 168, 76, 0.1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '18px',
                    flexShrink: 0,
                    color: GOLD,
                    fontSize: '14px',
                    fontWeight: '800'
                  }}
                >
                  {step.num}
                </div>

                <div style={{ flex: 1, paddingTop: '6px' }}>
                  <h3
                    style={{
                      color: '#f5efe0',
                      fontSize: '17px',
                      fontWeight: '700',
                      marginBottom: '6px',
                      margin: 0
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      color: '#9a9099',
                      fontSize: '13px',
                      lineHeight: '1.7',
                      margin: '6px 0 0 0'
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. OUR PROGRAMS — white bg, 6-card grid with accent colors
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: '#ffffff',
          padding: '80px 20px'
        }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              color: '#8a6a10',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '3.5px',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}
          >
            Our Programs
          </p>

          <h2
            style={{
              color: CHAR,
              fontSize: 'clamp(22px, 5vw, 26px)',
              lineHeight: '1.3',
              fontWeight: '800',
              marginBottom: '8px'
            }}
          >
            Find Your Track
          </h2>

          <p
            style={{
              color: '#6a6d7a',
              fontSize: '13px',
              lineHeight: '1.7',
              marginBottom: '28px'
            }}
          >
            Six structured tracks — one for every level, instrument, and goal.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
              marginBottom: '28px'
            }}
          >
            {programs.map((p) => (
              <div
                key={p.label}
                style={{
                  backgroundColor: '#f7f7fb',
                  borderRadius: '16px',
                  padding: '20px',
                  borderTop: `4px solid ${p.accent}`,
                  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ fontSize: '28px', lineHeight: '36px', marginBottom: '10px' }}>
                  {p.icon}
                </div>

                <div
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: '20px',
                    border: `1px solid ${p.accent}55`,
                    backgroundColor: `${p.accent}22`,
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    marginBottom: '10px',
                    display: 'inline-block'
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      color: p.accent
                    }}
                  >
                    {p.level}
                  </span>
                </div>

                <h3
                  style={{
                    color: CHAR,
                    fontSize: '15px',
                    fontWeight: '700',
                    lineHeight: '1.5',
                    marginBottom: '6px',
                    margin: '0 0 6px 0'
                  }}
                >
                  {p.label}
                </h3>

                <p
                  style={{
                    color: '#767980',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    margin: 0
                  }}
                >
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/all-courses"
              style={{
                marginTop: '28px',
                alignSelf: 'center',
                minHeight: '56px',
                borderRadius: '12px',
                backgroundColor: CHAR,
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px'
              }}
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          5. WHY KANNARI — ivory bg, image left + bullets right
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: IVORY,
          padding: '80px 20px'
        }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              color: '#8a6a10',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '3.5px',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}
          >
            Why Kannari
          </p>

          <h2
            style={{
              color: CHAR,
              fontSize: 'clamp(22px, 5vw, 26px)',
              lineHeight: '1.3',
              fontWeight: '800',
              marginBottom: '28px'
            }}
          >
            What Makes Us Different
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '28px',
              alignItems: 'center'
            }}
          >
            <img
              src={whyKannariImg}
              alt="Why Kannari"
              style={{
                width: '100%',
                height: '360px',
                borderRadius: '18px',
                objectFit: 'cover',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {whyBullets.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `rgba(201, 168, 76, 0.15)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      flexShrink: 0,
                      fontSize: '20px',
                      lineHeight: '24px'
                    }}
                  >
                    {b.icon}
                  </div>

                  <div style={{ flex: 1, paddingTop: '2px' }}>
                    <h3
                      style={{
                        color: CHAR,
                        fontSize: '15px',
                        fontWeight: '700',
                        marginBottom: '4px',
                        margin: 0
                      }}
                    >
                      {b.title}
                    </h3>
                    <p
                      style={{
                        color: '#6a6d7a',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        margin: '4px 0 0 0'
                      }}
                    >
                      {b.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          6. STUDENT JOURNEY — charcoal bg, horizontal track
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: CHAR,
          padding: '80px 20px',
          color: 'white'
        }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '3.5px',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}
          >
            Your Path
          </p>

          <h2
            style={{
              color: '#f5efe0',
              fontSize: 'clamp(22px, 5vw, 26px)',
              lineHeight: '1.3',
              fontWeight: '800',
              marginBottom: '32px'
            }}
          >
            The Student Journey
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}
          >
            {journeySteps.map((j, i) => (
              <div
                key={i}
                style={{
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {i < journeySteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '60%',
                      right: '-40%',
                      height: '2px',
                      backgroundColor: `rgba(201, 168, 76, 0.25)`
                    }}
                  />
                )}

                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: GOLD,
                    marginBottom: '10px',
                    margin: '0 auto 10px'
                  }}
                />

                <p
                  style={{
                    color: '#f0e8d8',
                    fontSize: '12px',
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '4px',
                    margin: 0
                  }}
                >
                  {j.step}
                </p>

                <p
                  style={{
                    color: '#8a8490',
                    fontSize: '11px',
                    textAlign: 'center',
                    lineHeight: '1.5',
                    margin: '4px 0 0 0'
                  }}
                >
                  {j.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/student/register"
              style={{
                display: 'inline-block',
                minWidth: '280px',
                minHeight: '56px',
                borderRadius: '12px',
                backgroundColor: GOLD,
                color: DARK,
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '15px',
                letterSpacing: '0.4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          7. VOICES — near-black, single large testimonial quote
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: '#07070d',
          padding: '80px 20px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: '100px',
              lineHeight: '80px',
              fontWeight: '800',
              marginBottom: '8px',
              margin: 0
            }}
          >
            "
          </p>

          <p
            style={{
              color: '#ede5d8',
              fontSize: 'clamp(17px, 4vw, 20px)',
              lineHeight: '1.7',
              fontStyle: 'italic',
              textAlign: 'center',
              marginBottom: '24px'
            }}
          >
            {quote.text}
          </p>

          <div
            style={{
              width: '48px',
              height: '2px',
              backgroundColor: GOLD,
              borderRadius: '1px',
              marginBottom: '14px'
            }}
          />

          <p
            style={{
              color: '#7a7480',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px',
              textAlign: 'center',
              margin: 0
            }}
          >
            {quote.author}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          8. TEACH WITH US — deep indigo bg, educator benefits
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: INDIGO,
          padding: '80px 20px',
          color: 'white'
        }}
      >
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto'
          }}
        >
          <p
            style={{
              color: GOLD,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '3.5px',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}
          >
            For Educators
          </p>

          <h2
            style={{
              color: '#f5efe0',
              fontSize: 'clamp(22px, 5vw, 26px)',
              lineHeight: '1.3',
              fontWeight: '800',
              marginBottom: '24px'
            }}
          >
            Teach With Kannari
          </h2>

          <p
            style={{
              color: '#9a96a8',
              fontSize: '13px',
              lineHeight: '1.7',
              marginBottom: '24px'
            }}
          >
            Share your gift. Build your roster. Grow your impact — with tools designed for modern online music teaching.
          </p>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '22px',
              marginBottom: '28px',
              border: `1px solid rgba(201, 168, 76, 0.15)`,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {teacherBullets.map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '14px',
                    backgroundColor: `rgba(201, 168, 76, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '14px',
                    flexShrink: 0,
                    color: GOLD,
                    fontSize: '14px',
                    fontWeight: '800'
                  }}
                >
                  ✓
                </div>

                <span
                  style={{
                    color: '#d6d0c8',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    flex: 1
                  }}
                >
                  {b}
                </span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/teacher/register"
              style={{
                display: 'inline-block',
                minWidth: '280px',
                minHeight: '56px',
                borderRadius: '12px',
                backgroundColor: GOLD,
                color: DARK,
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '15px',
                letterSpacing: '0.4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Register as a Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          9. FINAL CTA — gold background
      ════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: GOLD,
          padding: '80px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '-2%',
            bottom: '5%',
            fontSize: '180px',
            lineHeight: '200px',
            color: 'rgba(0, 0, 0, 0.08)',
            pointerEvents: 'none'
          }}
        >
          ♩
        </div>

        <div
          style={{
            position: 'absolute',
            right: '-4%',
            top: '10%',
            fontSize: '140px',
            lineHeight: '160px',
            color: 'rgba(0, 0, 0, 0.07)',
            pointerEvents: 'none'
          }}
        >
          ♫
        </div>

        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}
        >
          <h2
            style={{
              color: DARK,
              fontSize: 'clamp(26px, 6vw, 34px)',
              lineHeight: '1.3',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '14px'
            }}
          >
            Your Musical Journey Starts Today.
          </h2>

          <p
            style={{
              color: '#3e2c00',
              fontSize: '14px',
              lineHeight: '1.7',
              textAlign: 'center',
              marginBottom: '32px'
            }}
          >
            Join hundreds of students learning online with purpose, structure, and heart.
          </p>

          <Link
            to="/student/register"
            style={{
              display: 'inline-block',
              minWidth: '300px',
              minHeight: '58px',
              borderRadius: '14px',
              backgroundColor: DARK,
              color: GOLD,
              textDecoration: 'none',
              fontWeight: '800',
              fontSize: '15px',
              letterSpacing: '0.3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(0, 0, 0, 0.4)',
              textAlign: 'center'
            }}
          >
            Enroll Now — It's Free to Start
          </Link>
        </div>
      </section>

      {/* Back-to-top FAB */}
      {backToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            right: '18px',
            bottom: '24px',
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            backgroundColor: GOLD,
            border: 'none',
            color: DARK,
            fontSize: '22px',
            lineHeight: '24px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: `0 6px 12px rgba(201, 168, 76, 0.45)`,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ↑
        </button>
      )}
    </>
  )
}

export default Home
