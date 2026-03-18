import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioRecorder from './AudioRecorder';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

const TeacherAudioMessages = () => {
  const teacherId = localStorage.getItem('teacherId');
  const baseUrl = API_BASE_URL;

  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [filter, setFilter] = useState('all'); // all, read, unread

  useEffect(() => {
    fetchMessages();
    fetchStudents();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/audio-messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`);
      setStudents(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      try {
        const enrollRes = await axios.get(`${baseUrl}/fetch-all-enrolled-students/${teacherId}`);
        const enrolled = Array.isArray(enrollRes.data) ? enrollRes.data : enrollRes.data.results || [];
        const unique = [];
        const seen = new Set();
        enrolled.forEach(e => {
          const s = e.student || e;
          if (s.id && !seen.has(s.id)) { seen.add(s.id); unique.push(s); }
        });
        setStudents(unique);
      } catch { setStudents([]); }
    }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Delete this audio message?')) return;
    try {
      await axios.delete(`${baseUrl}/audio-message/${msgId}/`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const reportAudioMessage = async (msg) => {
    const result = await Swal.fire({
      title: 'Report Audio Message',
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
      await axios.post(`${baseUrl}/audio-message/${msg.id}/report/`, payload);
      Swal.fire({ icon: 'success', title: 'Safety report submitted' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Could not submit safety report.'
      });
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'read') return m.is_read;
    if (filter === 'unread') return !m.is_read;
    return true;
  });

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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Audio Messages</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Record and send audio feedback to your students</p>
        </div>
        <button
          onClick={() => setShowRecorder(!showRecorder)}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            backgroundColor: showRecorder ? '#f1f5f9' : '#3b82f6', color: showRecorder ? '#64748b' : '#fff'
          }}
        >
          <i className={`bi ${showRecorder ? 'bi-x-lg' : 'bi-mic'} me-2`}></i>
          {showRecorder ? 'Close Recorder' : 'New Message'}
        </button>
      </div>

      {/* Recorder Panel */}
      {showRecorder && (
        <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <AudioRecorder
            teacherId={teacherId}
            students={students}
            onMessageSent={() => { fetchMessages(); setShowRecorder(false); }}
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: 'All', count: messages.length },
          { key: 'unread', label: 'Unread', count: messages.filter(m => !m.is_read).length },
          { key: 'read', label: 'Read', count: messages.filter(m => m.is_read).length }
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              backgroundColor: filter === tab.key ? '#1e293b' : '#f1f5f9',
              color: filter === tab.key ? '#fff' : '#64748b'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Messages List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading messages...</div>
      ) : filteredMessages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <i className="bi bi-mic" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '16px' }}></i>
          <h4 style={{ color: '#64748b', fontWeight: '600' }}>No messages yet</h4>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Click "New Message" to record your first audio message</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredMessages.map(msg => (
            <div key={msg.id} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {msg.student_profile_img ? (
                    <img src={msg.student_profile_img} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', backgroundColor: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                      {(msg.student_name || 'S').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>To: {msg.student_name || 'Student'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{timeAgo(msg.created_at)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                    backgroundColor: msg.is_read ? '#dcfce7' : '#fef3c7',
                    color: msg.is_read ? '#166534' : '#92400e'
                  }}>
                    {msg.is_read ? 'Read' : 'Unread'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{msg.duration_formatted}</span>
                  <button onClick={() => deleteMessage(msg.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', padding: '4px' }}
                    title="Delete"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                  <button onClick={() => reportAudioMessage(msg)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px', padding: '4px' }}
                    title="Report"
                  >
                    <i className="bi bi-flag"></i>
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: '500', color: '#334155', marginBottom: '8px', fontSize: '14px' }}>{msg.title}</div>
              {msg.course_title && (
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  <i className="bi bi-book me-1"></i> {msg.course_title}
                </div>
              )}
              <audio controls src={msg.audio_file} style={{ width: '100%', height: '36px' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherAudioMessages;
