import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { getConversation, sendMessage, markMessagesRead, getChatLockStatus } from '../../services/messagingService';

const ParentMessages = () => {
  const parentId = localStorage.getItem('parentId');
  const parentName = localStorage.getItem('parentName') || 'Parent';
  const baseUrl = API_BASE_URL;

  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [chatLock, setChatLock] = useState(null);
  const [parentLinkId, setParentLinkId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    document.title = 'Messages — Kannari Music Academy';
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (parentId) fetchChildren();
  }, [parentId]);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/parent/${parentId}/children/`);
      if (res.ok) {
        const data = await res.json();
        setChildren(Array.isArray(data) ? data : data.children || []);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    }
    setLoading(false);
  };

  const openChildChat = async (child) => {
    setActiveChild(child);
    setMessages([]);
    setChatStatus({ allowed: true, reason: '' });
    setChatLock(null);
    setParentLinkId(null);

    // Clear any existing poll
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      // Get parent link for this child
      const linkId = child.parent_link_id || child.link_id;
      if (linkId) {
        setParentLinkId(linkId);
        await loadMessages(linkId);
        await loadChatLock(linkId);

        // Poll for new messages every 5s
        pollRef.current = setInterval(async () => {
          try {
            const res = await getConversation(linkId);
            const newMsgs = res.data.messages || [];
            setMessages(prev => {
              if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                markMessagesRead(linkId, 'parent', parentId).catch(() => {});
                return newMsgs;
              }
              return prev;
            });
            setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
          } catch (e) { /* silent */ }
        }, 5000);
      } else {
        setChatStatus({ allowed: false, reason: 'No link found for this child' });
      }
    } catch (err) {
      console.error('Error opening chat:', err);
    }
  };

  const loadMessages = async (linkId) => {
    try {
      const res = await getConversation(linkId);
      setMessages(res.data.messages || []);
      setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
      await markMessagesRead(linkId, 'parent', parentId);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const loadChatLock = async (linkId) => {
    try {
      const res = await getChatLockStatus(linkId);
      setChatLock(res.data);
    } catch (err) { /* ignore */ }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !parentLinkId) return;
    setSending(true);
    try {
      await sendMessage({
        sender_type: 'parent',
        sender_id: parentId,
        recipient_type: 'teacher',
        content: newMessage.trim(),
        parent_link_id: parentLinkId,
      });
      setNewMessage('');
      await loadMessages(parentLinkId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const timeAgo = (dateStr) => {
    const now = new Date(); const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatLockCountdown = () => {
    if (!chatLock || chatLock.chat_allowed) return null;
    if (chatLock.next_unlock) {
      const next = new Date(chatLock.next_unlock);
      const now = new Date();
      const diff = Math.max(0, Math.floor((next - now) / 60000));
      if (diff > 60) return `${Math.floor(diff / 60)}h ${diff % 60}m until unlock`;
      if (diff > 0) return `${diff}m until unlock`;
      return 'Unlocking soon...';
    }
    return 'Chat locked by school';
  };

  // Light standalone layout for parent (no heavy sidebar)
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Left: Children list */}
      <div style={{
        width: isMobile && activeChild ? '0' : (isMobile ? '100%' : '300px'),
        borderRight: '1px solid #e2e8f0', backgroundColor: '#fff', overflow: 'auto',
        transition: 'width 0.3s', flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-people-fill" style={{ fontSize: '20px', color: '#fff' }}></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: '700', color: '#fff', fontSize: '16px' }}>Messages</h4>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Hi, {parentName}</p>
            </div>
          </div>
        </div>

        {/* Chat Lock Banner */}
        {chatLock && !chatLock.chat_allowed && (
          <div style={{ padding: '10px 16px', backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-lock-fill" style={{ color: '#d97706' }}></i>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400e' }}>Chat Locked</div>
              <div style={{ fontSize: '11px', color: '#a16207' }}>{formatLockCountdown()}</div>
            </div>
          </div>
        )}

        {/* Children list */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            Loading...
          </div>
        ) : children.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="bi bi-person-plus" style={{ fontSize: '40px', color: '#cbd5e1' }}></i>
            <p style={{ color: '#64748b', marginTop: '12px', fontSize: '14px' }}>No linked children found</p>
            <p style={{ color: '#94a3b8', fontSize: '12px' }}>Your child's account needs to be linked first</p>
          </div>
        ) : (
          children.map((child, idx) => (
            <div
              key={child.student_id || child.id || idx}
              onClick={() => openChildChat(child)}
              style={{
                padding: '14px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                backgroundColor: activeChild && (activeChild.student_id || activeChild.id) === (child.student_id || child.id) ? '#f5f3ff' : '#fff',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '13px', flexShrink: 0 }}>
                  {(child.student_name || child.fullname || 'S').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{child.student_name || child.fullname}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {child.relationship ? `${child.relationship} • ` : ''}
                    Teacher conversation
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
          <button
            onClick={() => {
              localStorage.removeItem('parentId');
              localStorage.removeItem('parentName');
              localStorage.removeItem('parentLoginStatus');
              window.location.href = '/parent-login';
            }}
            style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            <i className="bi bi-box-arrow-left me-2"></i>Sign Out
          </button>
        </div>
      </div>

      {/* Right: Chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
        {!activeChild ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <i className="bi bi-chat-heart" style={{ fontSize: '64px', color: '#c4b5fd' }}></i>
            <p style={{ color: '#64748b', marginTop: '16px', fontSize: '16px', fontWeight: '500' }}>Select a child to view their teacher conversation</p>
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Messages are monitored for child safety</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isMobile && (
                <button onClick={() => { setActiveChild(null); if (pollRef.current) clearInterval(pollRef.current); }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>
                  <i className="bi bi-arrow-left"></i>
                </button>
              )}
              <div style={{ width: '36px', height: '36px', backgroundColor: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' }}>
                {(activeChild.student_name || activeChild.fullname || 'S').substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{activeChild.student_name || activeChild.fullname}</div>
                <div style={{ fontSize: '11px', color: chatStatus.allowed ? '#10b981' : '#ef4444' }}>
                  {chatStatus.allowed ? (
                    <><i className="bi bi-unlock me-1"></i>Chat available</>
                  ) : (
                    <><i className="bi bi-lock-fill me-1"></i>{chatStatus.reason}</>
                  )}
                </div>
              </div>
              {/* Chat lock indicator */}
              {chatLock && (
                <div style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                  backgroundColor: !chatLock.chat_allowed ? '#fef3c7' : '#d1fae5',
                  color: !chatLock.chat_allowed ? '#92400e' : '#065f46',
                }}>
                  <i className={`bi ${!chatLock.chat_allowed ? 'bi-lock-fill' : 'bi-unlock'} me-1`}></i>
                  {!chatLock.chat_allowed ? 'Locked' : 'Open'}
                </div>
              )}
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Safety notice */}
              <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#3b82f6' }}>
                  <i className="bi bi-shield-check me-1"></i>
                  All messages are monitored for child safety compliance
                </span>
              </div>

              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>
                  {parentLinkId ? 'No messages yet. Start a conversation with your child\'s teacher.' : 'Link not established'}
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_type === 'parent' && String(msg.sender_parent) === String(parentId);
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isMine ? '#7c3aed' : '#fff', color: isMine ? '#fff' : '#1e293b',
                        fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: isMine ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {!isMine && (
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                            {msg.sender_display || 'Teacher'}
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

            {/* Input */}
            {chatStatus.allowed && parentLinkId ? (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress} placeholder="Type a message to the teacher..."
                  rows={1} style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: '80px' }} />
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: newMessage.trim() ? '#7c3aed' : '#e2e8f0', color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            ) : (
              <div style={{ padding: '14px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fef2f2', textAlign: 'center', fontSize: '13px', color: '#dc2626' }}>
                <i className="bi bi-lock me-2"></i>{chatStatus.reason || 'Messaging unavailable'}
                {chatLock && !chatLock.chat_allowed && formatLockCountdown() && (
                  <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>{formatLockCountdown()}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentMessages;
