import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import LoadingSpinner from '../LoadingSpinner'
import './teacherDashboard.css'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaUrl = API_BASE_URL.replace('/api', ''); // Extract base domain from API URL

const TeacherOverview = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  
  const teacherId = localStorage.getItem('teacherId')

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${baseUrl}/teacher/overview/${teacherId}/`)
      setData(response.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    document.title = 'Kannari Music Academy | Teacher Dashboard'
    window.scrollTo(0, 0)
    fetchDashboardData()
  }, [fetchDashboardData])

  const getActivityIcon = (type) => {
    const icons = {
      check: 'bi-check-lg',
      document: 'bi-file-text',
      play: 'bi-play-fill',
      comment: 'bi-chat-dots',
      download: 'bi-download',
      calendar: 'bi-calendar-check',
      trophy: 'bi-trophy-fill',
      'person-plus': 'bi-person-plus-fill',
      default: 'bi-circle'
    }
    return icons[type] || icons.default
  }

  const getActivityColor = (type) => {
    const colors = {
      check: { bg: '#dcfce7', color: '#16a34a' },
      play: { bg: '#dbeafe', color: '#3b82f6' },
      comment: { bg: '#fef3c7', color: '#d97706' },
      document: { bg: '#f3e8ff', color: '#9333ea' },
      download: { bg: '#e0f2fe', color: '#0284c7' },
      calendar: { bg: '#fce7f3', color: '#db2777' },
      trophy: { bg: '#fef9c3', color: '#ca8a04' },
      'person-plus': { bg: '#dbeafe', color: '#2563eb' },
    }
    return colors[type] || { bg: '#f1f5f9', color: '#64748b' }
  }

  const getActivityVerb = (type) => {
    const verbs = {
      lesson_completed: 'completed lesson',
      assignment_submitted: 'submitted assignment for',
      course_started: 'started course',
      comment_added: 'commented on',
      material_downloaded: 'downloaded material from',
      session_attended: 'attended session',
      course_completed: 'completed course',
      enrolled: 'enrolled in',
    }
    return verbs[type] || type
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className='d-flex flex-column align-items-center justify-content-center' style={{ minHeight: 400 }}>
        <i className="bi bi-exclamation-triangle display-3 text-warning mb-3"></i>
        <h4>{error}</h4>
        <button className='btn-primary-custom mt-3' onClick={fetchDashboardData}>
          <i className="bi bi-arrow-clockwise me-2"></i>Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      {/* Header */}
      <div style={{
        marginBottom: '48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>Dashboard Overview</h1>
          <p style={{
            fontSize: '15px',
            color: '#4b5563',
            margin: 0,
            fontWeight: 400
          }}>Welcome back, {data.teacher_name}. Here's your teaching summary.</p>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={fetchDashboardData}
            style={{
              padding: '12px 20px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.target.style.background = '#f8f9ff';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'white';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
          <Link to='/teacher/students' style={{
            padding: '12px 20px',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f8f9ff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <i className="bi bi-people"></i>
            View Students
          </Link>
          <Link to='/teacher/course-management' style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            <i className="bi bi-journal-richtext"></i>
            Manage Courses
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {/* Total Students */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '28px',
            color: '#667eea'
          }}>
            <i className="bi bi-people-fill"></i>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Total Students</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>{data.total_students}</div>
          {data.new_students_this_month > 0 && (
            <div style={{
              fontSize: '13px',
              color: '#10b981',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="bi bi-arrow-up"></i>
              {data.new_students_this_month} new this month
            </div>
          )}
        </div>

        {/* Total Courses */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '28px',
            color: '#667eea'
          }}>
            <i className="bi bi-journal-richtext"></i>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>My Courses</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>{data.total_courses}</div>
          <div style={{ fontSize: '13px', color: '#4b5563', fontWeight: 400 }}>
            {data.total_chapters} chapter{data.total_chapters !== 1 ? 's' : ''} · {data.total_lessons} lesson{data.total_lessons !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Enrollments */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '28px',
            color: '#667eea'
          }}>
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Enrollments</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>{data.total_enrollments}</div>
          {data.new_enrollments_this_week > 0 ? (
            <div style={{
              fontSize: '13px',
              color: '#10b981',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="bi bi-arrow-up"></i>
              {data.new_enrollments_this_week} this week
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#4b5563', fontWeight: 400 }}>
              {data.active_enrollments} active
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '28px',
            color: '#667eea'
          }}>
            <i className="bi bi-trophy-fill"></i>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Completion Rate</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            {data.total_enrollments > 0 ? `${data.completion_rate}%` : '—'}
          </div>
          <div style={{ fontSize: '13px', color: '#4b5563', fontWeight: 400 }}>
            {data.completed_courses} of {data.total_enrollments} completed
          </div>
        </div>
      </div>

      {/* My Courses Section */}
      {data.courses && data.courses.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginBottom: '48px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>My Courses</h2>
            <Link to='/teacher/course-management' style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#667eea',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#764ba2';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#667eea';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              Manage All
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {data.courses.map(course => (
              <div key={course.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.15)';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  height: '6px',
                  background: course.total_enrolled > 0 
                    ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' 
                    : '#e5e7eb'
                }}></div>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    {course.featured_img ? (
                      <img src={`${mediaUrl}${course.featured_img}`} alt=""
                        style={{
                          width: '56px',
                          height: '42px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid #e5e7eb'
                        }} />
                    ) : (
                      <div style={{
                        width: '56px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#f5f7fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: '#6b7280',
                        fontSize: '18px'
                      }}>
                        <i className="bi bi-journal"></i>
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h6 style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        margin: '0 0 8px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {course.title}
                      </h6>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '13px',
                        color: '#6b7280',
                        fontWeight: 400
                      }}>
                        <span><i className="bi bi-people me-1" style={{ marginRight: '4px' }}></i>{course.total_enrolled} enrolled</span>
                        <span><i className="bi bi-collection me-1" style={{ marginRight: '4px' }}></i>{course.chapter_count} ch · {course.lesson_count} lessons</span>
                      </div>
                    </div>
                  </div>
                  {course.total_enrolled > 0 && (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 500,
                        marginBottom: '8px'
                      }}>
                        <span>Avg student progress</span>
                        <span>{course.avg_progress}%</span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${course.avg_progress}%`,
                          height: '100%',
                          background: course.avg_progress >= 70 
                            ? '#10b981' 
                            : course.avg_progress >= 40 
                              ? '#f59e0b' 
                              : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Row: Activities + Sessions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '32px',
        marginBottom: '48px'
      }}>
        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: 'clamp(20px, 3vw, 24px)',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 28px 0',
            letterSpacing: '-0.5px'
          }}>Recent Activity</h2>
          {data.recent_activities && data.recent_activities.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.recent_activities.map((activity, idx) => {
                const ac = getActivityColor(activity.icon_type)
                return (
                  <li key={activity.id} style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px 0',
                    borderBottom: idx < data.recent_activities.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      minWidth: 0,
                      flexShrink: 0,
                      borderRadius: '12px',
                      background: ac.bg,
                      color: ac.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      <i className={`bi ${getActivityIcon(activity.icon_type)}`}></i>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        margin: '0 0 4px 0',
                        lineHeight: '1.5'
                      }}>
                        <strong>{activity.student_name}</strong> {getActivityVerb(activity.activity_type)}{' '}
                        {activity.target_id ? (
                          <Link to={`/detail/${activity.target_id}`} style={{
                            color: '#667eea',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                          }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = '#764ba2';
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = '#667eea';
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {activity.target_name}
                          </Link>
                        ) : (
                          <span style={{ color: '#667eea', fontWeight: 600 }}>{activity.target_name}</span>
                        )}
                      </p>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 400
                      }}>{activity.time_ago}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '40px',
              paddingBottom: '40px'
            }}>
              <i className="bi bi-clock-history" style={{
                fontSize: '48px',
                color: '#cbd5e1',
                marginBottom: '16px'
              }}></i>
              <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '15px', fontWeight: 500 }}>
                No recent activity yet
              </p>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '13px',
                fontWeight: 400,
                textAlign: 'center'
              }}>
                Activity will appear here when students interact with your courses.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Sessions + Enrollments */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          {/* Upcoming Sessions */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 3vw, 24px)',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 28px 0',
              letterSpacing: '-0.5px'
            }}>Upcoming Sessions</h2>
            {data.upcoming_sessions && data.upcoming_sessions.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.upcoming_sessions.map((session, idx) => (
                  <li key={session.id} style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px 0',
                    borderBottom: idx < data.upcoming_sessions.length - 1 ? '1px solid #e5e7eb' : 'none',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      minWidth: '56px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#667eea',
                      textAlign: 'center'
                    }}>{session.scheduled_time}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        marginBottom: '4px'
                      }}>{session.student_name}</div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{session.title}</div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: session.status === 'scheduled' 
                        ? '#e3f2fd' 
                        : session.status === 'completed'
                          ? '#d4edda'
                          : '#f8d7da',
                      color: session.status === 'scheduled' 
                        ? '#1976d2' 
                        : session.status === 'completed'
                          ? '#10b981'
                          : '#ef4444',
                      whiteSpace: 'nowrap'
                    }}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '40px',
                paddingBottom: '40px'
              }}>
                <i className="bi bi-calendar2-x" style={{
                  fontSize: '48px',
                  color: '#cbd5e1',
                  marginBottom: '12px'
                }}></i>
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 400,
                  textAlign: 'center'
                }}>No upcoming sessions</p>
              </div>
            )}
          </div>

          {/* Recent Enrollments */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 3vw, 24px)',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 28px 0',
              letterSpacing: '-0.5px'
            }}>Recent Enrollments</h2>
            {data.recent_enrollments && data.recent_enrollments.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.recent_enrollments.map((enroll, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 0',
                    borderBottom: idx < data.recent_enrollments.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    {enroll.student_profile_img ? (
                      <img src={`${mediaUrl}${enroll.student_profile_img}`} alt=""
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '2px solid #e5e7eb'
                        }} />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        {(enroll.student_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        marginBottom: '4px'
                      }}>{enroll.student_name}</div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        enrolled in <strong style={{ color: '#1a1a1a' }}>{enroll.course_title}</strong>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      minWidth: '52px',
                      flexShrink: 0
                    }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: enroll.progress_percent >= 70 
                          ? '#10b981' 
                          : enroll.progress_percent >= 30 
                            ? '#f59e0b' 
                            : '#667eea'
                      }}>
                        {enroll.progress_percent}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '40px',
                paddingBottom: '40px'
              }}>
                <i className="bi bi-person-plus" style={{
                  fontSize: '48px',
                  color: '#cbd5e1',
                  marginBottom: '12px'
                }}></i>
                <p style={{
                  color: '#6b7280',
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 400,
                  textAlign: 'center'
                }}>No enrollments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State — show when teacher has no courses at all */}
      {data.total_courses === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px 32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '56px',
            color: '#667eea',
            marginBottom: '24px'
          }}>
            <i className="bi bi-rocket-takeoff"></i>
          </div>
          <h4 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px'
          }}>Get Started!</h4>
          <p style={{
            color: '#4b5563',
            margin: '0 0 32px 0',
            textAlign: 'center',
            maxWidth: '400px',
            fontSize: '15px',
            lineHeight: '1.6'
          }}>
            Create your first course and start sharing your musical knowledge with students.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link to='/teacher/course-management' style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              <i className="bi bi-plus-lg"></i>Create a Course
            </Link>
            <Link to='/teacher/students' style={{
              padding: '12px 28px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f8f9ff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <i className="bi bi-people"></i>Add Students
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

export default TeacherOverview
