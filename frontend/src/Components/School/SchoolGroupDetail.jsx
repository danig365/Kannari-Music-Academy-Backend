import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

const SchoolGroupDetail = ({ groupId, onBack }) => {
  const schoolId = localStorage.getItem('schoolId');
  const baseUrl = API_BASE_URL;

  const [activeTab, setActiveTab] = useState('chat');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' });

  // Resources state
  const [resources, setResources] = useState([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', file: null, link_url: '' });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', description: '', session_type: 'practice', scheduled_start: '', scheduled_end: '', max_participants: 20 });

  useEffect(() => {
    fetchGroupDetail();
  }, [groupId]);

  // Assignments state
  const [groupAssignments, setGroupAssignments] = useState([]);

  useEffect(() => {
    if (activeTab === 'chat') fetchMessages();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'resources') fetchResources();
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'assignments') fetchGroupAssignments();
  }, [activeTab, groupId]);

  const fetchGroupDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/group-class/${groupId}/`);
      setGroup(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Chat functions
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/messages/`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); }
  };

  const sendGroupMessage = async () => {
    if (!newMsg.trim()) return;
    setSendingMsg(true);
    try {
      await axios.post(`${baseUrl}/group/${groupId}/messages/`, {
        sender_type: 'school', sender_id: schoolId, content: newMsg.trim()
      });
      setNewMsg('');
      await fetchMessages();
    } catch (err) { Swal.fire({ icon: 'error', text: 'Failed to send message' }); }
    setSendingMsg(false);
  };

  const togglePin = async (msgId) => {
    try {
      await axios.post(`${baseUrl}/group-message/${msgId}/toggle-pin/`);
      await fetchMessages();
    } catch (err) { console.error(err); }
  };

  // Announcement functions
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/announcements/`);
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const saveAnnouncement = async () => {
    if (!announcementForm.title.trim()) return;
    try {
      await axios.post(`${baseUrl}/group/${groupId}/announcements/`, {
        ...announcementForm, author_type: 'school', author_id: schoolId
      });
      Swal.fire({ icon: 'success', title: 'Announcement posted!', timer: 1500 });
      setShowAnnouncementForm(false);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      await fetchAnnouncements();
    } catch (err) { Swal.fire({ icon: 'error', text: 'Failed to post announcement' }); }
  };

  // Resource functions
  const fetchResources = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/resources/`);
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const saveResource = async () => {
    if (!resourceForm.title.trim()) return;
    const fd = new FormData();
    fd.append('title', resourceForm.title);
    fd.append('description', resourceForm.description);
    if (resourceForm.file) fd.append('file', resourceForm.file);
    if (resourceForm.link_url) fd.append('link_url', resourceForm.link_url);
    fd.append('uploaded_by_type', 'school');
    fd.append('uploaded_by_id', schoolId);
    try {
      await axios.post(`${baseUrl}/group/${groupId}/resources/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      Swal.fire({ icon: 'success', title: 'Resource added!', timer: 1500 });
      setShowResourceForm(false);
      setResourceForm({ title: '', description: '', file: null, link_url: '' });
      await fetchResources();
    } catch (err) { Swal.fire({ icon: 'error', text: 'Failed to add resource' }); }
  };

  // Session functions
  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/sessions/`);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const saveSession = async () => {
    if (!sessionForm.title.trim() || !sessionForm.scheduled_start) return;
    try {
      await axios.post(`${baseUrl}/group/${groupId}/sessions/`, {
        ...sessionForm, created_by_type: 'school', created_by_id: schoolId
      });
      Swal.fire({ icon: 'success', title: 'Session scheduled!', timer: 1500 });
      setShowSessionForm(false);
      setSessionForm({ title: '', description: '', session_type: 'practice', scheduled_start: '', scheduled_end: '', max_participants: 20 });
      await fetchSessions();
    } catch (err) { Swal.fire({ icon: 'error', text: 'Failed to create session' }); }
  };

  const goLiveSession = async (sessionId) => {
    try {
      await axios.post(`${baseUrl}/group-session/${sessionId}/go-live/`);
      Swal.fire({ icon: 'success', title: 'Session is now live!', timer: 1500 });
      await fetchSessions();
    } catch (err) { Swal.fire({ icon: 'error', text: err.response?.data?.error || 'Failed' }); }
  };

  const endSession = async (sessionId) => {
    try {
      await axios.post(`${baseUrl}/group-session/${sessionId}/end/`);
      await fetchSessions();
    } catch (err) { console.error(err); }
  };

  // Assignment functions
  const fetchGroupAssignments = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/assignments/`);
      setGroupAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { key: 'chat', icon: 'bi-chat-dots', label: 'Chat' },
    { key: 'announcements', icon: 'bi-megaphone', label: 'Announcements' },
    { key: 'resources', icon: 'bi-folder2-open', label: 'Resources' },
    { key: 'sessions', icon: 'bi-camera-video', label: 'Sessions' },
    { key: 'assignments', icon: 'bi-journal-check', label: 'Assignments' },
  ];

  const priorityColors = { urgent: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#6b7280' };

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h4 style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{group?.title || 'Group'}</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{group?.student_count || 0} students • {group?.teacher_name}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: activeTab === t.key ? '#fff' : 'transparent',
              color: activeTab === t.key ? '#1e293b' : '#64748b',
              boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}>
            <i className={`bi ${t.icon} me-1`}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '500px' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>No messages yet</div>
            ) : messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: '10px', padding: '8px', borderRadius: '8px', backgroundColor: msg.is_pinned ? '#fefce8' : 'transparent' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: msg.sender_type === 'teacher' ? '#6366f1' : msg.sender_type === 'student' ? '#3b82f6' : msg.sender_type === 'parent' ? '#f59e0b' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '600', flexShrink: 0, overflow: 'hidden' }}>
                  {msg.sender_profile_img ? <img src={msg.sender_profile_img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (msg.sender_name_display || msg.sender_name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{msg.sender_name_display || msg.sender_name}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', padding: '1px 6px', borderRadius: '8px', backgroundColor: '#f8fafc', textTransform: 'capitalize' }}>{msg.sender_type}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{timeAgo(msg.created_at)}</span>
                    {msg.is_pinned && <i className="bi bi-pin-fill" style={{ color: '#f59e0b', fontSize: '12px' }}></i>}
                  </div>
                  <div style={{ fontSize: '14px', color: '#334155', marginTop: '2px' }}>{msg.content}</div>
                </div>
                <button onClick={() => togglePin(msg.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: '4px' }} title={msg.is_pinned ? 'Unpin' : 'Pin'}>
                  <i className={`bi ${msg.is_pinned ? 'bi-pin-fill' : 'bi-pin'}`}></i>
                </button>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
              placeholder="Type a message..." style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '14px', outline: 'none' }} />
            <button onClick={sendGroupMessage} disabled={!newMsg.trim() || sendingMsg}
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', backgroundColor: newMsg.trim() ? '#6366f1' : '#e2e8f0', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              style={{ padding: '8px 16px', backgroundColor: showAnnouncementForm ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              <i className={`bi ${showAnnouncementForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>{showAnnouncementForm ? 'Cancel' : 'New'}
            </button>
          </div>

          {showAnnouncementForm && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div className="row g-3">
                <div className="col-md-8">
                  <input type="text" className="form-control" placeholder="Announcement title" value={announcementForm.title} onChange={(e) => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={announcementForm.priority} onChange={(e) => setAnnouncementForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="col-12">
                  <textarea className="form-control" rows={3} placeholder="Announcement content..." value={announcementForm.content} onChange={(e) => setAnnouncementForm(p => ({ ...p, content: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button onClick={saveAnnouncement} className="btn btn-primary btn-sm">Post Announcement</button>
              </div>
            </div>
          )}

          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#64748b' }}>No announcements yet</div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {announcements.map(a => (
                <div key={a.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${priorityColors[a.priority] || '#3b82f6'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h6 style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{a.title}</h6>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: priorityColors[a.priority], textTransform: 'uppercase' }}>{a.priority}</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#475569' }}>{a.content}</p>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>{a.author_name || 'School'} • {timeAgo(a.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={() => setShowResourceForm(!showResourceForm)}
              style={{ padding: '8px 16px', backgroundColor: showResourceForm ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              <i className={`bi ${showResourceForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>{showResourceForm ? 'Cancel' : 'Add Resource'}
            </button>
          </div>

          {showResourceForm && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div className="row g-3">
                <div className="col-md-6"><input type="text" className="form-control" placeholder="Title" value={resourceForm.title} onChange={(e) => setResourceForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="col-md-6"><input type="url" className="form-control" placeholder="Link URL (optional)" value={resourceForm.link_url} onChange={(e) => setResourceForm(p => ({ ...p, link_url: e.target.value }))} /></div>
                <div className="col-md-6"><input type="file" className="form-control" onChange={(e) => setResourceForm(p => ({ ...p, file: e.target.files?.[0] }))} /></div>
                <div className="col-md-6"><input type="text" className="form-control" placeholder="Description" value={resourceForm.description} onChange={(e) => setResourceForm(p => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right' }}><button onClick={saveResource} className="btn btn-primary btn-sm">Upload Resource</button></div>
            </div>
          )}

          {resources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#64748b' }}>No resources yet</div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {resources.map(r => (
                <div key={r.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${r.file ? 'bi-file-earmark' : 'bi-link-45deg'}`} style={{ fontSize: '18px', color: '#3b82f6' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{r.title}</div>
                    {r.description && <div style={{ fontSize: '12px', color: '#64748b' }}>{r.description}</div>}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{r.teacher_name || 'School'} • {timeAgo(r.created_at)}</div>
                  </div>
                  {(r.file || r.link_url) && (
                    <a href={r.file || r.link_url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', backgroundColor: '#eff6ff', borderRadius: '6px', color: '#2563eb', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>
                      {r.file ? 'Download' : 'Open'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={() => setShowSessionForm(!showSessionForm)}
              style={{ padding: '8px 16px', backgroundColor: showSessionForm ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              <i className={`bi ${showSessionForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>{showSessionForm ? 'Cancel' : 'Schedule Session'}
            </button>
          </div>

          {showSessionForm && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div className="row g-3">
                <div className="col-md-6"><input type="text" className="form-control" placeholder="Session title" value={sessionForm.title} onChange={(e) => setSessionForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="col-md-3">
                  <select className="form-select" value={sessionForm.session_type} onChange={(e) => setSessionForm(p => ({ ...p, session_type: e.target.value }))}>
                    <option value="practice">Practice</option>
                    <option value="masterclass">Masterclass</option>
                    <option value="recital">Recital</option>
                    <option value="workshop">Workshop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-3"><input type="number" className="form-control" placeholder="Max participants" value={sessionForm.max_participants} onChange={(e) => setSessionForm(p => ({ ...p, max_participants: e.target.value }))} /></div>
                <div className="col-md-6"><label className="form-label" style={{ fontSize: '12px' }}>Start</label><input type="datetime-local" className="form-control" value={sessionForm.scheduled_start} onChange={(e) => setSessionForm(p => ({ ...p, scheduled_start: e.target.value }))} /></div>
                <div className="col-md-6"><label className="form-label" style={{ fontSize: '12px' }}>End</label><input type="datetime-local" className="form-control" value={sessionForm.scheduled_end} onChange={(e) => setSessionForm(p => ({ ...p, scheduled_end: e.target.value }))} /></div>
                <div className="col-12"><textarea className="form-control" rows={2} placeholder="Description" value={sessionForm.description} onChange={(e) => setSessionForm(p => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right' }}><button onClick={saveSession} className="btn btn-primary btn-sm">Create Session</button></div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#64748b' }}>No sessions scheduled</div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {sessions.map(s => {
                const statusColors = { scheduled: '#3b82f6', live: '#10b981', completed: '#6b7280', cancelled: '#ef4444' };
                return (
                  <div key={s.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{s.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {s.session_type === 'video_call' ? 'Video Call' : s.session_type === 'audio_call' ? 'Audio Call' : s.session_type} • {s.scheduled_date && new Date(s.scheduled_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {s.formatted_time || s.scheduled_time || ''}
                          {s.duration_minutes && ` • ${s.duration_minutes} min`}
                          {s.teacher_name && ` • ${s.teacher_name}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: (statusColors[s.status] || '#6b7280') + '15', color: statusColors[s.status] || '#6b7280', textTransform: 'uppercase' }}>
                          {s.status === 'live' && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '4px', animation: 'pulse 1.5s infinite' }}></span>}
                          {s.status}
                        </span>
                        {s.status === 'scheduled' && (
                          <button onClick={() => goLiveSession(s.id)} style={{ padding: '4px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            Go Live
                          </button>
                        )}
                        {s.status === 'live' && (
                          <button onClick={() => endSession(s.id)} style={{ padding: '4px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            End
                          </button>
                        )}
                      </div>
                    </div>
                    {s.description && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569' }}>{s.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div>
          {groupAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
              <i className="bi bi-journal-check" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
              No group assignments yet. Create assignments from the main Assignments page.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {groupAssignments.map(a => {
                const typeColors = { audio: '#8b5cf6', video: '#ec4899', file_upload: '#f59e0b', discussion: '#06b6d4', multiple_choice: '#3b82f6' };
                const statusColors = { assigned: '#3b82f6', submitted: '#f59e0b', late: '#ef4444', graded: '#10b981' };
                return (
                  <div key={a.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${typeColors[a.submission_type] || '#6366f1'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{a.display_title || a.title || a.lesson_title || 'Assignment'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {a.submission_type_display || a.submission_type} &bull; Due: {a.due_date || 'No due date'} &bull; Max: {a.max_points} pts
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: (statusColors[a.status] || '#6b7280') + '15', color: statusColors[a.status] || '#6b7280' }}>
                          {a.status || 'assigned'}
                        </span>
                        {a.submission_count !== undefined && (
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569' }}>
                            {a.submission_count} submissions
                          </span>
                        )}
                      </div>
                    </div>
                    {a.description && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569' }}>{a.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchoolGroupDetail;
