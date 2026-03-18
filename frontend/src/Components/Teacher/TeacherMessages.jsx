import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { getConversation, getDirectConversation, sendMessage, markMessagesRead, markDirectMessagesRead, getChatLockStatus } from '../../services/messagingService';

const TeacherMessages = () => {
  const teacherId = localStorage.getItem('teacherId');
  const baseUrl = API_BASE_URL;

  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState({ allowed: true, reason: '' });
  const [chatLock, setChatLock] = useState(null);
  const [parentLinkId, setParentLinkId] = useState(null);
  const [teacherStudentId, setTeacherStudentId] = useState(null);
  const [isDirectChat, setIsDirectChat] = useState(false);
  const [chatPartnerName, setChatPartnerName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const conversationIdRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchStudents();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/teacher/students/${teacherId}/`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
    setLoading(false);
  };

  const openStudentChat = async (student) => {
    setActiveStudent(student);
    setMessages([]);
    setChatStatus({ allowed: true, reason: '' });
    setChatLock(null);
    setParentLinkId(null);
    setTeacherStudentId(null);
    setIsDirectChat(false);
    setChatPartnerName('');
    conversationIdRef.current = null;

    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const studentId = student.student?.id || student.student;
      // Fetch student status — includes teacher_student info for 18+ students
      const statusRes = await fetch(`${baseUrl}/student/${studentId}/parent/status/?teacher_id=${teacherId}`);
      const statusData = await statusRes.json();

      const isMinor = statusData.is_minor;

      if (!isMinor && statusData.teacher_student) {
        // ─── 18+ STUDENT: Direct teacher ↔ student chat ───
        const tsId = statusData.teacher_student.teacher_student_id;
        setTeacherStudentId(tsId);
        setIsDirectChat(true);
        setChatPartnerName(student.student_name || statusData.teacher_student.student_name || 'Student');
        conversationIdRef.current = tsId;

        const convRes = await getDirectConversation(tsId);
        setMessages(convRes.data.messages || []);
        setChatStatus(convRes.data.chat_status || { allowed: true, reason: '' });
        await markDirectMessagesRead(tsId, 'teacher', teacherId);

        // Poll for new messages
        pollRef.current = setInterval(async () => {
          try {
            const res = await getDirectConversation(tsId);
            setMessages(prev => {
              const newMsgs = res.data.messages || [];
              if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                markDirectMessagesRead(tsId, 'teacher', teacherId).catch(() => {});
                return newMsgs;
              }
              return prev;
            });
          } catch (e) { /* silent */ }
        }, 5000);

      } else if (statusData.parent_link_id) {
        // ─── MINOR: Parent ↔ teacher chat (existing flow) ───
        const linkId = statusData.parent_link_id;
        setParentLinkId(linkId);
        setIsDirectChat(false);
        setChatPartnerName(statusData.parent_name || 'Parent');
        conversationIdRef.current = linkId;

        const convRes = await getConversation(linkId);
        setMessages(convRes.data.messages || []);
        setChatStatus(convRes.data.chat_status || { allowed: true, reason: '' });
        await markMessagesRead(linkId, 'teacher', teacherId);

        try {
          const lockRes = await getChatLockStatus(linkId);
          setChatLock(lockRes.data);
        } catch (e) { /* ignore */ }

        // Poll for new messages
        pollRef.current = setInterval(async () => {
          try {
            const res = await getConversation(linkId);
            setMessages(prev => {
              const newMsgs = res.data.messages || [];
              if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                markMessagesRead(linkId, 'teacher', teacherId).catch(() => {});
                return newMsgs;
              }
              return prev;
            });
            setChatStatus(res.data.chat_status || { allowed: true, reason: '' });
          } catch (e) { /* silent */ }
        }, 5000);

      } else {
        // No parent link and minor — messaging unavailable
        setChatStatus({ allowed: false, reason: isMinor ? 'No parent account linked to this student' : 'No teacher-student assignment found' });
      }
    } catch (err) {
      console.error('Error opening chat:', err);
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async () => {
    const canSend = isDirectChat ? !!teacherStudentId : !!parentLinkId;
    if (!newMessage.trim() || !canSend) return;
    setSending(true);
    try {
      const payload = {
        sender_type: 'teacher',
        sender_id: teacherId,
        content: newMessage.trim(),
      };

      if (isDirectChat) {
        // Direct teacher → student message
        payload.recipient_type = 'student';
        payload.recipient_id = activeStudent.student?.id || activeStudent.student;
        payload.teacher_student_id = teacherStudentId;
      } else {
        // Teacher → parent message
        payload.recipient_type = 'parent';
        payload.parent_link_id = parentLinkId;
      }

      await sendMessage(payload);
      setNewMessage('');

      // Refresh conversation
      if (isDirectChat) {
        const res = await getDirectConversation(teacherStudentId);
        setMessages(res.data.messages || []);
      } else {
        const res = await getConversation(parentLinkId);
        setMessages(res.data.messages || []);
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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

  const conversationReady = isDirectChat ? !!teacherStudentId : !!parentLinkId;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      {/* Student list panel */}
      <div style={{ width: isMobile && activeStudent ? '0' : (isMobile ? '100%' : '280px'), borderRight: '1px solid #e2e8f0', backgroundColor: '#fff', overflow: 'auto', transition: 'width 0.3s', flexShrink: 0 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>
            <i className="bi bi-chat-dots me-2"></i>Text Messages
          </h4>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>Chat with parents & adult students</p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading students...</div>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No students found</div>
        ) : (
          students.map(s => (
            <div key={s.id} onClick={() => openStudentChat(s)}
              style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                backgroundColor: activeStudent?.id === s.id ? '#eff6ff' : '#fff', transition: 'background 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {s.student_profile_img ? (
                  <img src={s.student_profile_img} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', backgroundColor: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' }}>
                    {(s.student_name || 'S').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{s.student_name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{s.instrument} • {s.level}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
        {!activeStudent ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <i className="bi bi-chat-square-text" style={{ fontSize: '56px', color: '#cbd5e1' }}></i>
            <p style={{ color: '#64748b', marginTop: '12px' }}>Select a student to start messaging</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isMobile && (
                <button onClick={() => setActiveStudent(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                  <i className="bi bi-arrow-left"></i>
                </button>
              )}
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                {activeStudent.student_name}
                {isDirectChat && (
                  <span style={{ fontSize: '11px', color: '#6366f1', marginLeft: '8px', fontWeight: '500' }}>
                    <i className="bi bi-person-fill me-1"></i>Direct (18+)
                  </span>
                )}
                {!isDirectChat && chatPartnerName && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px', fontWeight: '500' }}>
                    via {chatPartnerName}
                  </span>
                )}
                {!chatStatus.allowed && <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '8px' }}>
                  <i className="bi bi-lock-fill me-1"></i>{chatStatus.reason}
                </span>}
              </div>
              {/* Chat lock indicator (parent-link chats only) */}
              {!isDirectChat && chatLock && (
                <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                  backgroundColor: !chatLock.chat_allowed ? '#fef3c7' : '#d1fae5',
                  color: !chatLock.chat_allowed ? '#92400e' : '#065f46' }}>
                  <i className={`bi ${!chatLock.chat_allowed ? 'bi-lock-fill' : 'bi-unlock'} me-1`}></i>
                  {!chatLock.chat_allowed ? 'Chat Locked' : 'Chat Open'}
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '14px' }}>
                  {conversationReady ? 'No messages yet — start the conversation!' : 'Messaging unavailable'}
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_type === 'teacher' && String(msg.sender_teacher) === String(teacherId);
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isMine ? '#6366f1' : '#fff', color: isMine ? '#fff' : '#1e293b',
                        fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: isMine ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {!isMine && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{msg.sender_display}</div>}
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                        <div style={{ fontSize: '10px', color: isMine ? 'rgba(255,255,255,0.7)' : '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                          {timeAgo(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {chatStatus.allowed && conversationReady ? (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress} placeholder="Type a message..." rows={1}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: '80px' }} />
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', backgroundColor: newMessage.trim() ? '#6366f1' : '#e2e8f0', color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fef2f2', textAlign: 'center', fontSize: '13px', color: '#dc2626' }}>
                <i className="bi bi-lock me-1"></i>{chatStatus.reason || 'Messaging unavailable'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherMessages;
