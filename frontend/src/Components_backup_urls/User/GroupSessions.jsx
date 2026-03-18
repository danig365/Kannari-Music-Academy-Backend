import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

const baseUrl = API_BASE_URL;

const STATUS_META = {
  scheduled: { label: 'Scheduled', color: '#3b82f6', icon: 'bi-calendar-event' },
  live:      { label: 'Live Now',  color: '#10b981', icon: 'bi-broadcast' },
  completed: { label: 'Completed', color: '#6b7280', icon: 'bi-check-circle' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: 'bi-x-circle' },
};

const GroupSessions = ({ groupId, studentId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchSessions();
    // Poll for live status updates
    const poll = setInterval(fetchSessions, 15000);
    return () => clearInterval(poll);
  }, [groupId]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/sessions/`);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const joinSession = async (session) => {
    setJoining(session.id);
    try {
      const res = await axios.post(`${baseUrl}/student/${studentId}/join-group-session/${session.id}/`);
      const data = res.data;
      // Open meeting link in new tab
      if (data.meeting_link || session.meeting_link) {
        window.open(data.meeting_link || session.meeting_link, '_blank');
      } else {
        Swal.fire({ icon: 'success', title: 'Joined!', text: 'You have joined the session.', timer: 2000 });
      }
      await fetchSessions();
    } catch (err) {
      Swal.fire({ icon: 'error', text: err.response?.data?.error || 'Failed to join session.' });
    }
    setJoining(null);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return '';
    // t is HH:MM:SS or HH:MM
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  };

  const filteredSessions = filter ? sessions.filter(s => s.status === filter) : sessions;
  const liveSessions = sessions.filter(s => s.status === 'live');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading sessions...</div>;

  return (
    <div>
      {/* Live sessions banner */}
      {liveSessions.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px' }}>
          <div style={{ fontWeight: '700', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
            Live Sessions
          </div>
          {liveSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{s.teacher_name} &bull; Started {s.started_at ? new Date(s.started_at).toLocaleTimeString() : 'Now'}</div>
              </div>
              <button
                onClick={() => joinSession(s)}
                disabled={joining === s.id}
                style={{ padding: '8px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                {joining === s.id ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('')}
          style={{ padding: '5px 14px', borderRadius: '20px', border: filter === '' ? '2px solid #6366f1' : '1px solid #e2e8f0', backgroundColor: filter === '' ? '#eef2ff' : '#fff', color: filter === '' ? '#4338ca' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
        >All ({sessions.length})</button>
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const count = sessions.filter(s => s.status === key).length;
          if (count === 0) return null;
          return (
            <button key={key}
              onClick={() => setFilter(filter === key ? '' : key)}
              style={{ padding: '5px 14px', borderRadius: '20px', border: filter === key ? `2px solid ${meta.color}` : '1px solid #e2e8f0', backgroundColor: filter === key ? `${meta.color}10` : '#fff', color: filter === key ? meta.color : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              <i className={`bi ${meta.icon} me-1`}></i>{meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
          <i className="bi bi-camera-video" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
          {sessions.length > 0 ? 'No sessions matching filter.' : 'No sessions scheduled yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {filteredSessions.map(session => {
            const meta = STATUS_META[session.status] || STATUS_META.scheduled;
            const isLive = session.status === 'live';
            const isScheduled = session.status === 'scheduled';
            const isPast = session.status === 'completed' || session.status === 'cancelled';

            return (
              <div key={session.id} style={{
                backgroundColor: '#fff', border: `1px solid ${isLive ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '12px', padding: '16px',
                borderLeft: `4px solid ${meta.color}`,
                opacity: isPast ? 0.7 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{session.title}</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 10px', borderRadius: '10px', fontSize: '11px',
                        fontWeight: '700', backgroundColor: `${meta.color}15`, color: meta.color,
                        textTransform: 'uppercase'
                      }}>
                        {isLive && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: meta.color }}></span>}
                        <i className={`bi ${meta.icon}`} style={{ fontSize: '10px' }}></i>
                        {meta.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span><i className="bi bi-calendar3 me-1"></i>{formatDate(session.scheduled_date)}</span>
                      <span><i className="bi bi-clock me-1"></i>{session.formatted_time ? formatTime(session.formatted_time) : formatTime(session.scheduled_time)}</span>
                      <span><i className="bi bi-hourglass-split me-1"></i>{session.duration_minutes} min</span>
                      {session.teacher_name && <span><i className="bi bi-person me-1"></i>{session.teacher_name}</span>}
                    </div>

                    {session.description && (
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>{session.description}</div>
                    )}

                    {session.actual_duration_minutes > 0 && isPast && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Actual duration: {session.actual_duration_minutes} min
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    {isLive && (
                      <button
                        onClick={() => joinSession(session)}
                        disabled={joining === session.id}
                        style={{ padding: '8px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>
                        {joining === session.id ? 'Joining...' : 'Join Session'}
                      </button>
                    )}
                    {isScheduled && session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '6px 14px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}
                      >
                        <i className="bi bi-link-45deg me-1"></i>Meeting Link
                      </a>
                    )}
                    {isPast && session.recording_url && (
                      <a
                        href={session.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '6px 14px', backgroundColor: '#f5f3ff', color: '#7c3aed', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}
                      >
                        <i className="bi bi-play-circle me-1"></i>Recording
                      </a>
                    )}
                  </div>
                </div>

                {session.has_minor_participants && (
                  <div style={{ marginTop: '8px', padding: '4px 10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '11px', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <i className="bi bi-shield-check"></i>Session includes minor participants — recording enabled
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupSessions;
