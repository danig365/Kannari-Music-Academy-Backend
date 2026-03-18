import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import LoadingSpinner from '../LoadingSpinner'
import './teacherDashboard.css'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const mediaUrl = API_BASE_URL.replace('/api', ''); // Extract base domain from API URL

const TeacherStudents = () => {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterInstrument, setFilterInstrument] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortField, setSortField] = useState('student_name')
  const [sortDir, setSortDir] = useState('asc')

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addForm, setAddForm] = useState({ student: null, instrument: 'piano', level: 'beginner', notes: '' })

  // Assign Course Modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignStudent, setAssignStudent] = useState(null)
  const [teacherCourses, setTeacherCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // Student Detail Panel
  const [expandedStudentId, setExpandedStudentId] = useState(null)

  // Edit Student Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ id: null, instrument: '', level: '', notes: '', status: '' })

  const teacherId = localStorage.getItem('teacherId')

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`)
      if (response.data && response.data.length > 0) {
        setStudents(response.data)
      } else {
        // Try enrollment-based fallback and sync
        try {
          const enrollRes = await axios.get(`${baseUrl}/teacher/students-from-enrollments/${teacherId}/`)
          if (enrollRes.data.bool && enrollRes.data.students?.length > 0) {
            // Create TeacherStudent records for these students
            for (const s of enrollRes.data.students) {
              try {
                await axios.post(`${baseUrl}/teacher/students/${teacherId}/`, {
                  teacher: parseInt(teacherId),
                  student: s.id,
                  instrument: s.instrument || 'piano',
                  level: s.level || 'beginner',
                  status: 'active',
                  progress_percentage: s.progress_percentage || 0,
                })
              } catch (e) {
                // Already exists, ignore
              }
            }
            // Re-fetch
            const refetch = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`)
            setStudents(refetch.data || [])
          } else {
            setStudents([])
          }
        } catch (e) {
          setStudents([])
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    document.title = 'Kannari Music Academy | My Students'
    window.scrollTo(0, 0)
    fetchStudents()
  }, [fetchStudents])

  // Search students for Add modal
  useEffect(() => {
    if (studentSearch.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await axios.get(`${baseUrl}/teacher/search-students/${teacherId}/?search=${encodeURIComponent(studentSearch)}`)
        setSearchResults(res.data.students || [])
      } catch (e) {
        setSearchResults([])
      }
      setSearching(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [studentSearch, teacherId])

  // Filtered & sorted students
  const filteredStudents = useMemo(() => {
    let filtered = [...students]

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(s =>
        (s.student_name || '').toLowerCase().includes(q) ||
        (s.student_email || '').toLowerCase().includes(q)
      )
    }
    if (filterInstrument) filtered = filtered.filter(s => s.instrument === filterInstrument)
    if (filterLevel) filtered = filtered.filter(s => s.level === filterLevel)
    if (filterStatus) filtered = filtered.filter(s => s.status === filterStatus)

    filtered.sort((a, b) => {
      let aVal = a[sortField] ?? ''
      let bVal = b[sortField] ?? ''
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase() }
      if (sortDir === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    })

    return filtered
  }, [students, searchTerm, filterInstrument, filterLevel, filterStatus, sortField, sortDir])

  const uniqueInstruments = useMemo(() => {
    return [...new Set(students.map(s => s.instrument).filter(Boolean))].sort()
  }, [students])

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return 'bi-chevron-expand'
    return sortDir === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'
  }

  const getProgressColor = (p) => {
    if (p >= 80) return '#22c55e'
    if (p >= 60) return '#3b82f6'
    if (p >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getProgressClass = (p) => {
    if (p >= 80) return 'high'
    if (p >= 60) return 'medium'
    if (p >= 40) return 'low'
    return 'very-low'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#16a34a' }
      case 'warning': return { bg: '#fef3c7', color: '#d97706' }
      case 'inactive': return { bg: '#fee2e2', color: '#dc2626' }
      default: return { bg: '#f1f5f9', color: '#64748b' }
    }
  }

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A'

  // === ADD STUDENT ===
  const handleAddStudent = async () => {
    if (!addForm.student) {
      Swal.fire('Error', 'Please select a student', 'error')
      return
    }
    try {
      await axios.post(`${baseUrl}/teacher/students/${teacherId}/`, {
        teacher: parseInt(teacherId),
        student: addForm.student.id,
        instrument: addForm.instrument,
        level: addForm.level,
        notes: addForm.notes,
        status: 'active',
        progress_percentage: 0,
      })
      Swal.fire('Success', `${addForm.student.fullname} has been added as your student`, 'success')
      setShowAddModal(false)
      setAddForm({ student: null, instrument: 'piano', level: 'beginner', notes: '' })
      setStudentSearch('')
      setSearchResults([])
      fetchStudents()
    } catch (error) {
      const msg = error.response?.data?.student?.[0] || error.response?.data?.non_field_errors?.[0] || 'Failed to add student'
      Swal.fire('Error', msg, 'error')
    }
  }

  // === REMOVE STUDENT ===
  const handleRemoveStudent = (student) => {
    Swal.fire({
      title: 'Remove Student?',
      html: `Remove <strong>${student.student_name}</strong> from your students list?<br><small class="text-muted">This won't delete their account or course enrollments.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${baseUrl}/teacher/student/${student.id}/`)
          Swal.fire('Removed', `${student.student_name} has been removed`, 'success')
          fetchStudents()
          if (expandedStudentId === student.id) setExpandedStudentId(null)
        } catch (e) {
          Swal.fire('Error', 'Failed to remove student', 'error')
        }
      }
    })
  }

  // === EDIT STUDENT ===
  const openEditModal = (student) => {
    setEditForm({
      id: student.id,
      instrument: student.instrument || 'piano',
      level: student.level || 'beginner',
      notes: student.notes || '',
      status: student.status || 'active',
    })
    setShowEditModal(true)
  }

  const handleEditStudent = async () => {
    try {
      await axios.patch(`${baseUrl}/teacher/student/${editForm.id}/`, {
        instrument: editForm.instrument,
        level: editForm.level,
        notes: editForm.notes,
        status: editForm.status,
      })
      Swal.fire('Updated', 'Student info updated successfully', 'success')
      setShowEditModal(false)
      fetchStudents()
    } catch (e) {
      Swal.fire('Error', 'Failed to update student', 'error')
    }
  }

  // === ASSIGN COURSE ===
  const openAssignModal = async (student) => {
    setAssignStudent(student)
    setLoadingCourses(true)
    setShowAssignModal(true)
    try {
      const res = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${student.student?.id || student.student}/`)
      setTeacherCourses(res.data.courses || [])
    } catch (e) {
      setTeacherCourses([])
    }
    setLoadingCourses(false)
  }

  const handleAssignCourse = async (courseId) => {
    const studentId = assignStudent.student?.id || assignStudent.student
    try {
      const res = await axios.post(`${baseUrl}/teacher/assign-course/${teacherId}/`, {
        student_id: studentId,
        course_id: courseId,
      })
      if (res.data.bool) {
        Swal.fire('Enrolled!', res.data.message, 'success')
        // Refresh courses in modal
        const updated = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${studentId}/`)
        setTeacherCourses(updated.data.courses || [])
        fetchStudents()
      } else {
        Swal.fire('Info', res.data.message, 'info')
      }
    } catch (e) {
      Swal.fire('Error', e.response?.data?.error || e.response?.data?.message || 'Failed to assign course', 'error')
    }
  }

  const handleUnassignCourse = async (courseId) => {
    const studentId = assignStudent.student?.id || assignStudent.student
    const result = await Swal.fire({
      title: 'Remove Enrollment?',
      text: 'This will remove the student from this course.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Remove',
    })
    if (!result.isConfirmed) return
    try {
      await axios.post(`${baseUrl}/teacher/unassign-course/${teacherId}/`, {
        student_id: studentId,
        course_id: courseId,
      })
      Swal.fire('Removed', 'Enrollment removed', 'success')
      const updated = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${studentId}/`)
      setTeacherCourses(updated.data.courses || [])
      fetchStudents()
    } catch (e) {
      Swal.fire('Error', 'Failed to remove enrollment', 'error')
    }
  }

  // Loading
  if (loading) {
    return <LoadingSpinner size="lg" text="Loading students..." />
  }

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
          }}>My Students</h1>
          <p style={{
            fontSize: '15px',
            color: '#4b5563',
            margin: 0,
            fontWeight: 400
          }}>Manage your assigned students, track progress, and assign courses.</p>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          <button 
            onClick={fetchStudents}
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
          <button 
            onClick={() => setShowAddModal(true)}
            style={{
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
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            <i className="bi bi-plus-lg"></i>
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
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
          }}>{students.length}</div>
        </div>
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
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Active</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>{students.filter(s => s.status === 'active').length}</div>
        </div>
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
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Needs Attention</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>{students.filter(s => s.status === 'warning' || s.status === 'inactive').length}</div>
        </div>
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
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, marginBottom: '8px' }}>Avg Progress</div>
          <div style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            {students.length > 0 ? Math.round(students.reduce((a, s) => a + (s.progress_percentage || 0), 0) / students.length) : 0}%
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ flex: '1 1 250px', minWidth: '200px', position: 'relative' }}>
            <i className="bi bi-search" style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}></i>
            <input
              type='text'
              placeholder='Search by name or email...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 400,
                outline: 'none',
                transition: 'all 0.2s ease',
                color: '#1a1a1a'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <select 
            value={filterInstrument} 
            onChange={e => setFilterInstrument(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#1a1a1a',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">All Instruments</option>
            {uniqueInstruments.map(i => <option key={i} value={i}>{capitalize(i)}</option>)}
          </select>
          <select 
            value={filterLevel} 
            onChange={e => setFilterLevel(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#1a1a1a',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
              color: '#1a1a1a',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || filterInstrument || filterLevel || filterStatus) && (
            <button 
              onClick={() => { 
                setSearchTerm(''); 
                setFilterInstrument(''); 
                setFilterLevel(''); 
                setFilterStatus('') 
              }}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: '2px solid #fee2e2',
                background: '#fef2f2',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => {
                e.target.style.background = '#fee2e2';
              }}
              onMouseLeave={e => {
                e.target.style.background = '#fef2f2';
              }}
            >
              <i className="bi bi-x-circle"></i>Clear
            </button>
          )}
        </div>
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          fontWeight: 400
        }}>
          Showing {filteredStudents.length} of {students.length} {students.length === 1 ? 'student' : 'students'}
        </div>
      </div>

      {/* Students Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        {students.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '60px',
            paddingBottom: '60px'
          }}>
            <i className="bi bi-people" style={{
              fontSize: '48px',
              color: '#cbd5e1',
              marginBottom: '20px'
            }}></i>
            <h4 style={{
              fontSize: 'clamp(20px, 3vw, 24px)',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>No Students Yet</h4>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              fontSize: '15px',
              fontWeight: 400
            }}>Add students to start managing their learning journey.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
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
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              <i className="bi bi-plus-lg"></i>
              Add Your First Student
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: '#f8fafc',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <th onClick={() => handleSort('student_name')} style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#667eea'}
                    onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a'}
                  >
                    Student <i className={`bi ${getSortIcon('student_name')} ms-1`}></i>
                  </th>
                  <th onClick={() => handleSort('instrument')} style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#667eea'}
                    onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a'}
                  >
                    Instrument <i className={`bi ${getSortIcon('instrument')} ms-1`}></i>
                  </th>
                  <th onClick={() => handleSort('level')} style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#667eea'}
                    onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a'}
                  >
                    Level <i className={`bi ${getSortIcon('level')} ms-1`}></i>
                  </th>
                  <th onClick={() => handleSort('progress_percentage')} style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#667eea'}
                    onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a'}
                  >
                    Progress <i className={`bi ${getSortIcon('progress_percentage')} ms-1`}></i>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left'
                  }}>Courses</th>
                  <th onClick={() => handleSort('status')} style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#667eea'}
                    onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a'}
                  >
                    Status <i className={`bi ${getSortIcon('status')} ms-1`}></i>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'left'
                  }}>Last Active</th>
                  <th style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textAlign: 'center'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const sc = getStatusColor(student.status)
                  const isExpanded = expandedStudentId === student.id
                  return (
                    <React.Fragment key={student.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}>
                        <td>
                          <div className='d-flex align-items-center'>
                            {student.student_profile_img ? (
                              <img src={`${baseUrl}${student.student_profile_img}`} alt={student.student_name}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }} />
                            ) : (
                              <div className='d-flex align-items-center justify-content-center'
                                style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 14, marginRight: 10, flexShrink: 0 }}>
                                {(student.student_name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className='fw-medium'>{student.student_name}</span>
                              {student.student_email && <div className='text-muted' style={{ fontSize: 12 }}>{student.student_email}</div>}
                            </div>
                          </div>
                        </td>
                        <td>{capitalize(student.instrument)}</td>
                        <td>
                          <span className={`level-badge ${student.level}`}>{capitalize(student.level)}</span>
                        </td>
                        <td>
                          <div className='progress-cell'>
                            <div className='progress-bar-container'>
                              <div className={`progress-bar-fill ${getProgressClass(student.progress_percentage)}`}
                                style={{ width: `${student.progress_percentage}%` }}></div>
                            </div>
                            <span className='progress-text' style={{ color: getProgressColor(student.progress_percentage) }}>
                              {student.progress_percentage}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{student.enrolled_course_count || 0}</span>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                            {capitalize(student.status)}
                          </span>
                        </td>
                        <td>
                          <span className='text-muted' style={{ fontSize: 13 }}>{student.time_ago || 'N/A'}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className='d-flex gap-1'>
                            <button title='Assign Course' onClick={() => openAssignModal(student)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#3b82f6' }}>
                              <i className="bi bi-journal-plus"></i>
                            </button>
                            <button title='Edit Student' onClick={() => openEditModal(student)}
                              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#22c55e' }}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button title='Remove Student' onClick={() => handleRemoveStudent(student)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#ef4444' }}>
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, border: 'none' }}>
                            <div style={{ background: '#f8fafc', padding: '20px 24px', borderBottom: '2px solid #e2e8f0' }}>
                              <div className='row g-4'>
                                <div className='col-md-4'>
                                  <h6 style={{ color: '#475569', marginBottom: 12 }}>
                                    <i className="bi bi-person-badge me-2"></i>Student Info
                                  </h6>
                                  <div className='mb-2'><strong>Instrument:</strong> {capitalize(student.instrument)}</div>
                                  <div className='mb-2'><strong>Level:</strong> {capitalize(student.level)}</div>
                                  <div className='mb-2'><strong>Assigned:</strong> {student.assigned_at ? new Date(student.assigned_at).toLocaleDateString() : 'N/A'}</div>
                                  {student.notes && <div className='mb-2'><strong>Notes:</strong> {student.notes}</div>}
                                </div>
                                <div className='col-md-8'>
                                  <h6 style={{ color: '#475569', marginBottom: 12 }}>
                                    <i className="bi bi-journal-bookmark me-2"></i>Enrolled Courses
                                    <button className='ms-2' onClick={(e) => { e.stopPropagation(); openAssignModal(student) }}
                                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: '#3b82f6', fontSize: 12 }}>
                                      <i className="bi bi-plus me-1"></i>Assign
                                    </button>
                                  </h6>
                                  {student.enrolled_courses && student.enrolled_courses.length > 0 ? (
                                    <div className='d-flex flex-wrap gap-2'>
                                      {student.enrolled_courses.map(c => (
                                        <div key={c.enrollment_id}
                                          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                                          <div className='fw-medium'>{c.course_title}</div>
                                          <div className='d-flex align-items-center gap-2 mt-1'>
                                            <div style={{ width: 60, height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                                              <div style={{ width: `${c.progress_percent}%`, height: '100%', background: getProgressColor(c.progress_percent), borderRadius: 2 }}></div>
                                            </div>
                                            <span className='text-muted' style={{ fontSize: 11 }}>{c.progress_percent}%</span>
                                            <span className='text-muted' style={{ fontSize: 11 }}>· {c.enrolled_time}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className='text-muted small mb-0'>No courses enrolled yet. Click "Assign" to add courses.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className='text-center py-4'>
                      <i className="bi bi-search display-6 text-muted d-block mb-2"></i>
                      <span className='text-muted'>No students match your filters</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== ADD STUDENT MODAL ===================== */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.15s ease'
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.2s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a1a1a'
              }}><i className="bi bi-person-plus me-2"></i>Add Student</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#f5f7fa',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6b7280',
                  transition: 'all 0.15s',
                  fontSize: '18px'
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#fee2e2';
                  e.target.style.color = '#ef4444';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#f5f7fa';
                  e.target.style.color = '#6b7280';
                }}
              ><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* Student Search */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Search Student</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{
                    position: 'absolute',
                    left: '12px',
                    top: '12px',
                    color: '#6b7280'
                  }}></i>
                  <input type='text' placeholder='Type name or email (min 2 chars)...'
                    value={studentSearch} 
                    onChange={e => setStudentSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      color: '#1a1a1a'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {/* Search Results */}
                {searching && <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>Searching...</div>}
                {searchResults.length > 0 && (
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    marginTop: '8px'
                  }}>
                    {searchResults.map(s => (
                      <div key={s.id} 
                        onClick={() => { 
                          setAddForm({ ...addForm, student: s }); 
                          setSearchResults([]) 
                        }}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          borderBottom: '1px solid #e5e7eb',
                          background: addForm.student?.id === s.id ? '#f0f9ff' : '#fff',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f7fa'}
                        onMouseLeave={e => e.currentTarget.style.background = addForm.student?.id === s.id ? '#f0f9ff' : '#fff'}
                      >
                        {s.profile_img ? (
                          <img src={`${baseUrl}${s.profile_img}`} alt="" style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }} />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#fff',
                            flexShrink: 0
                          }}>
                            {s.fullname?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{s.fullname}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{s.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {studentSearch.length >= 2 && !searching && searchResults.length === 0 && (
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>No students found</div>
                )}
              </div>

              {/* Selected Student */}
              {addForm.student && (
                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <i className="bi bi-check-circle-fill" style={{ color: '#10b981', fontSize: '16px', flexShrink: 0 }}></i>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: '#1a1a1a', fontSize: '14px' }}>{addForm.student.fullname}</strong>
                      <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '4px' }}>({addForm.student.email})</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAddForm({ ...addForm, student: null })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      fontSize: '16px',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => e.target.style.color = '#ef4444'}
                    onMouseLeave={e => e.target.style.color = '#6b7280'}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}

              {/* Instrument & Level */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>Instrument</label>
                  <select value={addForm.instrument} onChange={e => setAddForm({ ...addForm, instrument: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 400,
                      color: '#1a1a1a',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="piano">Piano</option>
                    <option value="guitar">Guitar</option>
                    <option value="violin">Violin</option>
                    <option value="voice">Voice</option>
                    <option value="drums">Drums</option>
                    <option value="flute">Flute</option>
                    <option value="saxophone">Saxophone</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>Level</label>
                  <select value={addForm.level} onChange={e => setAddForm({ ...addForm, level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 400,
                      color: '#1a1a1a',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Notes (optional)</label>
                <textarea value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder='Any notes about this student...'
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: '#1a1a1a',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#1a1a1a',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#f5f7fa';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStudent} 
                disabled={!addForm.student}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: addForm.student ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#9ca3af',
                  color: '#fff',
                  cursor: addForm.student ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: addForm.student ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
                }}
                onMouseEnter={e => {
                  if (addForm.student) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={e => {
                  if (addForm.student) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                <i className="bi bi-plus-lg"></i>Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ASSIGN COURSE MODAL ===================== */}
      {showAssignModal && assignStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.15s ease'
        }} onClick={() => setShowAssignModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.2s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a1a1a'
              }}><i className="bi bi-journal-plus me-2"></i>Assign Course to {assignStudent.student_name}</h3>
              <button 
                onClick={() => setShowAssignModal(false)}
                style={{
                  background: '#f5f7fa',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6b7280',
                  transition: 'all 0.15s',
                  fontSize: '18px'
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#fee2e2';
                  e.target.style.color = '#ef4444';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#f5f7fa';
                  e.target.style.color = '#6b7280';
                }}
              ><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              {loadingCourses ? (
                <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
                  <LoadingSpinner size="sm" text="Loading courses..." />
                </div>
              ) : teacherCourses.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '40px',
                  paddingBottom: '40px',
                  textAlign: 'center'
                }}>
                  <i className="bi bi-journal-x" style={{
                    fontSize: '48px',
                    color: '#cbd5e1',
                    marginBottom: '16px'
                  }}></i>
                  <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '15px' }}>You don't have any courses yet.</p>
                  <Link to='/teacher-course-management' style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
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
                </div>
              ) : (
                <div>
                  {teacherCourses.map(course => (
                    <div key={course.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        border: course.is_enrolled ? '2px solid #10b981' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        marginBottom: '12px',
                        background: course.is_enrolled ? '#f0fdf4' : '#fff',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        if (!course.is_enrolled) {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.1)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!course.is_enrolled) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                        {course.featured_img ? (
                          <img src={`${mediaUrl}${course.featured_img}`} alt="" style={{
                            width: '48px',
                            height: '36px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0
                          }} />
                        ) : (
                          <div style={{
                            width: '48px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#f5f7fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: '#6b7280'
                          }}>
                            <i className="bi bi-journal"></i>
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1a1a1a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>{course.title}</div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>{course.total_enrolled} student{course.total_enrolled !== 1 ? 's' : ''} enrolled</div>
                        </div>
                      </div>
                      {course.is_enrolled ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            background: '#dcfce7',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="bi bi-check-circle"></i>Enrolled
                          </span>
                          <button 
                            onClick={() => handleUnassignCourse(course.id)}
                            style={{
                              background: '#fef2f2',
                              border: '2px solid #fecaca',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              color: '#ef4444',
                              fontSize: '14px',
                              fontWeight: 600,
                              transition: 'all 0.2s ease'
                            }}
                            title='Remove enrollment'
                            onMouseEnter={e => {
                              e.target.style.background = '#fee2e2';
                              e.target.style.borderColor = '#f87171';
                            }}
                            onMouseLeave={e => {
                              e.target.style.background = '#fef2f2';
                              e.target.style.borderColor = '#fecaca';
                            }}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleAssignCourse(course.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            flexShrink: 0
                          }}
                          onMouseEnter={e => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                          }}
                          onMouseLeave={e => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                          }}
                        >
                          <i className="bi bi-plus"></i>Enroll
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setShowAssignModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#1a1a1a',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#f5f7fa';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== EDIT STUDENT MODAL ===================== */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.15s ease'
        }} onClick={() => setShowEditModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.2s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a1a1a'
              }}><i className="bi bi-pencil-square me-2"></i>Edit Student</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  background: '#f5f7fa',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6b7280',
                  transition: 'all 0.15s',
                  fontSize: '18px'
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#fee2e2';
                  e.target.style.color = '#ef4444';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#f5f7fa';
                  e.target.style.color = '#6b7280';
                }}
              ><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>Instrument</label>
                  <select value={editForm.instrument} onChange={e => setEditForm({ ...editForm, instrument: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 400,
                      color: '#1a1a1a',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="piano">Piano</option>
                    <option value="guitar">Guitar</option>
                    <option value="violin">Violin</option>
                    <option value="voice">Voice</option>
                    <option value="drums">Drums</option>
                    <option value="flute">Flute</option>
                    <option value="saxophone">Saxophone</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>Level</label>
                  <select value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 400,
                      color: '#1a1a1a',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="active">Active</option>
                  <option value="warning">Warning</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder='Teacher notes about this student...'
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: '#1a1a1a',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#1a1a1a',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.target.style.background = '#f5f7fa';
                  e.target.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleEditStudent}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={e => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                <i className="bi bi-check-lg"></i>Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TeacherStudents
