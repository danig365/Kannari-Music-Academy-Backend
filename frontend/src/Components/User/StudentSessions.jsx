import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, JITSI_BASE_URL } from '../../config';
import Swal from 'sweetalert2';
import Sidebar from './Sidebar';
import './EnhancedDashboard.css';

const StudentSessions = () => {
  const studentId = localStorage.getItem('studentId');
  const baseUrl = API_BASE_URL;

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVideoRoom, setShowVideoRoom] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSessions();
    // Poll for live sessions every 15 seconds
    const interval = setInterval(fetchLiveSessions, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    await Promise.all([fetchUpcoming(), fetchLiveSessions()]);
    setLoading(false);
  };

  const fetchUpcoming = async () => {
    try {
      const res = await axios.get(`${baseUrl}/student/${studentId}/upcoming-sessions/`);
      setUpcomingSessions(res.data);
    } catch (err) {
      console.error('Error fetching upcoming sessions:', err);
    }
  };

  const fetchLiveSessions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/student/${studentId}/live-sessions/`);
      setLiveSessions(res.data);
    } catch (err) {
      console.error('Error fetching live sessions:', err);
    }
  };

  const handleJoin = async (session) => {
    try {
      const res = await axios.post(`${baseUrl}/student/${studentId}/join-session/${session.id}/`);
      if (res.data.bool) {
        setShowVideoRoom({
          ...session,
          room_name: res.data.room_name,
          meeting_link: res.data.meeting_link,
          teacher_name: res.data.teacher_name
        });
      } else {
        if (res.data.requires_upgrade) {
          Swal.fire({
            icon: 'warning',
            title: 'Upgrade Required',
            text: res.data.message,
            confirmButtonText: 'View Plans',
            showCancelButton: true
          }).then(result => {
            if (result.isConfirmed) window.location.href = '/student/subscriptions';
          });
        } else {
          Swal.fire({ icon: 'info', title: 'Cannot Join', text: res.data.message });
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.requires_upgrade) {
        Swal.fire({
          icon: 'warning',
          title: 'Subscription Required',
          text: data.message || 'Active subscription required for live sessions.',
          confirmButtonText: 'View Plans',
          showCancelButton: true
        }).then(result => {
          if (result.isConfirmed) window.location.href = '/student/subscriptions';
        });
      } else if (data?.requires_parental_consent) {
        Swal.fire({
          icon: 'warning',
          title: 'Parental Consent Required',
          text: data.message || 'Parent authorization is required before joining live sessions.',
          confirmButtonColor: '#1976d2'
        });
      } else if (data?.teacher_verification_status) {
        Swal.fire({
          icon: 'error',
          title: 'Teacher Not Verified',
          text: data.message || data.error || 'This teacher is not cleared to teach minor students.',
          confirmButtonColor: '#1976d2'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Cannot Join Session',
          text: data?.message || data?.error || 'Failed to join session. Please try again.',
          confirmButtonColor: '#1976d2'
        });
      }
    }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTimeUntil = (date, time) => {
    const sessionDate = new Date(date + 'T' + time);
    const now = new Date();
    const diff = sessionDate - now;
    if (diff < 0) return 'Now';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)} days`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const handleReportSession = async (session) => {
    const result = await Swal.fire({
      title: 'Report Session Safety Issue',
      input: 'textarea',
      inputLabel: 'Describe the issue',
      inputPlaceholder: 'Enter details...',
      showCancelButton: true,
      inputValidator: (value) => (!value ? 'Description is required' : undefined)
    });
    if (!result.isConfirmed) return;

    try {
      const payload = new FormData();
      payload.append('reporter_type', 'student');
      payload.append('reporter_id', studentId);
      payload.append('description', result.value);
      await axios.post(`${baseUrl}/session/${session.id}/report/`, payload);
      Swal.fire({ icon: 'success', title: 'Safety report submitted' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not submit report.' });
    }
  };

  // ============= VIDEO ROOM =============
  if (showVideoRoom) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
            <span style={{ color: '#22c55e', fontWeight: '600' }}>CONNECTED</span>
            <span style={{ color: '#94a3b8' }}>— {showVideoRoom.title}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
              with {showVideoRoom.teacher_name || 'Teacher'}
            </span>
            <button onClick={() => { setShowVideoRoom(null); fetchSessions(); }} style={{ padding: '8px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Leave
            </button>
          </div>
        </div>
        <iframe
          src={`${JITSI_BASE_URL}/${showVideoRoom.room_name}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.enableLobbyMode=false&config.requireDisplayName=false`}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="camera; microphone; display-capture; autoplay; clipboard-write"
          title="Live Session"
        />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  // ============= MAIN UI =============
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      {isMobile && sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', marginLeft: isMobile ? 0 : '250px' }}>
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
    <div style={{ padding: '32px', width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>My Sessions</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Join live video sessions with your teachers</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading sessions...</div>
      ) : (
        <>
          {/* Live Sessions — shown prominently */}
          {liveSessions.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ color: '#ef4444', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                Live Now
              </h4>
              {liveSessions.map(session => (
                <div key={session.id} style={{ backgroundColor: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '56px', height: '56px', backgroundColor: '#ef4444', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-broadcast" style={{ fontSize: '24px', color: '#fff' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>{session.title}</div>
                      <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                        with {session.teacher_name || 'Teacher'} • {session.duration_minutes} min session
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleJoin(session)} style={{ padding: '12px 28px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}>
                    <i className="bi bi-camera-video-fill"></i> Join Now
                  </button>
                  <button onClick={() => handleReportSession(session)} style={{ marginLeft: '8px', padding: '10px 14px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    <i className="bi bi-flag me-1"></i> Report
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Sessions */}
          <div>
            <h4 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '16px' }}>Upcoming Sessions</h4>
            {upcomingSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <i className="bi bi-calendar-event" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '16px' }}></i>
                <h5 style={{ color: '#64748b', fontWeight: '600' }}>No upcoming sessions</h5>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Your teacher will schedule sessions for you</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingSessions.map(session => (
                  <div key={session.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: session.session_type === 'video_call' ? '#eff6ff' : '#f0fdf4' }}>
                        <i className={session.session_type === 'video_call' ? 'bi bi-camera-video' : 'bi bi-telephone'} style={{ fontSize: '20px', color: session.session_type === 'video_call' ? '#3b82f6' : '#22c55e' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{session.title}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                          with {session.teacher_name || 'Teacher'} • {formatDate(session.scheduled_date)} at {session.formatted_time || session.scheduled_time} • {session.duration_minutes} min
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: session.status === 'confirmed' ? '#f0fdf4' : '#fffbeb', color: session.status === 'confirmed' ? '#16a34a' : '#d97706' }}>
                        {session.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                      <button onClick={() => handleReportSession(session)} style={{ padding: '6px 10px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <i className="bi bi-flag"></i>
                      </button>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        in {getTimeUntil(session.scheduled_date, session.scheduled_time || session.formatted_time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
    </div>
    </div>
  );
};

export default StudentSessions;
