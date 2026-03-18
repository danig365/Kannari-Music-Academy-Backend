import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../../config'

const TeacherSidebar = ({ isOpen = false, setIsOpen = null, isMobile = false, onNavigate = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for teacher data to ensure reactivity
  const [teacherName, setTeacherName] = useState(null);
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [teacherQualification, setTeacherQualification] = useState(null);
  const [teacherProfileImg, setTeacherProfileImg] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  // Load teacher data from localStorage first
  useEffect(() => {
    setTeacherId(localStorage.getItem('teacherId'));
  }, []);

  // Fetch latest teacher data from backend
  useEffect(() => {
    if (teacherId) {
      const fetchTeacherData = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/teacher/${teacherId}`);
          setTeacherName(response.data.full_name);
          setTeacherEmail(response.data.email);
          setTeacherQualification(response.data.qualification);
          if (response.data.profile_img) {
            setTeacherProfileImg(response.data.profile_img);
          }
        } catch (error) {
          console.log('Error fetching teacher data:', error);
          // Fallback to localStorage if API fails
          setTeacherName(localStorage.getItem('teacherName'));
          setTeacherEmail(localStorage.getItem('teacherEmail'));
          setTeacherQualification(localStorage.getItem('teacherQualification'));
          setTeacherProfileImg(localStorage.getItem('teacherProfileImg'));
        }
      };
      fetchTeacherData();
    }
  }, [teacherId]);

  // Listen for storage changes (when updated from settings)
  useEffect(() => {
    const handleStorageChange = () => {
      if (teacherId) {
        const fetchTeacherData = async () => {
          try {
            const response = await axios.get(`${API_BASE_URL}/teacher/${teacherId}`);
            setTeacherName(response.data.full_name);
            setTeacherEmail(response.data.email);
            setTeacherQualification(response.data.qualification);
            if (response.data.profile_img) {
              setTeacherProfileImg(response.data.profile_img);
            }
          } catch (error) {
            console.log('Error fetching teacher data:', error);
          }
        };
        fetchTeacherData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [teacherId]);

  useEffect(()=>{
    document.title='LMS | Menu'
  })

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = (e, path) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      
      if (setIsOpen) {
        setIsOpen(false);
      }
      
      if (onNavigate) {
        onNavigate(path);
      } else {
        setTimeout(() => {
          navigate(path);
        }, 100);
      }
    }
  };
  
  return (
    <div className="d-flex flex-column h-100 teacher-sidebar-inner" style={{ 
      backgroundColor: '#0f1624', 
      color: '#8b92a7',
      width: isMobile ? '100%' : '260px',
      height: '100%',
      maxHeight: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center" 
               style={{ 
                 width: '48px', 
                 height: '48px', 
                 background: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)'
               }}>
            <i className="bi bi-person-chalkboard text-white fs-4"></i>
          </div>
          <div>
            <div className="fw-bold text-white" style={{ fontSize: '18px' }}>Kannari Music Academy</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Teacher Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 py-3">
        <nav>
          <Link 
            to='/teacher-overview' 
            onClick={(e) => handleNavClick(e, '/teacher-overview')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-overview') || isActive('/teacher-dashboard') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-overview') || isActive('/teacher-dashboard') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-overview') || isActive('/teacher-dashboard') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-overview') && !isActive('/teacher-dashboard')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-overview') && !isActive('/teacher-dashboard')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-grid me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Overview</span>
          </Link>

          <Link 
            to='/teacher-students' 
            onClick={(e) => handleNavClick(e, '/teacher-students')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-students') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-students') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-students') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-students')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-students')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-people me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Students</span>
          </Link>

          <Link 
            to='/teacher-course-management' 
            onClick={(e) => handleNavClick(e, '/teacher-course-management')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-course-management') || location.pathname.startsWith('/teacher-course-management/') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-course-management') || location.pathname.startsWith('/teacher-course-management/') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-course-management') || location.pathname.startsWith('/teacher-course-management/') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-course-management') && !location.pathname.startsWith('/teacher-course-management/')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-course-management') && !location.pathname.startsWith('/teacher-course-management/')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-journal-richtext me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Course Management</span>
          </Link>

          <Link 
            to='/teacher-sessions' 
            onClick={(e) => handleNavClick(e, '/teacher-sessions')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-sessions') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-sessions') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-sessions') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-sessions')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-sessions')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-camera-video me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Sessions</span>
          </Link>

          <Link 
            to='/teacher-audio-messages' 
            onClick={(e) => handleNavClick(e, '/teacher-audio-messages')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-audio-messages') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-audio-messages') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-audio-messages') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-audio-messages')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-audio-messages')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-mic me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Audio Messages</span>
          </Link>

          <Link 
            to='/teacher-text-messages' 
            onClick={(e) => handleNavClick(e, '/teacher-text-messages')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-text-messages') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-text-messages') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-text-messages') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-text-messages')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-text-messages')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-chat-dots me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Text Messages</span>
          </Link>

          <Link 
            to='/teacher-create-assignments' 
            onClick={(e) => handleNavClick(e, '/teacher-create-assignments')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-create-assignments') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-create-assignments') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-create-assignments') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-create-assignments')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-create-assignments')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-journal-plus me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Create Assignments</span>
          </Link>

          <Link 
            to='/teacher-office-hours' 
            onClick={(e) => handleNavClick(e, '/teacher-office-hours')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-office-hours') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-office-hours') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-office-hours') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-office-hours')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-office-hours')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-clock me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Office Hours</span>
          </Link>

          <Link 
            to='/teacher-assignment-reviews' 
            onClick={(e) => handleNavClick(e, '/teacher-assignment-reviews')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-assignment-reviews') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-assignment-reviews') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-assignment-reviews') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-assignment-reviews')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-assignment-reviews')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-clipboard-check me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Assignment Reviews</span>
          </Link>

          <Link 
            to='/teacher-progress' 
            onClick={(e) => handleNavClick(e, '/teacher-progress')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-progress') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-progress') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-progress') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-progress')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-progress')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-bar-chart me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Progress</span>
          </Link>

          <Link 
            to='/teacher-profile-setting' 
            onClick={(e) => handleNavClick(e, '/teacher-profile-setting')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-profile-setting') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-profile-setting') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-profile-setting') ? '3px solid #4285f4' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-profile-setting')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-profile-setting')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-person-circle me-3" style={{ fontSize: '18px' }}></i>
            <span style={{ fontSize: '14px' }}>Profile Settings</span>
          </Link>

          {/* Divider */}
          <div style={{ margin: '0.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}></div>

          <Link 
            to='/teacher-community' 
            onClick={(e) => handleNavClick(e, '/teacher-community')}
            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
            style={{ 
              color: isActive('/teacher-community') ? '#fff' : '#8b92a7',
              backgroundColor: isActive('/teacher-community') ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderLeft: isActive('/teacher-community') ? '3px solid #8b5cf6' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive('/teacher-community')) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/teacher-community')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8b92a7';
              }
            }}
          >
            <i className="bi bi-chat-dots me-3" style={{ fontSize: '18px', color: isActive('/teacher-community') ? '#a78bfa' : 'inherit' }}></i>
            <span style={{ fontSize: '14px' }}>Teacher Lounge</span>
            <span style={{
              marginLeft: 'auto', fontSize: '0.65rem', padding: '2px 8px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))',
              color: '#a78bfa', fontWeight: 600
            }}>CHAT</span>
          </Link>
        </nav>
      </div>

      {/* Footer - Teacher Info & Actions */}
      <div className="mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="p-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            {teacherProfileImg ? (
              <img src={teacherProfileImg} alt={teacherName} className="rounded-circle" 
                   style={{ 
                     width: '40px', 
                     height: '40px', 
                     objectFit: 'cover',
                     border: '2px solid rgba(66, 133, 244, 0.3)',
                     flexShrink: 0
                   }}
              />
            ) : (
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" 
                   style={{ 
                     width: '40px', 
                     height: '40px', 
                     background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                     fontSize: '16px',
                     flexShrink: 0
                   }}>
                {teacherName ? teacherName.substring(0, 2).toUpperCase() : 'TC'}
              </div>
            )}
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="text-white fw-medium" style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {teacherName || teacherEmail?.split('@')[0] || 'Teacher'}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {teacherEmail || 'educator@email.com'}
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Link 
              to='/teacher-profile-setting' 
              onClick={(e) => handleNavClick(e, '/teacher-profile-setting')}
              className="text-decoration-none flex-fill text-center py-2 rounded-2"
              style={{ 
                color: '#8b92a7',
                backgroundColor: 'rgba(255,255,255,0.05)',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#8b92a7';
              }}
            >
              <i className="bi bi-gear me-1"></i> Settings
            </Link>
            <Link 
              to='/teacher-logout' 
              onClick={(e) => handleNavClick(e, '/teacher-logout')}
              className="text-decoration-none flex-fill text-center py-2 rounded-2"
              style={{ 
                color: '#8b92a7',
                backgroundColor: 'rgba(255,255,255,0.05)',
                fontSize: '13px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#8b92a7';
              }}
            >
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherSidebar
