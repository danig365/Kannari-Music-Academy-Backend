import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';

const AudioMessages = () => {
  const studentId = localStorage.getItem('studentId');
  const baseUrl = API_BASE_URL;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/student/${studentId}/audio-messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching audio messages:', err);
    }
    setLoading(false);
  };

  const markAsRead = async (msgId) => {
    try {
      await axios.patch(`${baseUrl}/audio-message/${msgId}/read/`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m));
    } catch {}
  };

  const handlePlay = (msgId) => {
    setPlayingId(msgId);
    // Mark as read when played
    const msg = messages.find(m => m.id === msgId);
    if (msg && !msg.is_read) markAsRead(msgId);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  const handleReportAudioMessage = async (msg) => {
    const result = await Swal.fire({
      title: 'Report Audio Message',
      input: 'textarea',
      inputLabel: 'Describe the issue',
      inputPlaceholder: 'Enter details...',
      showCancelButton: true,
      inputValidator: (value) => (!value ? 'Description is required' : undefined)
    });

    const description = result?.isConfirmed ? result.value : null;
    if (!description) return;

    try {
      const payload = new FormData();
      payload.append('reporter_type', 'student');
      payload.append('reporter_id', studentId);
      payload.append('description', description);
      await axios.post(`${baseUrl}/audio-message/${msg.id}/report/`, payload);
      Swal.fire({ icon: 'success', title: 'Report submitted' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: error.response?.data?.message || 'Could not submit report.' });
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      {isMobile && sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', display: isMobile ? 'block' : 'none' }}>
            <i className="bi bi-list"></i>
          </button>
          <span style={{ fontWeight: '600', color: '#1e293b', marginLeft: '8px' }}>Kannari Music Academy</span>
        </div>
        <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Messages</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Audio messages from your teachers</p>
        </div>
        {unreadCount > 0 && (
          <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e' }}>
            {unreadCount} unread
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading messages...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <i className="bi bi-envelope-open" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '16px' }}></i>
          <h4 style={{ color: '#64748b', fontWeight: '600' }}>No messages yet</h4>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Your teachers will send you audio feedback here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map(msg => (
            <div key={msg.id}
              style={{
                backgroundColor: msg.is_read ? '#fff' : '#eff6ff',
                borderRadius: '12px',
                border: msg.is_read ? '1px solid #e2e8f0' : '1px solid #bfdbfe',
                padding: '20px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {msg.teacher_profile_img ? (
                    <img src={msg.teacher_profile_img} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                      {(msg.teacher_name || 'T').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {msg.teacher_name || 'Teacher'}
                      {!msg.is_read && <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'inline-block' }}></span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{timeAgo(msg.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {msg.duration_formatted} • {msg.file_size_formatted}
                </div>
              </div>

              <div style={{ fontWeight: '500', color: '#334155', marginBottom: '12px', fontSize: '15px' }}>
                {msg.title}
              </div>

              {msg.course_title && (
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  <i className="bi bi-book me-1"></i> {msg.course_title}
                </div>
              )}

              <audio
                controls
                src={msg.audio_file}
                onPlay={() => handlePlay(msg.id)}
                style={{ width: '100%', borderRadius: '8px', height: '40px' }}
              />

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleReportAudioMessage(msg)}
                  style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <i className="bi bi-flag me-1"></i> Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default AudioMessages;
