import React, { useState, useEffect, useRef } from 'react';
import { getUserAdminConversation, markUserAdminMessagesRead, sendMessage, deleteMessage } from '../../services/messagingService';

const SchoolMessages = () => {
  const schoolId = localStorage.getItem('schoolId');

  const [messages, setMessages] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (schoolId) loadConversation();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [schoolId]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const res = await getUserAdminConversation('school', schoolId);
      const data = res.data;
      setAdminId(data.admin_id);
      setMessages(data.messages || []);
      if (data.admin_id) markUserAdminMessagesRead('school', schoolId, data.admin_id).catch(() => {});
      pollRef.current = setInterval(async () => {
        try {
          const r = await getUserAdminConversation('school', schoolId);
          setMessages(prev => {
            const newMsgs = r.data.messages || [];
            if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              if (r.data.admin_id) markUserAdminMessagesRead('school', schoolId, r.data.admin_id).catch(() => {});
              return newMsgs;
            }
            return prev;
          });
        } catch { /* silent */ }
      }, 5000);
    } catch (err) {
      console.error('Error loading admin conversation:', err);
    }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !adminId) return;
    setSending(true);
    try {
      await sendMessage({
        sender_type: 'school',
        sender_id: schoolId,
        recipient_type: 'admin',
        recipient_id: adminId,
        content: newMessage.trim(),
      });
      setNewMessage('');
      const res = await getUserAdminConversation('school', schoolId);
      setMessages(res.data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessage(msgId, 'school', schoolId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date(); const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#4285f4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
          <i className="bi bi-shield-check"></i>
        </div>
        <div>
          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>Admin Support</div>
          <div style={{ fontSize: '12px', color: '#4285f4' }}>Platform admin — here to help</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
            <i className="bi bi-chat-square-text" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}></i>
            No messages yet — reach out to the admin anytime!
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_type === 'school' && String(msg.sender_school) === String(schoolId);
            return (
              <div key={msg.id}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}
              >
                {isMine && hoveredMsgId === msg.id && (
                  <button onClick={() => handleDelete(msg.id)} title="Delete message"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px', padding: '2px', flexShrink: 0, opacity: 0.8 }}>
                    <i className="bi bi-trash3"></i>
                  </button>
                )}
                <div style={{
                  maxWidth: '70%', padding: '10px 14px',
                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: isMine ? '#0891b2' : '#fff',
                  color: isMine ? '#fff' : '#1e293b',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        {!adminId && !loading ? (
          <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            <i className="bi bi-info-circle me-1"></i>No admin available yet — messages will be delivered once an admin is assigned.
          </div>
        ) : (
          <>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message to admin..."
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px',
                fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: '80px',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                backgroundColor: newMessage.trim() ? '#0891b2' : '#e2e8f0',
                color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
              }}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SchoolMessages;
