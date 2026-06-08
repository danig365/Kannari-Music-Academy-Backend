import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import LoadingSpinner from '../LoadingSpinner';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

// ── helpers ──────────────────────────────────────────────────────────────────

const monthName = (n) => {
  const names = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
  return names[(n - 1) % 12] || `Month ${n}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
};

// ── main component ────────────────────────────────────────────────────────────

const MyLearningPath = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const studentId = localStorage.getItem('studentId');
  const studentLoginStatus = localStorage.getItem('studentLoginStatus');

  // Auth guard
  useEffect(() => {
    if (studentLoginStatus !== 'true') navigate('/student/login');
  }, [studentLoginStatus, navigate]);

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.title = 'Kannari | My Learning Path';
  }, []);

  useEffect(() => {
    if (studentLoginStatus === 'true') fetchPathData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentLoginStatus]);

  const fetchPathData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/student/${studentId}/my-paths/`);
      setEnrollments(res.data.enrollments || []);
      setUpcomingSession(res.data.upcoming_group_session || null);
    } catch (err) {
      console.error('Error fetching learning paths:', err);
    } finally {
      setLoading(false);
    }
  };

  if (studentLoginStatus !== 'true') return null;

  // ── sub-components ──────────────────────────────────────────────────────────

  const UpcomingSessionBanner = ({ session }) => {
    if (!session) return null;
    const daysUntil = Math.ceil(
      (new Date(session.scheduled_date) - new Date().setHours(0,0,0,0)) / 86400000
    );
    const urgency = daysUntil <= 1 ? '#dc2626' : daysUntil <= 3 ? '#d97706' : '#2563eb';
    const urgencyBg = daysUntil <= 1 ? 'rgba(220,38,38,0.08)' : daysUntil <= 3 ? 'rgba(217,119,6,0.08)' : 'rgba(37,99,235,0.08)';
    const label = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;

    return (
      <div style={{
        backgroundColor: urgencyBg,
        border: `1px solid ${urgency}30`,
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          backgroundColor: urgency, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <i className="bi bi-camera-video-fill" style={{ color: 'white', fontSize: '18px' }}></i>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{session.title}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {session.group_class_name} &bull; {formatDate(session.scheduled_date)} at {formatTime(session.scheduled_time)}
            &bull; {session.duration_minutes} min
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{
            padding: '4px 10px', borderRadius: '20px',
            backgroundColor: urgency, color: 'white',
            fontSize: '11px', fontWeight: '700',
          }}>{label}</span>
          {session.meeting_link && (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 14px', borderRadius: '8px',
                backgroundColor: urgency, color: 'white',
                fontSize: '13px', fontWeight: '600',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              <i className="bi bi-box-arrow-up-right" style={{ fontSize: '12px' }}></i>
              Join
            </a>
          )}
        </div>
      </div>
    );
  };

  const CourseCard = ({ lpc, status, nextLesson }) => {
    // status: 'completed' | 'current' | 'upcoming'
    const colors = {
      completed: { bg: '#f0fdf4', border: '#22c55e', icon: '#16a34a', text: '#15803d' },
      current:   { bg: '#eff6ff', border: '#3b82f6', icon: '#2563eb', text: '#1d4ed8' },
      upcoming:  { bg: '#f8fafc', border: '#e2e8f0', icon: '#94a3b8', text: '#94a3b8' },
    };
    const c = colors[status];

    return (
      <div style={{
        backgroundColor: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '12px',
        opacity: status === 'upcoming' ? 0.65 : 1,
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          {/* Month badge */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            backgroundColor: status === 'upcoming' ? '#e2e8f0' : c.border,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {status === 'completed' ? (
              <i className="bi bi-check-lg" style={{ color: 'white', fontSize: '22px' }}></i>
            ) : status === 'current' ? (
              <i className="bi bi-play-fill" style={{ color: 'white', fontSize: '20px' }}></i>
            ) : (
              <i className="bi bi-lock-fill" style={{ color: '#94a3b8', fontSize: '18px' }}></i>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: '700', color: c.text,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Month {lpc.month_number}
              </span>
              {status === 'completed' && (
                <span style={{
                  padding: '2px 8px', borderRadius: '20px',
                  backgroundColor: '#dcfce7', color: '#15803d',
                  fontSize: '10px', fontWeight: '700',
                }}>Complete</span>
              )}
              {status === 'current' && (
                <span style={{
                  padding: '2px 8px', borderRadius: '20px',
                  backgroundColor: '#dbeafe', color: '#1d4ed8',
                  fontSize: '10px', fontWeight: '700',
                }}>In Progress</span>
              )}
            </div>

            <div style={{
              fontWeight: '600', fontSize: '15px', color: status === 'upcoming' ? '#94a3b8' : '#1e293b',
              marginTop: '4px', marginBottom: '4px',
            }}>
              {lpc.display_title || lpc.course_title}
            </div>

            {lpc.course_description && status !== 'upcoming' && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', lineHeight: '1.5' }}>
                {lpc.course_description.length > 100
                  ? lpc.course_description.substring(0, 100) + '…'
                  : lpc.course_description}
              </div>
            )}

            {/* "Continue" for current course */}
            {status === 'current' && (
              <div style={{ marginTop: '8px' }}>
                {nextLesson ? (
                  <Link
                    to={`/student/learn/${nextLesson.course_id}/lesson/${nextLesson.lesson_id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 16px', borderRadius: '8px',
                      backgroundColor: '#2563eb', color: 'white',
                      fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                    }}
                  >
                    <i className="bi bi-play-fill" style={{ fontSize: '12px' }}></i>
                    Continue: {nextLesson.lesson_title}
                  </Link>
                ) : (
                  <Link
                    to={`/student/learn/${lpc.course}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 16px', borderRadius: '8px',
                      backgroundColor: '#2563eb', color: 'white',
                      fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                    }}
                  >
                    <i className="bi bi-book" style={{ fontSize: '12px' }}></i>
                    Go to Course
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PathCard = ({ enrollment }) => {
    const { path, current_course_index, progress_percent, next_lesson, is_completed } = enrollment;
    const courses = path?.courses || [];
    const totalMonths = path?.duration_months || courses.length;

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Path header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                {path.title}
              </h3>
              {path.subtitle && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{path.subtitle}</p>
              )}
            </div>
            {is_completed ? (
              <span style={{
                padding: '6px 14px', borderRadius: '20px',
                backgroundColor: '#dcfce7', color: '#15803d',
                fontSize: '12px', fontWeight: '700',
              }}>
                <i className="bi bi-check-circle-fill me-1"></i>Completed!
              </span>
            ) : (
              <span style={{
                padding: '6px 14px', borderRadius: '20px',
                backgroundColor: '#dbeafe', color: '#1d4ed8',
                fontSize: '12px', fontWeight: '700',
              }}>
                Month {(current_course_index || 0) + 1} of {totalMonths}
              </span>
            )}
          </div>

          {/* Overall progress bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Overall Progress</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>{progress_percent || 0}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress_percent || 0}%`,
                backgroundColor: is_completed ? '#22c55e' : '#3b82f6',
                borderRadius: '8px',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Course roadmap */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
            Your Roadmap
          </div>

          {courses.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No courses added to this path yet.</p>
          ) : (
            courses.map((lpc, idx) => {
              let status = 'upcoming';
              if (is_completed || idx < current_course_index) status = 'completed';
              else if (idx === current_course_index) status = 'current';

              return (
                <CourseCard
                  key={lpc.id}
                  lpc={lpc}
                  status={status}
                  nextLesson={status === 'current' ? next_lesson : null}
                />
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />

      {isMobile && sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '250px',
        padding: isMobile ? '0' : '0',
        minWidth: 0,
      }}>
        {/* Mobile header */}
        {isMobile && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 100,
            backgroundColor: 'white', borderBottom: '1px solid #e2e8f0',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#1e293b' }}
            >
              <i className="bi bi-list"></i>
            </button>
            <span style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>My Learning Path</span>
          </div>
        )}

        <div style={{ padding: isMobile ? '16px' : '32px 32px 48px', maxWidth: '860px' }}>
          {/* Page header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: '#3b82f6', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-map-fill" style={{ color: 'white', fontSize: '18px' }}></i>
              </span>
              My Learning Path
            </h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
              Your guided music journey — month by month.
            </p>
          </div>

          {/* Upcoming group session banner */}
          <UpcomingSessionBanner session={upcomingSession} />

          {/* Content */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <LoadingSpinner size="lg" text="Loading your learning path…" />
            </div>
          ) : enrollments.length === 0 ? (
            <div style={{
              backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
              padding: '60px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: '#eff6ff', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-map" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
              </div>
              <h4 style={{ color: '#1e293b', fontWeight: '700', marginBottom: '8px' }}>No Learning Path Yet</h4>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', maxWidth: '340px', margin: '0 auto 24px' }}>
                You haven't been enrolled in a structured learning path yet.
                Ask your teacher or check back soon.
              </p>
              <Link
                to="/student/my-courses"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '8px',
                  backgroundColor: '#3b82f6', color: 'white',
                  fontSize: '14px', fontWeight: '600', textDecoration: 'none',
                }}
              >
                <i className="bi bi-book" style={{ fontSize: '14px' }}></i>
                Browse My Courses
              </Link>
            </div>
          ) : (
            enrollments.map((enrollment) => (
              <PathCard key={enrollment.id} enrollment={enrollment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLearningPath;
