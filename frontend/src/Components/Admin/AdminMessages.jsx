import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import {
  getAdminConversations,
  getAdminConversation,
  markAdminConversationRead,
  sendMessage,
  deleteMessage,
  adminDeleteConversation,
} from '../../services/messagingService';

const TYPE_COLORS = {
  teacher: { bg: '#7C9BB8', light: '#eff6ff', badge: '#eef2ff', text: '#4338ca', label: 'Teacher' },
  student: { bg: '#101C2C', light: '#eff6ff', badge: '#dbeafe', text: '#101C2C', label: 'Student' },
  school:  { bg: '#0891b2', light: '#ecfeff', badge: '#cffafe', text: '#0e7490', label: 'School'  },
  parent:  { bg: '#7C9BB8', light: '#f5f3ff', badge: '#ede9fe', text: '#7C9BB8', label: 'Parent'  },
};

const typeInfo = (type) => TYPE_COLORS[type] || { bg: '#64748b', light: '#F7F3EA', badge: '#f1f5f9', text: '#475569', label: type };

const timeAgo = (dateStr) => {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const AdminMessages = () => {
  const adminId = localStorage.getItem('adminId');
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);   // { user_type, user_id, display_name, profile_img }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [safetyReportCount, setSafetyReportCount] = useState(0);

  const [hoveredMsgId, setHoveredMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const composeDebounceRef = useRef(null);

  // ─── Compose / New Chat state ─────────────────────────────────────────────
  const [showCompose, setShowCompose] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const [composeUserType, setComposeUserType] = useState('all');
  const [composeResults, setComposeResults] = useState([]);
  const [composeLoading, setComposeLoading] = useState(false);

  // Search users for compose modal
  const searchUsers = async (q, type) => {
    setComposeLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (type !== 'all') params.set('user_type', type);
      const res = await fetch(`${API_BASE_URL}/admin/users/search/?${params.toString()}`);
      const data = await res.json();
      setComposeResults(data.users || []);
    } catch {
      setComposeResults([]);
    }
    setComposeLoading(false);
  };

  const handleComposeQueryChange = (e) => {
    const val = e.target.value;
    setComposeQuery(val);
    clearTimeout(composeDebounceRef.current);
    composeDebounceRef.current = setTimeout(() => searchUsers(val, composeUserType), 300);
  };

  const handleComposeTypeChange = (type) => {
    setComposeUserType(type);
    clearTimeout(composeDebounceRef.current);
    composeDebounceRef.current = setTimeout(() => searchUsers(composeQuery, type), 100);
  };

  const openComposeModal = () => {
    setComposeQuery('');
    setComposeUserType('all');
    setComposeResults([]);
    setShowCompose(true);
    // Load all users on open
    setTimeout(() => searchUsers('', 'all'), 50);
  };

  const selectComposeUser = (user) => {
    setShowCompose(false);
    const synth = {
      conversation_key: `admin:${adminId}:${user.type}:${user.id}`,
      user_type: user.type,
      user_id: user.id,
      display_name: user.name,
      profile_img: user.profile_img,
      unread_count: 0,
      last_message: '',
      last_message_at: new Date().toISOString(),
      last_sender_type: '',
    };
    // Add to top of conversations list if not already present
    setConversations(prev => {
      const exists = prev.find(c => c.conversation_key === synth.conversation_key);
      return exists ? prev : [synth, ...prev];
    });
    openConversation(synth);
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Initial load + refresh conversations list
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? `?user_type=${filterType}` : '';
      const res = await getAdminConversations(adminId, params);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Error fetching admin conversations:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  // Auto-open conversation from URL params (?user_type=teacher&user_id=5)
  const didAutoOpen = useRef(false);
  useEffect(() => {
    if (didAutoOpen.current || loading) return;
    const urlUserType = searchParams.get('user_type');
    const urlUserId = searchParams.get('user_id');
    if (urlUserType && urlUserId) {
      const match = conversations.find(
        c => c.user_type === urlUserType && String(c.user_id) === String(urlUserId)
      );
      if (match) {
        didAutoOpen.current = true;
        openConversation(match);
      } else if (conversations.length === 0 && !loading) {
        // No existing conversation — create a synthetic entry to open the thread
        didAutoOpen.current = true;
        const synth = {
          conversation_key: `admin:${adminId}:${urlUserType}:${urlUserId}`,
          user_type: urlUserType,
          user_id: parseInt(urlUserId, 10),
          display_name: `${urlUserType} #${urlUserId}`,
          profile_img: null,
          unread_count: 0,
          last_message: '',
          last_message_at: new Date().toISOString(),
          last_sender_type: '',
        };
        openConversation(synth);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, loading]);

  const openConversation = async (conv) => {
    if (activeConv?.conversation_key === conv.conversation_key) return;
    setActiveConv(conv);
    setMessages([]);
    setSafetyReportCount(0);
    setLoadingThread(true);

    if (pollRef.current) clearInterval(pollRef.current);

    // Fetch open safety reports for teachers and students
    if (conv.user_type === 'teacher' || conv.user_type === 'student') {
      fetch(`${API_BASE_URL}/user/${conv.user_type}/${conv.user_id}/open-safety-report-count/`)
        .then(r => r.json())
        .then(d => setSafetyReportCount(d.count || 0))
        .catch(() => {});
    }

    try {
      const res = await getAdminConversation(adminId, conv.user_type, conv.user_id);
      setMessages(res.data.messages || []);
      await markAdminConversationRead(adminId, conv.user_type, conv.user_id).catch(() => {});
      // Update unread badge in list
      setConversations(prev =>
        prev.map(c => c.conversation_key === conv.conversation_key ? { ...c, unread_count: 0 } : c)
      );
    } catch (err) {
      console.error('Error loading thread:', err);
    }
    setLoadingThread(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // Poll every 5 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await getAdminConversation(adminId, conv.user_type, conv.user_id);
        setMessages(prev => {
          const newMsgs = res.data.messages || [];
          const changed =
            newMsgs.length !== prev.length ||
            (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id);
          if (changed) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            markAdminConversationRead(adminId, conv.user_type, conv.user_id).catch(() => {});
            return newMsgs;
          }
          return prev;
        });
      } catch { /* silent */ }
    }, 5000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessage(msgId, 'admin', adminId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    if (!window.confirm(`Delete the entire conversation with ${activeConv.display_name}? All messages will be permanently removed.`)) return;
    try {
      await adminDeleteConversation(adminId, activeConv.user_type, activeConv.user_id);
      setMessages([]);
      setConversations(prev => prev.filter(c => c.conversation_key !== activeConv.conversation_key));
      setActiveConv(null);
      if (pollRef.current) clearInterval(pollRef.current);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete conversation');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      const payload = {
        sender_type: 'admin',
        sender_id: adminId,
        content: newMessage.trim(),
        recipient_type: activeConv.user_type,
        recipient_id: activeConv.user_id,
      };
      await sendMessage(payload);
      setNewMessage('');
      const res = await getAdminConversation(adminId, activeConv.user_type, activeConv.user_id);
      setMessages(res.data.messages || []);
      // Refresh conversations list to update last_message
      fetchConversations();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Filtered + searched conversation list
  const visibleConvs = conversations.filter(c => {
    if (search && !c.display_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  // ─── LEFT PANEL ────────────────────────────────────────────────────────────
  const renderLeftPanel = () => (
    <div style={{
      width: isMobile && activeConv ? '0' : (isMobile ? '100%' : '300px'),
      borderRight: '1px solid #e2e8f0',
      backgroundColor: '#fff',
      overflow: 'auto',
      transition: 'width 0.3s',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontWeight: '700', color: '#101C2C', fontSize: '16px' }}>
            <i className="bi bi-chat-dots me-2" style={{ color: '#101C2C' }}></i>
            Messages
            {totalUnread > 0 && (
              <span style={{
                marginLeft: '8px', padding: '2px 7px', borderRadius: '10px',
                backgroundColor: '#D85C4A', color: '#fff', fontSize: '11px', fontWeight: '700'
              }}>{totalUnread}</span>
            )}
          </h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={openComposeModal}
              title="Start new conversation"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#101C2C', fontSize: '18px', padding: '4px' }}
            >
              <i className="bi bi-pencil-square"></i>
            </button>
            <button
              onClick={fetchConversations}
              title="Refresh"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', padding: '4px' }}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['all', 'student', 'teacher', 'school'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px',
              fontWeight: filterType === t ? '600' : '400',
              backgroundColor: filterType === t ? '#101C2C' : '#f1f5f9',
              color: filterType === t ? '#fff' : '#64748b',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            <i className="bi bi-three-dots" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
            Loading conversations...
          </div>
        ) : visibleConvs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="bi bi-chat-left-text" style={{ fontSize: '40px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No conversations yet</p>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Messages from users will appear here</p>
          </div>
        ) : (
          visibleConvs.map(conv => {
            const ti = typeInfo(conv.user_type);
            const isActive = activeConv?.conversation_key === conv.conversation_key;
            return (
              <div
                key={conv.conversation_key}
                onClick={() => openConversation(conv)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#eff6ff' : '#fff',
                  borderLeft: isActive ? '3px solid #101C2C' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Avatar */}
                  {conv.profile_img ? (
                    <img src={conv.profile_img} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: ti.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px',
                    }}>
                      {conv.display_name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600', color: '#101C2C', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.display_name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{
                        padding: '1px 7px', borderRadius: '8px', fontSize: '10px', fontWeight: '600',
                        backgroundColor: ti.badge, color: ti.text,
                      }}>{ti.label}</span>
                      {conv.unread_count > 0 && (
                        <span style={{
                          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#D85C4A',
                          color: '#fff', fontSize: '10px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{conv.unread_count}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_sender_type === 'admin' ? 'You: ' : ''}{conv.last_message}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ─── RIGHT PANEL ────────────────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (!activeConv) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backgroundColor: '#F7F3EA' }}>
          <i className="bi bi-chat-square-text" style={{ fontSize: '64px', color: '#cbd5e1' }}></i>
          <p style={{ color: '#64748b', marginTop: '16px', fontSize: '16px', fontWeight: '500' }}>Select a conversation</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>Reply to students, teachers and schools</p>
        </div>
      );
    }

    const ti = typeInfo(activeConv.user_type);

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F7F3EA', overflow: 'hidden' }}>
        {/* Thread header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          {isMobile && (
            <button onClick={() => { setActiveConv(null); if (pollRef.current) clearInterval(pollRef.current); }}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', marginRight: '4px' }}>
              <i className="bi bi-arrow-left"></i>
            </button>
          )}
          {activeConv.profile_img ? (
            <img src={activeConv.profile_img} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', backgroundColor: ti.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0,
            }}>
              {activeConv.display_name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: '600', color: '#101C2C', fontSize: '14px' }}>{activeConv.display_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '1px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                backgroundColor: ti.badge, color: ti.text,
              }}>{ti.label}</span>
              <span style={{ fontSize: '11px', color: '#10b981' }}>
                <i className="bi bi-circle-fill me-1" style={{ fontSize: '7px' }}></i>Chat open
              </span>
              {safetyReportCount > 0 && (
                <a
                  href="/admin-panel/users-management"
                  style={{
                    padding: '2px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                    backgroundColor: '#fef3c7', color: '#C9A66B',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}
                  title="View safety reports for this user"
                >
                  <i className="bi bi-shield-exclamation" style={{ fontSize: '11px' }}></i>
                  {safetyReportCount} open safety report{safetyReportCount > 1 ? 's' : ''}
                </a>
              )}
            </div>
          </div>
          {/* Delete entire conversation */}
          <button
            onClick={handleDeleteConversation}
            title="Delete entire conversation"
            style={{
              marginLeft: 'auto', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
              color: '#D85C4A', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-trash3-fill" style={{ fontSize: '13px' }}></i>
            {!isMobile && <span>Delete Chat</span>}
          </button>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loadingThread ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>
              <i className="bi bi-chat-left" style={{ fontSize: '32px', display: 'block', marginBottom: '12px', color: '#cbd5e1' }}></i>
              No messages yet — start the conversation!
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_type === 'admin' && String(msg.sender_admin) === String(adminId);
              return (
                <div key={msg.id}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                  style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}
                >
                  {isMine && hoveredMsgId === msg.id && (
                    <button onClick={() => handleDelete(msg.id)} title="Delete message"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D85C4A', fontSize: '13px', padding: '2px', flexShrink: 0, opacity: 0.8 }}>
                      <i className="bi bi-trash3"></i>
                    </button>
                  )}
                  <div style={{
                    maxWidth: '70%', padding: '10px 14px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMine ? '#101C2C' : '#fff',
                    color: isMine ? '#fff' : '#101C2C',
                    fontSize: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                    border: isMine ? 'none' : '1px solid #e2e8f0',
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
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #e2e8f0',
          backgroundColor: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end',
        }}>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${activeConv.display_name}...`}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0',
              borderRadius: '20px', fontSize: '14px', resize: 'none', outline: 'none',
              fontFamily: 'inherit', maxHeight: '80px', overflow: 'auto',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            style={{
              width: '38px', height: '38px', borderRadius: '50%', border: 'none', flexShrink: 0,
              backgroundColor: newMessage.trim() ? '#101C2C' : '#e2e8f0',
              color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              transition: 'background 0.2s',
            }}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', backgroundColor: '#F7F3EA' }}>
      {renderLeftPanel()}
      {renderRightPanel()}

      {/* ─── Compose / New Chat Modal ─────────────────────────────────── */}
      {showCompose && (
        <div
          onClick={() => setShowCompose(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '460px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h5 style={{ margin: 0, fontWeight: '700', color: '#101C2C', fontSize: '15px' }}>
                <i className="bi bi-pencil-square me-2" style={{ color: '#101C2C' }}></i>
                New Conversation
              </h5>
              <button
                onClick={() => setShowCompose(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1 }}
              >&times;</button>
            </div>

            {/* Search input */}
            <div style={{ padding: '14px 20px 10px' }}>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}></i>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by name or email..."
                  value={composeQuery}
                  onChange={handleComposeQueryChange}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Type filter */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                {['all', 'student', 'teacher', 'school'].map(t => (
                  <button key={t} onClick={() => handleComposeTypeChange(t)} style={{
                    padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px',
                    fontWeight: composeUserType === t ? '600' : '400',
                    backgroundColor: composeUserType === t ? '#101C2C' : '#f1f5f9',
                    color: composeUserType === t ? '#fff' : '#64748b',
                    textTransform: 'capitalize',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Results list */}
            <div style={{ maxHeight: '320px', overflow: 'auto', borderTop: '1px solid #f1f5f9' }}>
              {composeLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  <i className="bi bi-three-dots" style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}></i>
                  Searching...
                </div>
              ) : composeResults.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  <i className="bi bi-person-x" style={{ fontSize: '28px', display: 'block', marginBottom: '8px', color: '#cbd5e1' }}></i>
                  No users found
                </div>
              ) : (
                composeResults.map(user => {
                  const ti = typeInfo(user.type);
                  return (
                    <div
                      key={`${user.type}-${user.id}`}
                      onClick={() => selectComposeUser(user)}
                      style={{
                        padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #F7F3EA',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F3EA'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                    >
                      {user.profile_img ? (
                        <img src={user.profile_img} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: ti.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px',
                        }}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: '#101C2C', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                        backgroundColor: ti.badge, color: ti.text, flexShrink: 0,
                      }}>{ti.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
