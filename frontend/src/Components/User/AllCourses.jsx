import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useEffect, useState } from 'react'
import axios from 'axios'
import LoadingSpinner from '../LoadingSpinner'
import './AllCourses.css'

import { API_BASE_URL } from '../../config';

const baseUrl = `${API_BASE_URL}/course/`;

const AllCourses = () => {
  const navigate = useNavigate()
  const studentLoginStatus = localStorage.getItem('studentLoginStatus')
  const [courseData, setCourseData] = useState([])
  const [nextUrl, setNextUrl] = useState()
  const [previousUrl, setPreviousUrl] = useState()
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Authentication check
  useEffect(() => {
    if (studentLoginStatus !== 'true') {
      navigate('/user-login')
    }
  }, [studentLoginStatus, navigate])

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Kannari Music Academy | All Courses'
    fetchData(baseUrl)
  }, [])

  const paginationHandler = (url) => {
    setCurrentPage(url.includes('page=') ? parseInt(url.split('page=')[1]) : 1)
    fetchData(url)
  }

  function fetchData(url) {
    setLoading(true)
    try {
      axios.get(url)
        .then((res) => {
          setNextUrl(res.data.next)
          setPreviousUrl(res.data.previous)
          setCourseData(res.data.results)
          setLoading(false)
        })
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  if (studentLoginStatus !== 'true') {
    return null
  }

  if (loading) {
    return (
      <div className="all-courses-container">
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          isMobile={isMobile}
        />
        <div className="all-courses-content">
          <div className="mobile-header">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <i className="bi bi-list"></i>
            </button>
            <div className="logo-mini">Kannari Music Academy</div>
          </div>
          <div className="all-courses-main">
            <LoadingSpinner size="lg" text="Loading courses..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="all-courses-container">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isMobile={isMobile}
      />

      {/* Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="all-courses-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list"></i>
          </button>
          <div className="logo-mini">Kannari Music Academy</div>
        </div>

        <div className="all-courses-main">
          {/* Header */}
          <div className="page-header">
            <h2>
              <i className="bi bi-music-note-list me-2"></i>
              All Courses
            </h2>
            <p>
              Discover your next musical journey — explore our full catalogue
            </p>
          </div>

          <div className="courses-grid">
            {courseData && courseData.length > 0 ? courseData.map((course, index) => (
              <div className="course-card" key={index}>
                {/* Course Image */}
                <Link to={`/detail/${course.id}`} className="course-image-wrapper">
                  {course.featured_img ? (
                    <img 
                      src={course.featured_img} 
                      className="course-image" 
                      alt={course.title}
                    />
                  ) : (
                    <div className="course-placeholder">
                      <i className="bi bi-music-note-beamed" aria-hidden="true"></i>
                    </div>
                  )}
                </Link>

                {/* Course Info */}
                <div className="course-body">
                  <h5 className="course-title">
                    <Link to={`/detail/${course.id}`} className='text-decoration-none' style={{color: 'inherit'}}>
                      {course.title}
                    </Link>
                  </h5>
                  <p className="course-description">
                    {course.description?.substring(0, 80)}...
                  </p>

                  {/* Course Meta */}
                  <div className="course-meta">
                    {course.teacher && (
                          <span className="meta-badge teacher">
                            <i className="bi bi-person-badge" aria-hidden="true"></i>
                            {course.teacher?.full_name || 'Instructor'}
                          </span>
                        )}
                        {course.category && (
                          <span className="meta-badge category">
                            <i className="bi bi-tag" aria-hidden="true"></i>
                            {course.category?.title}
                          </span>
                        )}
                      </div>

                      {/* Rating and Students */}
                      <div className="course-stats">
                        <span>
                          <i className="bi bi-star-fill" style={{color: '#f59e0b', marginRight: '4px'}}></i>
                          {course.course_rating ? course.course_rating.toFixed(1) : 'New'}
                        </span>
                        <span>
                          <i className="bi bi-people" style={{color: '#10b981', marginRight: '4px'}}></i>
                          {course.total_enrolled_students || 0} {(course.total_enrolled_students || 0) === 1 ? 'Student' : 'Students'}
                        </span>
                      </div>

                      {/* Footer Button */}
                      <div className="course-footer">
                        <Link 
                          to={`/detail/${course.id}`} 
                          className="view-course-btn"
                          aria-label={`View ${course.title}`}
                        >
                          View Course
                          <i className="bi bi-arrow-right" aria-hidden="true"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state">
                      <i className="bi bi-music-note-beamed" aria-hidden="true"></i>
                      <h5>No Courses Available Yet</h5>
                      <p>New music courses are on the way — check back soon!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {(previousUrl || nextUrl) && (
                <nav aria-label="Page navigation">
                  <ul className="pagination-wrapper">
                    {previousUrl && (
                      <li className="pagination-item">
                        <button 
                          className="pagination-btn" 
                          onClick={() => paginationHandler(previousUrl)}
                        >
                          <i className='bi bi-chevron-left'></i> Previous
                        </button>
                      </li>
                    )}
                    <li className="pagination-item">
                      <span className="pagination-info">Page {currentPage}</span>
                    </li>
                    {nextUrl && (
                      <li className="pagination-item">
                        <button 
                          className="pagination-btn" 
                          onClick={() => paginationHandler(nextUrl)}
                        >
                          Next <i className='bi bi-chevron-right'></i>
                        </button>
                      </li>
                    )}
                  </ul>
                </nav>
              )}
        </div>
      </div>
    </div>
  )
}

export default AllCourses
