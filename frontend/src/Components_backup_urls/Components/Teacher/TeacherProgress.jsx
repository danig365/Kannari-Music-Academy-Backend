import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import LoadingSpinner from '../LoadingSpinner'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherProgress = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progressData, setProgressData] = useState(null)
  
  // Interactive filters & search
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [instrumentFilter, setInstrumentFilter] = useState('all')
  const [sortField, setSortField] = useState('progress_percentage')
  const [sortDirection, setSortDirection] = useState('desc')
  const [activeTab, setActiveTab] = useState('overview') // overview | students | courses
  
  const teacherId = localStorage.getItem('teacherId')

  const fetchProgressData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${baseUrl}/teacher/progress/${teacherId}/`)
      setProgressData(response.data)
    } catch (err) {
      console.error('Error fetching progress data:', err)
      setError('Unable to load progress data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    document.title = 'Kannari Music Academy | Progress Analytics'
    window.scrollTo(0, 0)
    fetchProgressData()
  }, [fetchProgressData])

  // Filtered and sorted student list
  const filteredStudents = useMemo(() => {
    if (!progressData?.student_progress) return []
    
    let filtered = [...progressData.student_progress]
    
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.student_name.toLowerCase().includes(q) ||
        (s.instrument && s.instrument.toLowerCase().includes(q)) ||
        (s.student_email && s.student_email.toLowerCase().includes(q))
      )
    }
    
    // Filters
    if (levelFilter !== 'all') {
      filtered = filtered.filter(s => s.level === levelFilter)
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }
    if (instrumentFilter !== 'all') {
      filtered = filtered.filter(s => s.instrument === instrumentFilter)
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    })
    
    return filtered
  }, [progressData, searchQuery, levelFilter, statusFilter, instrumentFilter, sortField, sortDirection])

  // Extract unique instruments from data
  const uniqueInstruments = useMemo(() => {
    if (!progressData?.student_progress) return []
    const instruments = [...new Set(progressData.student_progress.map(s => s.instrument).filter(Boolean))]
    return instruments.sort()
  }, [progressData])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return 'bi-chevron-expand'
    return sortDirection === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#22c55e'
    if (percentage >= 60) return '#3b82f6'
    if (percentage >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getProgressClass = (percentage) => {
    if (percentage >= 80) return 'high'
    if (percentage >= 60) return 'medium'
    if (percentage >= 40) return 'low'
    return 'very-low'
  }

  const getMaxActivity = () => {
    if (!progressData?.weekly_activity) return 1
    return Math.max(...progressData.weekly_activity.map(a => a.activities), 1)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' }
      case 'warning': return { bg: '#fef3c7', color: '#d97706' }
      case 'inactive': return { bg: '#fee2e2', color: '#dc2626' }
      default: return { bg: '#f1f5f9', color: '#64748b' }
    }
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner size="lg" text="Loading progress analytics..." />
  }

  // Error state with retry
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <i className="bi bi-exclamation-triangle" style={{
          fontSize: '64px',
          color: '#f59e0b',
          marginBottom: '16px'
        }}></i>
        <h4 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#1a1a1a',
          margin: '0 0 8px 0'
        }}>Something went wrong</h4>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: '0 0 24px 0'
        }}>{error}</p>
        <button 
          onClick={fetchProgressData}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
        >
          <i className="bi bi-arrow-clockwise"></i>Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (!progressData || progressData.total_students === 0) {
    return (
      <>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>Progress Analytics</h1>
            <p style={{
              fontSize: '16px',
              color: '#4b5563',
              margin: '0',
              fontWeight: 400
            }}>Monitor student performance and track learning outcomes.</p>
          </div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '60px 40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <i className="bi bi-people" style={{
            fontSize: '64px',
            color: '#d1d5db',
            display: 'block',
            marginBottom: '16px'
          }}></i>
          <h4 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: '0 0 8px 0'
          }}>No Students Yet</h4>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 24px 0'
          }}>Once you have students assigned, their progress will appear here.</p>
          <Link to='/teacher-students' style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          >
            <i className="bi bi-person-plus"></i>Manage Students
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>Progress Analytics</h1>
          <p style={{
            fontSize: '16px',
            color: '#4b5563',
            margin: '0',
            fontWeight: 400
          }}>Monitor student performance and track learning outcomes.</p>
        </div>
        <button 
          onClick={fetchProgressData}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            color: '#4b5563',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f7fa';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <i className="bi bi-arrow-clockwise"></i>
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: activeTab === 'overview' ? '2px solid #667eea' : '2px solid #e5e7eb',
            background: activeTab === 'overview' ? '#f0f4f8' : '#fff',
            color: activeTab === 'overview' ? '#667eea' : '#6b7280',
            fontWeight: activeTab === 'overview' ? 600 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <i className="bi bi-grid-3x3-gap"></i>Overview
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: activeTab === 'students' ? '2px solid #667eea' : '2px solid #e5e7eb',
            background: activeTab === 'students' ? '#f0f4f8' : '#fff',
            color: activeTab === 'students' ? '#667eea' : '#6b7280',
            fontWeight: activeTab === 'students' ? 600 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <i className="bi bi-people"></i>Students ({progressData.total_students})
        </button>
        {progressData.course_stats && progressData.course_stats.length > 0 && (
          <button 
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: activeTab === 'courses' ? '2px solid #667eea' : '2px solid #e5e7eb',
              background: activeTab === 'courses' ? '#f0f4f8' : '#fff',
              color: activeTab === 'courses' ? '#667eea' : '#6b7280',
              fontWeight: activeTab === 'courses' ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <i className="bi bi-journal-bookmark"></i>Courses ({progressData.course_stats.length})
          </button>
        )}
      </div>

      {/* =================== OVERVIEW TAB =================== */}
      {activeTab === 'overview' && (
        <>
          {/* Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Overall Progress */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                background: 'rgba(102, 126, 234, 0.15)',
                color: '#667eea',
                flexShrink: 0
              }}>
                <i className="bi bi-graph-up"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  marginBottom: '4px',
                  fontWeight: 500
                }}>Overall Progress</div>
                <div style={{
                  fontSize: 'clamp(24px, 8vw, 32px)',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>{progressData.overall_progress}%</div>
                <div style={{
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#10b981',
                  fontWeight: 500
                }}>
                  <i className="bi bi-arrow-up"></i>
                  Class average
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                flexShrink: 0
              }}>
                <i className="bi bi-check2-circle"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  marginBottom: '4px',
                  fontWeight: 500
                }}>Completion Rate</div>
                <div style={{
                  fontSize: 'clamp(24px, 8vw, 32px)',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>{progressData.completion_rate}%</div>
                <div style={{
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: 500
                }}>
                  Lessons completed
                </div>
              </div>
            </div>

            {/* Total Students */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                background: 'rgba(249, 158, 11, 0.15)',
                color: '#f59e0b',
                flexShrink: 0
              }}>
                <i className="bi bi-people-fill"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  marginBottom: '4px',
                  fontWeight: 500
                }}>Total Students</div>
                <div style={{
                  fontSize: 'clamp(24px, 8vw, 32px)',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>{progressData.total_students}</div>
                <div style={{
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: 500
                }}>
                  {progressData.total_enrollments || 0} enrollments
                </div>
              </div>
            </div>

            {/* Active Lessons */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                flexShrink: 0
              }}>
                <i className="bi bi-collection"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  marginBottom: '4px',
                  fontWeight: 500
                }}>Active Lessons</div>
                <div style={{
                  fontSize: 'clamp(24px, 8vw, 32px)',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  lineHeight: 1,
                  marginBottom: '8px'
                }}>{progressData.total_lessons}</div>
                <div style={{
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: 500
                }}>
                  {progressData.total_completed_courses || 0} courses completed
                </div>
              </div>
            </div>
          </div>

          {/* Content Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Progress Distribution */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f5f7fa'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="bi bi-pie-chart" style={{ color: '#667eea', fontSize: '18px' }}></i>
                  Progress Distribution
                </h2>
              </div>
              <div>
                {/* Visual distribution bar */}
                <div style={{
                  display: 'flex',
                  height: '12px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '24px'
                }}>
                  {progressData.total_students > 0 && (
                    <>
                      <div style={{ width: `${(progressData.progress_distribution.excellent / progressData.total_students) * 100}%`, background: '#10b981', transition: 'width 0.3s ease' }}></div>
                      <div style={{ width: `${(progressData.progress_distribution.good / progressData.total_students) * 100}%`, background: '#667eea', transition: 'width 0.3s ease' }}></div>
                      <div style={{ width: `${(progressData.progress_distribution.average / progressData.total_students) * 100}%`, background: '#f59e0b', transition: 'width 0.3s ease' }}></div>
                      <div style={{ width: `${(progressData.progress_distribution.needs_improvement / progressData.total_students) * 100}%`, background: '#ef4444', transition: 'width 0.3s ease' }}></div>
                    </>
                  )}
                </div>

                {/* Distribution items */}
                {[
                  { label: 'Excellent (80%+)', color: '#10b981', value: progressData.progress_distribution.excellent },
                  { label: 'Good (60-79%)', color: '#667eea', value: progressData.progress_distribution.good },
                  { label: 'Average (40-59%)', color: '#f59e0b', value: progressData.progress_distribution.average },
                  { label: 'Needs Help (<40%)', color: '#ef4444', value: progressData.progress_distribution.needs_improvement }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: idx < 3 ? '1px solid #f5f7fa' : 'none'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: item.color,
                      marginRight: '12px',
                      flexShrink: 0
                    }}></div>
                    <div style={{
                      flex: 1,
                      fontSize: '14px',
                      color: '#4b5563',
                      fontWeight: 500
                    }}>{item.label}</div>
                    <strong style={{
                      fontSize: '14px',
                      color: '#1a1a1a',
                      marginRight: '8px',
                      minWidth: '30px',
                      textAlign: 'right'
                    }}>{item.value}</strong>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      minWidth: '50px',
                      textAlign: 'right'
                    }}>
                      ({progressData.total_students > 0 ? Math.round((item.value / progressData.total_students) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Activity Chart */}
            <div style={{
              gridColumn: 'span auto',
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f5f7fa'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="bi bi-bar-chart" style={{ color: '#667eea', fontSize: '18px' }}></i>
                  Weekly Activity
                </h2>
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>Last 7 days</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '160px',
                gap: '8px'
              }}>
                {progressData.weekly_activity.map((day, index) => {
                  const height = (day.activities / getMaxActivity()) * 130
                  const isToday = index === progressData.weekly_activity.length - 1
                  return (
                    <div key={index} style={{
                      flex: 1,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div 
                        title={`${day.full_date}: ${day.activities} activities${day.time_minutes ? `, ${day.time_minutes} min` : ''}`}
                        style={{
                          width: '100%',
                          maxWidth: '40px',
                          height: `${Math.max(height, 4)}px`,
                          background: isToday
                            ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(180deg, rgba(102, 126, 234, 0.5) 0%, rgba(102, 126, 234, 0.3) 100%)',
                          borderRadius: '8px 8px 0 0',
                          margin: '0 auto',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: day.activities === 0 ? 0.3 : 1
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scaleY(1)';
                        }}
                      ></div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '8px',
                        fontWeight: isToday ? 600 : 400
                      }}>
                        {day.date}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: day.activities > 0 ? '#1a1a1a' : '#94a3b8'
                      }}>
                        {day.activities}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className='row g-4 mb-4'>
            {/* Top Performing Students */}
            <div className='col-md-6'>
              <div className='content-card h-100'>
                <div className='content-card-header'>
                  <h2 className='content-card-title'>
                    <i className="bi bi-trophy text-warning me-2"></i>
                    Top Performing Students
                  </h2>
                  <button 
                    className='view-all-link' 
                    onClick={() => { setActiveTab('students'); setSortField('progress_percentage'); setSortDirection('desc'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13 }}
                  >
                    View All
                  </button>
                </div>
                {progressData.top_students.length > 0 ? (
                  <ul className='list-unstyled mt-3'>
                    {progressData.top_students.map((student, index) => (
                      <li key={student.id} className='d-flex align-items-center mb-3 pb-3 border-bottom'>
                        <div
                          className='d-flex align-items-center justify-content-center me-3'
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: index === 0 ? '#fef3c7' : index === 1 ? '#f1f5f9' : '#fed7aa',
                            color: index === 0 ? '#f59e0b' : index === 1 ? '#64748b' : '#ea580c',
                            fontWeight: 600,
                            fontSize: 13
                          }}
                        >
                          {index + 1}
                        </div>
                        {student.student_profile_img ? (
                          <img
                            src={`${baseUrl}${student.student_profile_img}`}
                            alt={student.student_name}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 12 }}
                          />
                        ) : (
                          <div
                            className='d-flex align-items-center justify-content-center me-3'
                            style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 14 }}
                          >
                            {student.student_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className='flex-grow-1'>
                          <div className='fw-medium'>{student.student_name}</div>
                          <div className='text-muted small'>
                            {student.instrument ? student.instrument.charAt(0).toUpperCase() + student.instrument.slice(1) : ''} 
                            {student.level ? ` · ${student.level.charAt(0).toUpperCase() + student.level.slice(1)}` : ''}
                          </div>
                        </div>
                        <div className='d-flex align-items-center'>
                          <div className='progress-bar-container me-2' style={{ width: 60 }}>
                            <div
                              className={`progress-bar-fill ${getProgressClass(student.progress_percentage)}`}
                              style={{ width: `${student.progress_percentage}%` }}
                            ></div>
                          </div>
                          <span className='fw-medium' style={{ color: getProgressColor(student.progress_percentage), minWidth: 40, textAlign: 'right' }}>
                            {student.progress_percentage}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='text-center py-4'>
                    <p className='text-muted'>No student data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Students Needing Attention */}
            <div className='col-md-6'>
              <div className='content-card h-100'>
                <div className='content-card-header'>
                  <h2 className='content-card-title'>
                    <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                    Students Needing Attention
                  </h2>
                  <button 
                    className='view-all-link'
                    onClick={() => { setActiveTab('students'); setStatusFilter('warning'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13 }}
                  >
                    View All
                  </button>
                </div>
                {progressData.attention_needed.length > 0 ? (
                  <ul className='list-unstyled mt-3'>
                    {progressData.attention_needed.map((student) => {
                      const statusColor = getStatusColor(student.status)
                      return (
                        <li key={student.id} className='d-flex align-items-center mb-3 pb-3 border-bottom'>
                          <div
                            className='d-flex align-items-center justify-content-center me-3'
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: statusColor.bg,
                              color: statusColor.color
                            }}
                          >
                            <i className={`bi ${student.status === 'warning' ? 'bi-exclamation-circle' : 'bi-x-circle'}`}></i>
                          </div>
                          <div className='flex-grow-1'>
                            <div className='fw-medium'>{student.student_name}</div>
                            <div className='text-muted small'>
                              Last active: {formatDate(student.last_active)}
                              {student.instrument ? ` · ${student.instrument.charAt(0).toUpperCase() + student.instrument.slice(1)}` : ''}
                            </div>
                          </div>
                          <div className='text-end'>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                background: statusColor.bg,
                                color: statusColor.color
                              }}
                            >
                              {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Unknown'}
                            </span>
                            <div className='small mt-1' style={{ color: getProgressColor(student.progress_percentage) }}>
                              {student.progress_percentage}% progress
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className='text-center py-4'>
                    <i className="bi bi-check-circle display-4 text-success"></i>
                    <p className='text-muted mt-2'>All students are on track!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =================== STUDENTS TAB =================== */}
      {activeTab === 'students' && (
        <>
          {/* Search & Filters */}
          <div className='content-card mb-4'>
            <div className='d-flex flex-wrap gap-3 align-items-center'>
              {/* Search */}
              <div className='flex-grow-1' style={{ minWidth: 200 }}>
                <div className='position-relative'>
                  <i className="bi bi-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                  <input
                    type='text'
                    placeholder='Search by name, email, or instrument...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  color: levelFilter === 'all' ? '#94a3b8' : '#1e293b'
                }}
              >
                <option value='all'>All Levels</option>
                <option value='beginner'>Beginner</option>
                <option value='intermediate'>Intermediate</option>
                <option value='advanced'>Advanced</option>
              </select>

              {/* Instrument Filter */}
              <select
                value={instrumentFilter}
                onChange={(e) => setInstrumentFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  color: instrumentFilter === 'all' ? '#94a3b8' : '#1e293b'
                }}
              >
                <option value='all'>All Instruments</option>
                {uniqueInstruments.map(inst => (
                  <option key={inst} value={inst}>{inst.charAt(0).toUpperCase() + inst.slice(1)}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  color: statusFilter === 'all' ? '#94a3b8' : '#1e293b'
                }}
              >
                <option value='all'>All Statuses</option>
                <option value='active'>Active</option>
                <option value='warning'>Warning</option>
                <option value='inactive'>Inactive</option>
              </select>

              {/* Clear filters */}
              {(searchQuery || levelFilter !== 'all' || statusFilter !== 'all' || instrumentFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setLevelFilter('all')
                    setStatusFilter('all')
                    setInstrumentFilter('all')
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i>Clear
                </button>
              )}
            </div>

            {/* Results count */}
            <div className='mt-3 text-muted small'>
              Showing {filteredStudents.length} of {progressData.student_progress.length} {progressData.student_progress.length === 1 ? 'student' : 'students'}
            </div>
          </div>

          {/* Students Table */}
          <div className='content-card'>
            <div className='table-responsive'>
              <table className='students-table'>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('student_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Student <i className={`bi ${getSortIcon('student_name')} ms-1`}></i>
                    </th>
                    <th onClick={() => handleSort('instrument')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Instrument <i className={`bi ${getSortIcon('instrument')} ms-1`}></i>
                    </th>
                    <th onClick={() => handleSort('level')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Level <i className={`bi ${getSortIcon('level')} ms-1`}></i>
                    </th>
                    <th onClick={() => handleSort('progress_percentage')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Progress <i className={`bi ${getSortIcon('progress_percentage')} ms-1`}></i>
                    </th>
                    <th>Courses</th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Status <i className={`bi ${getSortIcon('status')} ms-1`}></i>
                    </th>
                    <th onClick={() => handleSort('last_active')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Last Active <i className={`bi ${getSortIcon('last_active')} ms-1`}></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const statusColor = getStatusColor(student.status)
                      return (
                        <tr key={student.id}>
                          <td>
                            <div className='d-flex align-items-center'>
                              {student.student_profile_img ? (
                                <img
                                  src={`${baseUrl}${student.student_profile_img}`}
                                  alt={student.student_name}
                                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }}
                                />
                              ) : (
                                <div
                                  className='d-flex align-items-center justify-content-center'
                                  style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 13, marginRight: 10, flexShrink: 0 }}
                                >
                                  {student.student_name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <span className='fw-medium'>{student.student_name}</span>
                                {student.student_email && (
                                  <div className='text-muted' style={{ fontSize: 12 }}>{student.student_email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {student.instrument ? student.instrument.charAt(0).toUpperCase() + student.instrument.slice(1) : 'N/A'}
                          </td>
                          <td>
                            <span className={`level-badge ${student.level}`}>
                              {student.level ? student.level.charAt(0).toUpperCase() + student.level.slice(1) : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className='progress-cell'>
                              <div className='progress-bar-container'>
                                <div
                                  className={`progress-bar-fill ${getProgressClass(student.progress_percentage)}`}
                                  style={{ width: `${student.progress_percentage}%` }}
                                ></div>
                              </div>
                              <span className='progress-text' style={{ color: getProgressColor(student.progress_percentage) }}>
                                {student.progress_percentage}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 13 }}>
                              {student.completed_courses || 0}/{student.enrolled_courses || 0}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 600,
                                background: statusColor.bg,
                                color: statusColor.color
                              }}
                            >
                              {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}
                            </span>
                          </td>
                          <td>
                            <span className='text-muted' style={{ fontSize: 13 }}>
                              {formatDate(student.last_active)}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className='text-center py-4'>
                        <i className="bi bi-search display-6 text-muted d-block mb-2"></i>
                        <span className='text-muted'>No students match your filters</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =================== COURSES TAB =================== */}
      {activeTab === 'courses' && progressData.course_stats && (
        <>
          <div className='row g-4'>
            {progressData.course_stats.map((course) => (
              <div className='col-md-6 col-lg-4' key={course.id}>
                <div className='content-card h-100'>
                  <div className='d-flex align-items-start mb-3'>
                    <div
                      className='d-flex align-items-center justify-content-center me-3'
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#eff6ff',
                        color: '#3b82f6',
                        flexShrink: 0
                      }}
                    >
                      <i className="bi bi-journal-bookmark" style={{ fontSize: 20 }}></i>
                    </div>
                    <div className='flex-grow-1' style={{ minWidth: 0 }}>
                      <h6 className='mb-1' style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {course.title}
                      </h6>
                      <div className='text-muted small'>
                        {course.enrollments} student{course.enrollments !== 1 ? 's' : ''} enrolled
                      </div>
                    </div>
                  </div>

                  <div className='mb-2'>
                    <div className='d-flex justify-content-between mb-1'>
                      <span className='text-muted small'>Average Progress</span>
                      <span className='fw-medium small' style={{ color: getProgressColor(course.avg_progress) }}>
                        {course.avg_progress}%
                      </span>
                    </div>
                    <div className='progress-bar-container' style={{ height: 8 }}>
                      <div
                        className={`progress-bar-fill ${getProgressClass(course.avg_progress)}`}
                        style={{ width: `${course.avg_progress}%`, transition: 'width 0.5s ease' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {progressData.course_stats.length === 0 && (
            <div className='content-card'>
              <div className='d-flex flex-column align-items-center justify-content-center py-5'>
                <i className="bi bi-journal-x display-3 text-muted mb-3"></i>
                <h5 className='mb-2'>Your musical journey starts here.</h5>
                <p className='text-muted'>Create courses to see enrollment and progress analytics.</p>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default TeacherProgress
