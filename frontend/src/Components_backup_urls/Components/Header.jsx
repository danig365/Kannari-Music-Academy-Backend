import React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const teacherLoginStatus=localStorage.getItem('teacherLoginStatus')
  const studentLoginStatus=localStorage.getItem('studentLoginStatus')
  const adminLoginStatus=localStorage.getItem('adminLoginStatus')
  const schoolLoginStatus=localStorage.getItem('schoolLoginStatus')
  
  const [searchString,setSearchString]=useState({
    'search':'',
  })

  const handleChange=(event)=>{
    setSearchString({
      ...searchString,
      [event.target.name]:event.target.value
    });
  }

  return (
    <>
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
        <div className="container-fluid header-container">
            <Link to="/" className="navbar-brand navbar-brand-custom">
                <div className="brand-icon-wrapper">
                    <svg className="navbar-icon" width="32" height="32" viewBox="0 0 24 24" fill="none">
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
                </div>
                <span className="brand-text">KANNARI MUSIC ACADEMY</span>
            </Link>
            
            <button 
                type="button" 
                className="navbar-toggler navbar-toggler-custom" 
                data-bs-toggle="collapse" 
                data-bs-target="#navbarCollapse"
                aria-controls="navbarCollapse"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>
            
            <div className="collapse navbar-collapse" id="navbarCollapse">
                <div className="navbar-nav ms-auto navbar-nav-custom">
                    <Link to="/" className="nav-item nav-link nav-link-custom">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        Home
                    </Link>
                    
                    {/* Teacher Dropdown */}
                    <div className="nav-item dropdown nav-dropdown-custom">
                        <a href="#" className="nav-link dropdown-toggle nav-link-custom" data-bs-toggle="dropdown">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Teacher
                        </a>
                        <div className="dropdown-menu dropdown-menu-custom">
                        {teacherLoginStatus !='true' && 
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/teacher-login">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                  <polyline points="10 17 15 12 10 7"/>
                                  <line x1="15" y1="12" x2="3" y2="12"/>
                              </svg>
                              Login
                          </Link>
                          <Link className="dropdown-item dropdown-item-custom" to="/teacher-register">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                  <circle cx="8.5" cy="7" r="4"/>
                                  <line x1="20" y1="8" x2="20" y2="14"/>
                                  <line x1="23" y1="11" x2="17" y2="11"/>
                              </svg>
                              Register
                          </Link>
                        </>
                        }
                        {teacherLoginStatus ==='true' && 
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/teacher-dashboard">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="9"/>
                                  <rect x="14" y="3" width="7" height="5"/>
                                  <rect x="14" y="12" width="7" height="9"/>
                                  <rect x="3" y="16" width="7" height="5"/>
                              </svg>
                              Dashboard
                          </Link>
                          <Link className="dropdown-item dropdown-item-custom dropdown-item-logout" to="/teacher-logout">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                  <polyline points="16 17 21 12 16 7"/>
                                  <line x1="21" y1="12" x2="9" y2="12"/>
                              </svg>
                              Logout
                          </Link>
                        </>
                        }
                        </div>
                    </div>
                    
                    {/* Student Dropdown */}
                    <div className="nav-item dropdown nav-dropdown-custom">
                        <a href="#" className="nav-link dropdown-toggle nav-link-custom" data-bs-toggle="dropdown">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Student
                        </a>
                        <div className="dropdown-menu dropdown-menu-custom">
                        {studentLoginStatus !='true' && 
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/user-login">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                  <polyline points="10 17 15 12 10 7"/>
                                  <line x1="15" y1="12" x2="3" y2="12"/>
                              </svg>
                              Login
                          </Link>
                          <Link className="dropdown-item dropdown-item-custom" to="/user-register">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                  <circle cx="8.5" cy="7" r="4"/>
                                  <line x1="20" y1="8" x2="20" y2="14"/>
                                  <line x1="23" y1="11" x2="17" y2="11"/>
                              </svg>
                              Register
                          </Link>
                        </>
                        }
                        {studentLoginStatus === 'true' &&
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/user-dashboard">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="9"/>
                                  <rect x="14" y="3" width="7" height="5"/>
                                  <rect x="14" y="12" width="7" height="9"/>
                                  <rect x="3" y="16" width="7" height="5"/>
                              </svg>
                              Dashboard
                          </Link>
                          <Link className="dropdown-item dropdown-item-custom dropdown-item-logout" to="/user-logout">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                  <polyline points="16 17 21 12 16 7"/>
                                  <line x1="21" y1="12" x2="9" y2="12"/>
                              </svg>
                              Logout
                          </Link>
                        </>
                        }
                        </div>
                    </div>
                    
                    {/* Admin Dropdown */}
                    <div className="nav-item dropdown nav-dropdown-custom">
                        <a href="#" className="nav-link dropdown-toggle nav-link-custom" data-bs-toggle="dropdown">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Admin
                        </a>
                        <div className="dropdown-menu dropdown-menu-custom">
                        {adminLoginStatus !=='true' && 
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/admin-login">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                  <polyline points="10 17 15 12 10 7"/>
                                  <line x1="15" y1="12" x2="3" y2="12"/>
                              </svg>
                              Login
                          </Link>
                        </>
                        }
                        {adminLoginStatus === 'true' &&
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/admin-dashboard">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="9"/>
                                  <rect x="14" y="3" width="7" height="5"/>
                                  <rect x="14" y="12" width="7" height="9"/>
                                  <rect x="3" y="16" width="7" height="5"/>
                              </svg>
                              Dashboard
                          </Link>
                          <Link className="dropdown-item dropdown-item-custom dropdown-item-logout" to="/admin-logout">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                  <polyline points="16 17 21 12 16 7"/>
                                  <line x1="21" y1="12" x2="9" y2="12"/>
                              </svg>
                              Logout
                          </Link>
                        </>
                        }
                        </div>
                    </div>
                    
                    {/* School Dropdown */}
                    <div className="nav-item dropdown nav-dropdown-custom">
                        <a href="#" className="nav-link dropdown-toggle nav-link-custom" data-bs-toggle="dropdown">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            School
                        </a>
                        <div className="dropdown-menu dropdown-menu-custom">
                        {schoolLoginStatus !=='true' && 
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/school-login">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                  <polyline points="10 17 15 12 10 7"/>
                                  <line x1="15" y1="12" x2="3" y2="12"/>
                              </svg>
                              Login
                          </Link>
                        </>
                        }
                        {schoolLoginStatus === 'true' &&
                        <>
                          <Link className="dropdown-item dropdown-item-custom" to="/school-dashboard">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="7" height="9"/>
                                  <rect x="14" y="3" width="7" height="5"/>
                                  <rect x="14" y="12" width="7" height="9"/>
                                  <rect x="3" y="16" width="7" height="5"/>
                              </svg>
                              Dashboard
                          </Link>
                          <Link className="dropdown-item dropdown-item-custom dropdown-item-logout" to="/school-logout">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                  <polyline points="16 17 21 12 16 7"/>
                                  <line x1="21" y1="12" x2="9" y2="12"/>
                              </svg>
                              Logout
                          </Link>
                        </>
                        }
                        </div>
                    </div>

                    {/* Parent Link */}
                    <div className="nav-item nav-dropdown-custom">
                        <Link to="/parent-login" className="nav-link nav-link-custom">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Parent
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </nav> 
    </>
  )
}

export default Header