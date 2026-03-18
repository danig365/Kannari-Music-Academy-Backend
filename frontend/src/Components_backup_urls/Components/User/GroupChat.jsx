import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const POLL_INTERVAL = 5000; // 5 seconds

const GroupChat = ({ groupId, studentId }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minorBlocked, setMinorBlocked] = useState(false);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pollRef = useRef(null);
  const isAtBottomRef = useRef(true);

  // Check minor access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await axios.get(`${baseUrl}/student/${studentId}/minor-access-status/`);
        if (res.data.is_minor && !res.data.can_send_messages) {
          setMinorBlocked(true);
        }
      } catch {}
    };
    if (studentId) checkAccess();
  }, [studentId]);

  const fetchMessages = useCallback(async (scroll = false) => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/messages/`);
      const msgs = Array.isArray(res.data) ? res.data : [];
      setMessages(msgs);
      if (scroll || isAtBottomRef.current) {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchMessages(true);
    // Start polling
    pollRef.current = setInterval(() => fetchMessages(false), POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [groupId, fetchMessages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await axios.post(`${baseUrl}/group/${groupId}/messages/`, {
        sender_type: 'student',
        sender_id: studentId,
        sender_student: studentId,
        content: newMsg.trim()
      });
      setNewMsg('');
      isAtBottomRef.current = true;
      await fetchMessages(true);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.[0] || 'Failed to send message.';
      alert(typeof errMsg === 'string' ? errMsg : 'Students under 18 cannot send group messages directly.');
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getSenderColor = (msg) => {
    if (msg.sender_type === 'teacher') return '#6366f1';
    if (msg.sender_type === 'admin' || msg.sender_type === 'school') return '#ef4444';
    if (msg.sender_type === 'parent') return '#f59e0b';
    return '#3b82f6';
  };

  const getSenderInitials = (msg) => {
    const name = msg.sender_name_display || msg.sender_name || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const isOwnMessage = (msg) => {
    return msg.sender_type === 'student' && String(msg.sender_student) === String(studentId);
  };

  // Pinned messages at top
  const pinnedMessages = messages.filter(m => m.is_pinned);

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '550px' }}>
      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <div style={{ padding: '8px 16px', backgroundColor: '#fefce8', borderBottom: '1px solid #fde68a', fontSize: '13px' }}>
          <i className="bi bi-pin-fill me-1" style={{ color: '#f59e0b' }}></i>
          <strong>Pinned:</strong> {pinnedMessages[pinnedMessages.length - 1]?.content?.substring(0, 100)}
          {pinnedMessages.length > 1 && <span style={{ color: '#92400e', marginLeft: '8px' }}>+{pinnedMessages.length - 1} more</span>}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
            <i className="bi bi-chat-dots" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
            <div style={{ fontSize: '14px' }}>No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const own = isOwnMessage(msg);
            const color = getSenderColor(msg);
            const showAvatar = idx === 0 || messages[idx - 1]?.sender_name !== msg.sender_name ||
              (new Date(msg.created_at) - new Date(messages[idx - 1]?.created_at)) > 300000;

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: own ? 'row-reverse' : 'row', gap: '8px', marginTop: showAvatar ? '12px' : '2px' }}>
                {/* Avatar */}
                {showAvatar ? (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '11px', fontWeight: '600',
                    overflow: 'hidden'
                  }}>
                    {msg.sender_profile_img ? (
                      <img src={msg.sender_profile_img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : getSenderInitials(msg)}
                  </div>
                ) : (
                  <div style={{ width: '32px', flexShrink: 0 }} />
                )}

                {/* Message bubble */}
                <div style={{ maxWidth: '75%' }}>
                  {showAvatar && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexDirection: own ? 'row-reverse' : 'row' }}>
                      <span style={{ fontWeight: '600', fontSize: '12px', color: color }}>
                        {msg.sender_name_display || msg.sender_name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8', padding: '1px 6px', borderRadius: '8px', backgroundColor: '#f8fafc', textTransform: 'capitalize' }}>
                        {msg.sender_type}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{timeAgo(msg.created_at)}</span>
                    </div>
                  )}
                  <div style={{
                    padding: '8px 14px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5',
                    backgroundColor: own ? '#6366f1' : (msg.is_pinned ? '#fef3c7' : '#f1f5f9'),
                    color: own ? '#fff' : '#1e293b',
                    borderTopRightRadius: own && !showAvatar ? '12px' : own ? '4px' : '12px',
                    borderTopLeftRadius: !own && !showAvatar ? '12px' : !own ? '4px' : '12px',
                    wordBreak: 'break-word'
                  }}>
                    {msg.is_pinned && !own && <i className="bi bi-pin-fill me-1" style={{ color: '#f59e0b', fontSize: '11px' }}></i>}
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      {minorBlocked ? (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-shield-lock-fill" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
            Group chat sending is locked — parent approval required. <a href="/parent-login" style={{ color: '#7c3aed', fontWeight: '600' }}>Parent Portal</a>
          </span>
        </div>
      ) : (
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px',
            fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit',
            maxHeight: '100px', lineHeight: '1.4'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!newMsg.trim() || sending}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            backgroundColor: newMsg.trim() ? '#6366f1' : '#e2e8f0',
            color: '#fff', cursor: newMsg.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', flexShrink: 0
          }}
        >
          {sending ? (
            <span className="spinner-border spinner-border-sm" style={{ width: '16px', height: '16px' }}></span>
          ) : (
            <i className="bi bi-send-fill" style={{ fontSize: '14px' }}></i>
          )}
        </button>
      </div>
      )}
    </div>
  );
};

export default GroupChat;
