import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, JITSI_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

const TeacherSessions = () => {
  const teacherId = localStorage.getItem('teacherId');
  const baseUrl = API_BASE_URL;

  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showVideoRoom, setShowVideoRoom] = useState(null);

  const [formData, setFormData] = useState({
    student: '',
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    session_type: 'video_call',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchSessions();
    fetchStudents();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/sessions/${teacherId}/`);
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`);
      setStudents(res.data);
    } catch {
      try {
        const res = await axios.get(`${baseUrl}/teacher/students-from-enrollments/${teacherId}/`);
        if (res.data?.students) setStudents(res.data.students);
      } catch {}
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${baseUrl}/teacher/sessions/${teacherId}/`, {
        ...formData,
        teacher: teacherId
      });
      setShowModal(false);
      setFormData({ student: '', title: '', description: '', scheduled_date: '', scheduled_time: '', duration_minutes: 60, session_type: 'video_call', status: 'confirmed' });
      fetchSessions();
      Swal.fire({ icon: 'success', title: 'Session Scheduled', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Failed to create session' });
    }
  };

  const handleGoLive = async (session) => {
    try {
      const res = await axios.post(`${baseUrl}/session/${session.id}/go-live/`);
      if (res.data.bool) {
        setShowVideoRoom({ ...session, room_name: res.data.room_name, meeting_link: res.data.meeting_link });
        fetchSessions();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || err.response?.data?.message || 'Failed to start session' });
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await axios.post(`${baseUrl}/session/${sessionId}/end/`);
      setShowVideoRoom(null);
      fetchSessions();
      Swal.fire({ icon: 'success', title: 'Session Ended', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to end session' });
    }
  };

  const handleCancel = async (session) => {
    const result = await Swal.fire({ title: 'Cancel Session?', text: 'This will notify the student.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, cancel it' });
    if (result.isConfirmed) {
      try {
        await axios.put(`${baseUrl}/teacher/session/${session.id}/`, { ...session, student: session.student?.id || session.student, teacher: teacherId, status: 'cancelled' });
        fetchSessions();
      } catch {}
    }
  };

  const handleUpdateRecording = async (session, recordingEnabled) => {
    try {
      const payload = new FormData();
      payload.append('requester_teacher_id', teacherId);
      payload.append('recording_enabled', recordingEnabled ? 'true' : 'false');
      await axios.post(`${baseUrl}/session/${session.id}/recording/update/`, payload);
      fetchSessions();
      Swal.fire({
        icon: 'success',
        title: recordingEnabled ? 'Recording enabled' : 'Recording disabled',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update failed',
        text: error.response?.data?.message || 'Could not update recording settings.',
      });
    }
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
      payload.append('reporter_type', 'teacher');
      payload.append('reporter_id', teacherId);
      payload.append('description', result.value);
      await axios.post(`${baseUrl}/session/${session.id}/report/`, payload);
      Swal.fire({ icon: 'success', title: 'Safety report submitted' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Could not submit safety report.',
      });
    }
  };

  const now = new Date();
  const upcoming = sessions.filter(s => s.status !== 'cancelled' && s.status !== 'completed' && new Date(s.scheduled_date + 'T' + s.scheduled_time) >= now);
  const past = sessions.filter(s => s.status === 'completed' || new Date(s.scheduled_date + 'T' + s.scheduled_time) < now);
  const cancelled = sessions.filter(s => s.status === 'cancelled');

  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled;

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ============= VIDEO ROOM (Jitsi embed) =============
  if (showVideoRoom) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
        {/* Video room header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
            <span style={{ color: '#fff', fontWeight: '600' }}>LIVE</span>
            <span style={{ color: '#94a3b8' }}>— {showVideoRoom.title}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
              with {showVideoRoom.student_name || 'Student'}
            </span>
            <button onClick={() => handleEndSession(showVideoRoom.id)} style={{ padding: '8px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              End Session
            </button>
          </div>
        </div>
        {/* Jitsi iframe */}
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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Sessions</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Schedule and manage live video sessions with your students</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <i className="bi bi-plus-lg"></i> Schedule Session
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
        {[
          { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { key: 'past', label: 'Past', count: past.length },
          { key: 'cancelled', label: 'Cancelled', count: cancelled.length }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: '500', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === tab.key ? '#fff' : 'transparent', color: activeTab === tab.key ? '#1e293b' : '#64748b', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading sessions...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <i className="bi bi-camera-video" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '16px' }}></i>
          <h4 style={{ color: '#64748b', fontWeight: '600' }}>No {activeTab} sessions</h4>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {activeTab === 'upcoming' ? 'Schedule a new session to get started' : 'Sessions will appear here once completed'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayed.map(session => (
            <div key={session.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s', cursor: 'default' }}
                 onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                 onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: session.is_live ? '#fef2f2' : session.session_type === 'video_call' ? '#eff6ff' : '#f0fdf4' }}>
                  <i className={session.is_live ? 'bi bi-broadcast' : session.session_type === 'video_call' ? 'bi bi-camera-video' : session.session_type === 'audio_call' ? 'bi bi-telephone' : 'bi bi-person'} style={{ fontSize: '20px', color: session.is_live ? '#ef4444' : session.session_type === 'video_call' ? '#3b82f6' : '#22c55e' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {session.title}
                    {session.is_live && <span style={{ fontSize: '11px', backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>LIVE</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    with {session.student_name || 'Student'} • {formatDate(session.scheduled_date)} at {session.formatted_time || session.scheduled_time} • {session.duration_minutes} min
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {session.is_live ? (
                  <>
                    <button onClick={() => setShowVideoRoom(session)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                      <i className="bi bi-box-arrow-up-right me-1"></i> Rejoin
                    </button>
                    <button onClick={() => handleEndSession(session.id)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                      End
                    </button>
                    <button onClick={() => handleReportSession(session)} style={{ padding: '8px 12px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                      <i className="bi bi-flag"></i>
                    </button>
                  </>
                ) : session.status === 'confirmed' || session.status === 'pending' ? (
                  <>
                    <button onClick={() => handleGoLive(session)} style={{ padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="bi bi-broadcast"></i> Go Live
                    </button>
                    <button onClick={() => handleCancel(session)} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={() => handleUpdateRecording(session, !session.recording_enabled)} style={{ padding: '8px 12px', backgroundColor: '#fff', color: session.recording_enabled ? '#d97706' : '#16a34a', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                      <i className={`bi ${session.recording_enabled ? 'bi-stop-circle' : 'bi-record-circle'}`}></i>
                    </button>
                    <button onClick={() => handleReportSession(session)} style={{ padding: '8px 12px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                      <i className="bi bi-flag"></i>
                    </button>
                  </>
                ) : (
                  <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    backgroundColor: session.status === 'completed' ? '#f0fdf4' : '#fef2f2',
                    color: session.status === 'completed' ? '#16a34a' : '#ef4444'
                  }}>
                    {session.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>Schedule Session</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Student</label>
                <select value={formData.student} onChange={e => setFormData({ ...formData, student: e.target.value })} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id || s.student?.id} value={s.student?.id || s.id}>
                      {s.student?.fullname || s.fullname || s.student_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g., Piano Lesson #5" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}/>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Session notes or agenda..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Date</label>
                  <input type="date" value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Time</label>
                  <input type="time" value={formData.scheduled_time} onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Duration (minutes)</label>
                  <select value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                    {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Type</label>
                  <select value={formData.session_type} onChange={e => setFormData({ ...formData, session_type: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}>
                    <option value="video_call">Video Call</option>
                    <option value="audio_call">Audio Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                Schedule Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSessions;
