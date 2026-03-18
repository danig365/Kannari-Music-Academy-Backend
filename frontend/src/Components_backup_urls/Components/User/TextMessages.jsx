import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { getConversation, sendMessage, markMessagesRead, getUnreadMessageCount, getChatLockStatus } from '../../services/messagingService';
import Sidebar from './Sidebar';

const TextMessages = () => {
  const studentId = localStorage.getItem('studentId');
  const baseUrl = API_BASE_URL;

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [chatLock, setChatLock] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [minorBlocked, setMinorBlocked] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check minor access status
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`${baseUrl}/student/${studentId}/minor-access-status/`);
        if (res.ok) {
          const data = await res.json();
          if (data.is_minor && !data.can_send_messages) {
            setMinorBlocked(true);
          }
        }
      } catch {}
    };
    if (studentId) checkAccess();
  }, [studentId]);

  // Fetch parent links for this student to build conversation list
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/student/${studentId}/parent/status/`);
      const data = await res.json();
      // Build conversation list from parent link
      if (data.parent_link_id) {
        setConversations([{
          parent_link_id: data.parent_link_id,
          parent_id: data.parent_id,
          parent_name: data.parent_name || 'Parent',
          student_name: data.student_name || 'You',
          type: 'parent'
        }]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    setLoading(false);
  };

  const pollRef = useRef(null);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const res = await getConversation(conv.parent_link_id);
      setMessages(res.data.messages || []);
      setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
      // Fetch chat lock status
      try {
        const lockRes = await getChatLockStatus(conv.parent_link_id);
        setChatLock(lockRes.data);
      } catch (e) { /* ignore */ }
      // Mark messages as read
      await markMessagesRead(conv.parent_link_id, 'parent', studentId);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
    setTimeout(() => scrollToBottom(), 100);
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeConv) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await getConversation(activeConv.parent_link_id);
        const newMsgs = res.data.messages || [];
        setMessages(prev => {
          if (newMsgs.length !== prev.length) {
            setTimeout(() => scrollToBottom(), 100);
            return newMsgs;
          }
          return prev;
        });
        setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
        const lockRes = await getChatLockStatus(activeConv.parent_link_id);
        setChatLock(lockRes.data);
      } catch {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      await sendMessage({
        sender_type: 'parent',
        sender_id: activeConv.parent_id,
        recipient_type: 'teacher',
        content: newMessage.trim(),
        parent_link_id: activeConv.parent_link_id,
      });
      setNewMessage('');
      // Refresh messages
      const res = await getConversation(activeConv.parent_link_id);
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', display: isMobile ? 'block' : 'none' }}>
            <i className="bi bi-list"></i>
          </button>
          <span style={{ fontWeight: '600', color: '#1e293b', marginLeft: '8px' }}>Kannari Music Academy</span>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Minor Blocked Banner */}
          {minorBlocked && (
            <div style={{
              position: 'absolute', top: '56px', left: 0, right: 0, zIndex: 50,
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <i className="bi bi-shield-lock-fill" style={{ fontSize: '20px', color: '#f59e0b' }}></i>
              <div>
                <span style={{ fontWeight: '700', color: '#92400e', fontSize: '13px' }}>Parent Approval Required — </span>
                <span style={{ fontSize: '13px', color: '#78350f' }}>
                  Text messaging is restricted until your parent/guardian approves. Visit the <a href="/parent-login" style={{ color: '#7c3aed', fontWeight: '600' }}>Parent Portal</a>.
                </span>
              </div>
            </div>
          )}

          {/* Conversation list (left panel) */}
          <div style={{ width: isMobile && activeConv ? '0' : (isMobile ? '100%' : '300px'), borderRight: '1px solid #e2e8f0', backgroundColor: '#fff', overflow: 'auto', transition: 'width 0.3s', flexShrink: 0 }}>
            <div style={{ padding: '20px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '700', fontSize: '18px' }}>
                <i className="bi bi-chat-dots me-2"></i>Text Messages
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Conversations with parents & teachers</p>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <i className="bi bi-chat-left-text" style={{ fontSize: '40px', color: '#cbd5e1' }}></i>
                <p style={{ color: '#64748b', marginTop: '12px', fontSize: '14px' }}>No conversations yet</p>
                <p style={{ color: '#94a3b8', fontSize: '12px' }}>Link a parent account to start messaging</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.parent_link_id}
                  onClick={() => openConversation(conv)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    backgroundColor: activeConv?.parent_link_id === conv.parent_link_id ? '#eff6ff' : '#fff',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', backgroundColor: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}>
                      {conv.parent_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{conv.parent_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Parent conversation</div>
                    </div>
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
                <p style={{ color: '#64748b', marginTop: '16px', fontSize: '16px' }}>Select a conversation to start messaging</p>
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
                  <div style={{ width: '36px', height: '36px', backgroundColor: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' }}>
                    {activeConv.parent_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{activeConv.parent_name}</div>
                    <div style={{ fontSize: '11px', color: chatStatus.allowed ? '#10b981' : '#ef4444' }}>
                      {chatStatus.allowed ? 'Chat available' : chatStatus.reason}
                    </div>
                  </div>
                  {/* Chat lock indicator */}
                  {chatLock && (
                    <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                      backgroundColor: !chatLock.chat_allowed ? '#fef3c7' : '#d1fae5',
                      color: !chatLock.chat_allowed ? '#92400e' : '#065f46' }}>
                      <i className={`bi ${!chatLock.chat_allowed ? 'bi-lock-fill' : 'bi-unlock'} me-1`}></i>
                      {!chatLock.chat_allowed ? 'Locked' : 'Open'}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMine = msg.sender_type === 'parent' && String(msg.sender_parent) === String(activeConv.parent_id);
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
      </div>
    </div>
  );
};

export default TextMessages;
