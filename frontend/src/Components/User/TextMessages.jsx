import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { getDirectConversation, sendMessage, markDirectMessagesRead, getStudentTeacherConversations } from '../../services/messagingService';
import Sidebar from './Sidebar';
import './EnhancedDashboard.css';

const TextMessages = () => {
  const studentId = localStorage.getItem('studentId');
  const baseUrl = API_BASE_URL;

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [accessError, setAccessError] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check access: only 18+ students allowed
  useEffect(() => {
    const checkAccessAndFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/student/${studentId}/minor-access-status/`);
        if (res.ok) {
          const data = await res.json();
          if (data.is_minor) {
            setAccessError('Direct teacher messaging is only available for students 18 and older.');
            setLoading(false);
            return;
          }
        }
      } catch {
        // continue if endpoint unavailable
      }
      await fetchConversations();
    };
    if (studentId) checkAccessAndFetch();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [studentId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await getStudentTeacherConversations(studentId);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      if (err.response?.status === 403) {
        setAccessError(err.response.data.error || 'Access denied');
      }
    }
    setLoading(false);
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setChatStatus({ allowed: true, reason: '' });

    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const res = await getDirectConversation(conv.teacher_student_id);
      setMessages(res.data.messages || []);
      setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
      await markDirectMessagesRead(conv.teacher_student_id, 'student', studentId);
    } catch (err) {
      console.error('Error loading conversation:', err);
      if (err.response?.data?.error) {
        setChatStatus({ allowed: false, reason: err.response.data.error });
      }
    }

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await getDirectConversation(conv.teacher_student_id);
        setMessages(prev => {
          const newMsgs = res.data.messages || [];
          if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
            setTimeout(() => scrollToBottom(), 100);
            markDirectMessagesRead(conv.teacher_student_id, 'student', studentId).catch(() => {});
            return newMsgs;
          }
          return prev;
        });
      } catch {}
    }, 5000);

    setTimeout(() => scrollToBottom(), 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      await sendMessage({
        sender_type: 'student',
        sender_id: studentId,
        recipient_type: 'teacher',
        recipient_id: activeConv.teacher_id,
        content: newMessage.trim(),
        teacher_student_id: activeConv.teacher_student_id,
      });
      setNewMessage('');
      const res = await getDirectConversation(activeConv.teacher_student_id);
      setMessages(res.data.messages || []);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send message';
      alert(errMsg);
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh', marginLeft: isMobile ? 0 : '250px' }}>
        <div className="mobile-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <i className="bi bi-list"></i>
          </button>
          <div className="logo-mini">Kannari Music Academy</div>
        </div>

        {/* Access denied banner for minors */}
        {accessError ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px' }}>
            <i className="bi bi-shield-lock-fill" style={{ fontSize: '56px', color: '#f59e0b' }}></i>
            <p style={{ color: '#92400e', marginTop: '16px', fontSize: '16px', fontWeight: '600', textAlign: 'center' }}>{accessError}</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Teacher conversation list (left panel) */}
            <div style={{ width: isMobile && activeConv ? '0' : (isMobile ? '100%' : '300px'), borderRight: '1px solid #e2e8f0', backgroundColor: '#fff', overflow: 'auto', transition: 'width 0.3s', flexShrink: 0 }}>
              <div style={{ padding: '20px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '700', fontSize: '18px' }}>
                  <i className="bi bi-chat-dots me-2"></i>Text Messages
                </h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Chat with your teachers</p>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <i className="bi bi-chat-left-text" style={{ fontSize: '40px', color: '#cbd5e1' }}></i>
                  <p style={{ color: '#64748b', marginTop: '12px', fontSize: '14px' }}>No teacher conversations</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px' }}>You'll see your teachers here once assigned</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.teacher_student_id}
                    onClick={() => openConversation(conv)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: activeConv?.teacher_student_id === conv.teacher_student_id ? '#eff6ff' : '#fff',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {conv.teacher_profile_img ? (
                        <img src={conv.teacher_profile_img} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}>
                          {conv.teacher_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{conv.teacher_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Teacher</div>
                      </div>
                      {conv.unread_count > 0 && (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat area (right panel) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
              {!activeConv ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <i className="bi bi-chat-square-text" style={{ fontSize: '64px', color: '#cbd5e1' }}></i>
                  <p style={{ color: '#64748b', marginTop: '16px', fontSize: '16px' }}>Select a teacher to start messaging</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isMobile && (
                      <button onClick={() => setActiveConv(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>
                        <i className="bi bi-arrow-left"></i>
                      </button>
                    )}
                    {activeConv.teacher_profile_img ? (
                      <img src={activeConv.teacher_profile_img} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' }}>
                        {activeConv.teacher_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{activeConv.teacher_name}</div>
                      <div style={{ fontSize: '11px', color: chatStatus.allowed ? '#10b981' : '#ef4444' }}>
                        {chatStatus.allowed ? 'Chat available' : chatStatus.reason}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>
                        No messages yet — start the conversation!
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMine = msg.sender_type === 'student' && String(msg.sender_student) === String(studentId);
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '70%',
                              padding: '10px 14px',
                              borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              backgroundColor: isMine ? '#3b82f6' : '#fff',
                              color: isMine ? '#fff' : '#1e293b',
                              fontSize: '14px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              border: isMine ? 'none' : '1px solid #e2e8f0'
                            }}>
                              {!isMine && (
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                                  {msg.sender_display}
                                </div>
                              )}
                              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                              <div style={{ fontSize: '10px', color: isMine ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                                {timeAgo(msg.created_at)}
                                {isMine && msg.is_read && <span style={{ marginLeft: '6px' }}>✓✓</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  {!chatStatus.allowed ? (
                    <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fef2f2', textAlign: 'center' }}>
                      <i className="bi bi-lock me-2" style={{ color: '#ef4444' }}></i>
                      <span style={{ color: '#dc2626', fontSize: '14px' }}>{chatStatus.reason}</span>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        style={{
                          flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px',
                          fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit',
                          maxHeight: '100px', overflow: 'auto'
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                          backgroundColor: newMessage.trim() ? '#3b82f6' : '#e2e8f0',
                          color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', flexShrink: 0
                        }}
                      >
                        <i className="bi bi-send-fill"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextMessages;
