import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getOversightConversations,
  getOversightTsMessages,
  getOversightPlMessages,
  deleteMessage,
} from '../../services/messagingService';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const SENDER_COLORS = {
  teacher: { bg: '#7C9BB8', label: 'Teacher' },
  student: { bg: '#101C2C', label: 'Student' },
  parent:  { bg: '#7C9BB8', label: 'Parent'  },
  admin:   { bg: '#101C2C', label: 'Admin'   },
  school:  { bg: '#7C9BB8', label: 'School'  },
};

const Avatar = ({ name, color }) => (
  <div
    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
    style={{ width: 36, height: 36, background: color || '#64748b', fontSize: 13 }}
  >
    {(name || '?').substring(0, 2).toUpperCase()}
  </div>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
const AdminChatOversight = () => {
  const adminId = localStorage.getItem('adminId');

  const [conversations, setConversations] = useState([]);
  const [filterType, setFilterType]       = useState('all');   // 'all' | 'teacher_student' | 'parent_student'
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);

  const [activeThread, setActiveThread]   = useState(null);    // full thread object from API
  const [messages, setMessages]           = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [hoveredMsgId, setHoveredMsgId]   = useState(null);
  const [deletingId, setDeletingId]       = useState(null);
  const [isMobile, setIsMobile]           = useState(window.innerWidth < 768);
  const [showThread, setShowThread]       = useState(false);   // mobile: show right panel

  const pollRef      = useRef(null);
  const msgEndRef    = useRef(null);

  /* ── responsive ── */
  useEffect(() => {
    const cb = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', cb);
    return () => window.removeEventListener('resize', cb);
  }, []);

  /* ── fetch conversation list ── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOversightConversations(adminId);
      setConversations(res.data.conversations || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [adminId]);

  useEffect(() => { fetchList(); }, [fetchList]);

  /* ── open a thread ── */
  const openThread = async (conv) => {
    if (activeThread?.thread_type === conv.thread_type && activeThread?.thread_id === conv.thread_id) return;
    setActiveThread(conv);
    setMessages([]);
    setLoadingThread(true);
    if (pollRef.current) clearInterval(pollRef.current);
    if (isMobile) setShowThread(true);

    const fetchMsgs = async () => {
      try {
        const res = conv.thread_type === 'teacher_student'
          ? await getOversightTsMessages(adminId, conv.thread_id)
          : await getOversightPlMessages(adminId, conv.thread_id);
        return res.data.messages || [];
      } catch { return []; }
    };

    const msgs = await fetchMsgs();
    setMessages(msgs);
    setLoadingThread(false);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    pollRef.current = setInterval(async () => {
      const fresh = await fetchMsgs();
      setMessages(prev => {
        const changed = fresh.length !== prev.length ||
          (fresh.length > 0 && fresh[fresh.length - 1]?.id !== prev[prev.length - 1]?.id);
        if (changed) {
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          return fresh;
        }
        return prev;
      });
    }, 5000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── delete a single message ── */
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message? This action cannot be undone.')) return;
    setDeletingId(msgId);
    try {
      await deleteMessage(msgId, 'admin', adminId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      fetchList();
    } catch {
      alert('Failed to delete message.');
    }
    setDeletingId(null);
  };

  /* ── filtered conversation list ── */
  const filteredConvs = conversations.filter(c => {
    if (filterType !== 'all' && c.thread_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const nameA = c.participant_a.name.toLowerCase();
      const nameB = c.participant_b.name.toLowerCase();
      if (!nameA.includes(q) && !nameB.includes(q)) return false;
    }
    return true;
  });

  /* ── sender info helpers ── */
  const senderName = (msg) => {
    if (msg.sender_type === 'teacher')  return activeThread?.participant_a?.name || 'Teacher';
    if (msg.sender_type === 'student')  return activeThread?.participant_b?.name || 'Student';
    if (msg.sender_type === 'parent')   return activeThread?.participant_a?.name || 'Parent';
    return msg.sender_type;
  };

  const senderColor = (type) => SENDER_COLORS[type]?.bg || '#64748b';

  /* ── styles ── */
  const panelBase = {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', padding: '16px', background: '#f1f5f9', gap: 16, boxSizing: 'border-box' }}>

      {/* ── page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {isMobile && showThread && (
          <button
            onClick={() => setShowThread(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#101C2C', fontSize: 18 }}
          >
            <i className="bi bi-arrow-left" />
          </button>
        )}
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#C9A66B,#C9A66B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-eye-fill text-white" style={{ fontSize: 18 }} />
        </div>
        <div>
          <h5 style={{ margin: 0, fontWeight: 700, color: '#101C2C', fontSize: 18 }}>Chat Oversight</h5>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Monitor all user conversations — delete any message as needed</p>
        </div>
        <div style={{ marginLeft: 'auto', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-shield-exclamation" />
          Admin Read-Only Access
        </div>
      </div>

      {/* ── two-panel layout ── */}
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>

        {/* ════ LEFT PANEL — conversation list ════ */}
        {(!isMobile || !showThread) && (
          <div style={{ ...panelBase, width: isMobile ? '100%' : 340, flexShrink: 0 }}>

            {/* search + filter */}
            <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search participants…"
                  style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#101C2C' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[['all','All'],['teacher_student','Teacher↔Student'],['parent_student','Parent↔Student']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val)}
                    style={{
                      flex: val === 'all' ? '0 0 auto' : 1,
                      padding: '5px 10px',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: filterType === val ? '#C9A66B' : '#f1f5f9',
                      color:      filterType === val ? '#fff'    : '#64748b',
                      transition: 'all .15s',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <div className="spinner-border spinner-border-sm text-warning" />
                  <p style={{ marginTop: 8, fontSize: 13 }}>Loading conversations…</p>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <i className="bi bi-chat-square-dots" style={{ fontSize: 32 }} />
                  <p style={{ marginTop: 8, fontSize: 13 }}>No user-to-user conversations found</p>
                </div>
              ) : filteredConvs.map(conv => {
                const isActive = activeThread?.thread_type === conv.thread_type && activeThread?.thread_id === conv.thread_id;
                const typeLabel = conv.thread_type === 'teacher_student' ? 'T↔S' : 'P↔S';
                const typeColor = conv.thread_type === 'teacher_student' ? '#7C9BB8' : '#7C9BB8';
                return (
                  <div
                    key={`${conv.thread_type}:${conv.thread_id}`}
                    onClick={() => openThread(conv)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                      borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                      background: isActive ? '#fef3c7' : 'transparent',
                      border: isActive ? '1px solid #fcd34d' : '1px solid transparent',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F7F3EA'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* avatar stack */}
                    <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderRadius: '50%', background: senderColor(conv.participant_a.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: '2px solid #fff' }}>
                        {conv.participant_a.name.substring(0,2).toUpperCase()}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: senderColor(conv.participant_b.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: '2px solid #fff' }}>
                        {conv.participant_b.name.substring(0,2).toUpperCase()}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#101C2C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                          {conv.participant_a.name}
                        </span>
                        <i className="bi bi-arrow-left-right" style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#101C2C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                          {conv.participant_b.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', background: typeColor, color: '#fff', borderRadius: 4, fontSize: 9, fontWeight: 700, padding: '1px 5px' }}>{typeLabel}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{conv.last_message || 'No messages yet'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{timeAgo(conv.last_message_at)}</span>
                      <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', borderRadius: 4, padding: '1px 5px' }}>{conv.message_count} msg{conv.message_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ RIGHT PANEL — thread view ════ */}
        {(!isMobile || showThread) && (
          <div style={{ ...panelBase, flex: 1, width: isMobile ? '100%' : undefined }}>
            {!activeThread ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <i className="bi bi-eye" style={{ fontSize: 28, color: '#C9A66B' }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: 0 }}>Select a conversation</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Click any thread on the left to view and moderate</p>
              </div>
            ) : (
              <>
                {/* thread header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#fafafa' }}>
                  {isMobile && (
                    <button onClick={() => setShowThread(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#101C2C', fontSize: 18, padding: 0, marginRight: 4 }}>
                      <i className="bi bi-arrow-left" />
                    </button>
                  )}
                  {/* stacked avatars */}
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderRadius: '50%', background: senderColor(activeThread.participant_a.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: '2px solid #fff' }}>
                      {activeThread.participant_a.name.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: senderColor(activeThread.participant_b.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: '2px solid #fff' }}>
                      {activeThread.participant_b.name.substring(0,2).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#101C2C' }}>
                      {activeThread.participant_a.name}
                      <span style={{ color: '#94a3b8', fontWeight: 400, margin: '0 6px' }}>↔</span>
                      {activeThread.participant_b.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                      <span style={{ background: activeThread.thread_type === 'teacher_student' ? '#F1F5F9' : '#F1F5F9', color: activeThread.thread_type === 'teacher_student' ? '#4338ca' : '#7C9BB8', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>
                        {activeThread.thread_type === 'teacher_student' ? 'Teacher ↔ Student' : 'Parent ↔ Student'}
                      </span>
                      <span style={{ marginLeft: 8 }}>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="bi bi-shield-fill" style={{ fontSize: 11 }} />
                    Oversight Mode
                  </div>
                </div>

                {/* messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loadingThread ? (
                    <div style={{ textAlign: 'center', paddingTop: 40, color: '#94a3b8' }}>
                      <div className="spinner-border spinner-border-sm text-warning" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 40, color: '#94a3b8', fontSize: 13 }}>No messages in this thread.</div>
                  ) : messages.map(msg => {
                    const color = senderColor(msg.sender_type);
                    const name  = senderName(msg);
                    const isHovered = hoveredMsgId === msg.id;
                    const isDeleting = deletingId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}
                      >
                        <Avatar name={name} color={color} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{name}</span>
                            <span style={{ fontSize: 10, background: color + '22', color, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                              {SENDER_COLORS[msg.sender_type]?.label || msg.sender_type}
                            </span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(msg.created_at)}</span>
                          </div>
                          <div style={{
                            display: 'inline-block',
                            background: '#F7F3EA',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px 12px 12px 12px',
                            padding: '8px 14px',
                            fontSize: 14,
                            color: '#101C2C',
                            maxWidth: '80%',
                            wordBreak: 'break-word',
                            boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'box-shadow .15s',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                        {/* delete button — always available to admin */}
                        {isHovered && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            disabled={isDeleting}
                            title="Delete message (admin)"
                            style={{
                              position: 'absolute', right: 0, top: 0,
                              background: '#fef2f2', border: '1px solid #fecaca',
                              borderRadius: 6, padding: '3px 8px',
                              cursor: 'pointer', color: '#D85C4A', fontSize: 12,
                              display: 'flex', alignItems: 'center', gap: 4,
                              transition: 'all .15s',
                            }}
                          >
                            {isDeleting
                              ? <div className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} />
                              : <><i className="bi bi-trash3" /> Delete</>
                            }
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={msgEndRef} />
                </div>

                {/* oversight notice footer */}
                <div style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400e' }}>
                    <i className="bi bi-eye-fill" style={{ color: '#C9A66B' }} />
                    <span>You are viewing this conversation in <strong>read-only oversight mode</strong>. Hover over any message to delete it.</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatOversight;
