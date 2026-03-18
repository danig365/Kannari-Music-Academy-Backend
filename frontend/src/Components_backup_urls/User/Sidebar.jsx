import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import './Sidebar.css'
import { API_BASE_URL } from '../../config';

const Sidebar = ({ isOpen = false, setIsOpen = null, isMobile = false }) => {
  const location = useLocation();
  const [studentData, setStudentData] = useState({
    fullname: '',
    email: '',
    profile_img: ''
  });
  const [groups, setGroups] = useState([]);
  const [minorStatus, setMinorStatus] = useState(null); // { is_minor, can_send_messages, has_parent_approval }
  const studentId = localStorage.getItem('studentId');

  const baseUrl = API_BASE_URL;

  useEffect(()=>{
    document.title='LMS | MainMenu'
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch student data from API to get the latest profile image
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/student/${studentId}`);
        setStudentData({
          fullname: response.data.fullname || '',
          email: response.data.email || '',
          profile_img: response.data.profile_img || ''
        });
      } catch (error) {
        console.log('Error fetching student data:', error);
      }
    };
    if (studentId) {
      fetchStudentData();
      // Refresh data every 30 seconds to catch updates from settings page
      const interval = setInterval(fetchStudentData, 30000);
      return () => clearInterval(interval);
    }
  }, [studentId]);

  // Fetch student's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/my-groups/`);
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log('No groups or error:', err);
      }
    };
    if (studentId) {
      fetchGroups();
    }
  }, [studentId]);

  // Fetch minor access status
  useEffect(() => {
    const fetchMinorStatus = async () => {
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/minor-access-status/`);
        setMinorStatus(res.data);
      } catch (err) {
        console.log('Minor status check error:', err);
      }
    };
    if (studentId) {
      fetchMinorStatus();
    }
  }, [studentId]);

  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    if (isMobile && setIsOpen) {
      setIsOpen(false);
    }
  };

  const sidebarStyle = {
    backgroundColor: '#0f172a', 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '250px',
    overflowY: 'auto',
    zIndex: 1000,
    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
    transition: 'transform 0.3s ease',
    boxShadow: isMobile && isOpen ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
  };

  return (
    <div style={sidebarStyle}>
      {/* Header Section */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="bi bi-music-note-beamed" style={{ fontSize: '20px', color: 'white' }}></i>
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Kannari Music Academy</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Student Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '8px 12px' }}>
        <Link 
          to='/user-dashboard' 
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/user-dashboard') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/user-dashboard') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-speedometer2" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Dashboard</span>
        </Link>

        <Link 
          to='/my-courses'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/my-courses') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/my-courses') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          <i className="bi bi-book" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>My Courses</span>
          {isActive('/my-courses') && (
            <span style={{ marginLeft: 'auto', width: '6px', height: '6px', backgroundColor: '#60a5fa', borderRadius: '50%' }}></span>
          )}
        </Link>

        <Link 
          to='/all-courses'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/all-courses') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/all-courses') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-collection" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>All Courses</span>
        </Link>

        <Link 
          to='/my-progress'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/my-progress') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/my-progress') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-bar-chart-line" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>My Progress</span>
        </Link>

        <Link 
          to='/my-achievements'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/my-achievements') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/my-achievements') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-trophy" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Achievements</span>
        </Link>

        <Link 
          to='/my-sessions'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/my-sessions') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/my-sessions') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-camera-video" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Sessions</span>
        </Link>

        <Link 
          to='/my-messages'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: (minorStatus?.is_minor && !minorStatus?.can_send_messages) ? '#475569' : (isActive('/my-messages') ? 'white' : '#94a3b8'),
            backgroundColor: isActive('/my-messages') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s',
            opacity: (minorStatus?.is_minor && !minorStatus?.can_send_messages) ? 0.5 : 1,
            pointerEvents: (minorStatus?.is_minor && !minorStatus?.can_send_messages) ? 'none' : 'auto'
          }}
        >
          <i className="bi bi-mic" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Messages</span>
          {minorStatus?.is_minor && !minorStatus?.can_send_messages && (
            <i className="bi bi-lock-fill" style={{ marginLeft: 'auto', fontSize: '12px', color: '#f59e0b' }}></i>
          )}
        </Link>



        {/* Minor restriction banner */}
        {minorStatus?.is_minor && !minorStatus?.can_send_messages && (
          <div style={{
            margin: '4px 0 8px', padding: '8px 12px', backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bi bi-shield-exclamation" style={{ fontSize: '12px', color: '#f59e0b' }}></i>
              <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>Parent Approval Required</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#92400e', lineHeight: '1.4' }}>
              Messaging is locked until your parent/guardian approves your account.
            </p>
          </div>
        )}

        <Link 
          to='/my-assignments'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/my-assignments') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/my-assignments') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-journal-check" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Assignments</span>
        </Link>

        {/* Group Classes Section */}
        {groups.length > 0 && (
          <>
            <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '8px 0' }}></div>
            <div style={{ padding: '4px 16px 8px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              My Groups
            </div>
            <Link
              to='/my-groups'
              onClick={handleNavClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive('/my-groups') ? 'white' : '#94a3b8',
                backgroundColor: isActive('/my-groups') ? '#1e40af' : 'transparent',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-diagram-3" style={{ fontSize: '18px' }}></i>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>All Groups</span>
              {groups.some(g => g.live_now) && (
                <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
              )}
            </Link>
          </>
        )}

        <Link 
          to='/subscriptions'
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: isActive('/subscriptions') ? 'white' : '#94a3b8',
            backgroundColor: isActive('/subscriptions') ? '#1e40af' : 'transparent',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <i className="bi bi-credit-card-2-front" style={{ fontSize: '18px' }}></i>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Subscriptions</span>
        </Link>

        <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '8px 0' }}></div>
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '12px 12px 16px 12px', borderTop: '1px solid #1e293b' }}>
        {/* User Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          {studentData.profile_img ? (
            <img 
              src={studentData.profile_img} 
              alt={studentData.fullname}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#a855f7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              flexShrink: 0
            }}>
              {studentData.fullname ? studentData.fullname.substring(0, 2).toUpperCase() : 'ST'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '4px'
            }}>
              {studentData.fullname || 'Student'}
            </div>
            <div style={{ 
              color: '#64748b', 
              fontSize: '12px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {studentData.email || 'student@example.com'}
            </div>
          </div>
        </div>

        {/* Settings and Logout */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <Link 
            to='/profile-setting' 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#94a3b8',
              backgroundColor: '#1e293b',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <i className="bi bi-gear" style={{ fontSize: '14px', flexShrink: 0 }}></i>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Settings</span>
          </Link>
          <Link 
            to='/user-logout' 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#94a3b8',
              backgroundColor: '#1e293b',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: '14px', flexShrink: 0 }}></i>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Logout</span>
          </Link>
        </div>
        
        {/* Hidde n link to preserve routing logic */}
        <div style={{ display: 'none' }}>
          <Link to='/change-password'>Change Password</Link>
        </div>
      </div>
    </div>
  )
}

export default Sidebar