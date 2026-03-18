import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherCommunity = () => {
    const teacherId = localStorage.getItem('teacherId');
    const teacherName = localStorage.getItem('teacherName') || 'Teacher';
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await axios.get(`${baseUrl}/teacher-community/messages/`);
            setMessages(res.data || []);
        } catch (err) {
            console.error('Failed to fetch community messages:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;
        setSending(true);
        try {
            await axios.post(`${baseUrl}/teacher-community/messages/`, {
                teacher: parseInt(teacherId),
                content: newMessage.trim()
            });
            setNewMessage('');
            setShowEmojiPicker(false);
            setAutoScroll(true);
            await fetchMessages();
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const togglePin = async (msgId) => {
        try {
            await axios.post(`${baseUrl}/teacher-community/message/${msgId}/toggle-pin/`);
            fetchMessages();
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const hideMessage = async (msgId) => {
        try {
            await axios.post(`${baseUrl}/teacher-community/message/${msgId}/hide/`);
            fetchMessages();
        } catch (err) {
            console.error('Failed to hide message:', err);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const truncateName = (name, maxLength = 20) => {
        if (!name) return 'Teacher';
        return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
    };

    const getDefaultAvatar = (name, color1, color2) => {
        const initials = getInitials(name);
        const svg = `
            <svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
                <defs>
                    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
                        <stop offset='0%' stop-color='${color1}'/>
                        <stop offset='100%' stop-color='${color2}'/>
                    </linearGradient>
                </defs>
                <rect width='96' height='96' rx='48' fill='url(#g)'/>
                <text x='48' y='57' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='32' font-weight='700'>${initials}</text>
            </svg>
        `;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const emojiOptions = ['😀', '😂', '😍', '😎', '🎵', '🎹', '🎸', '🎤', '🔥', '👏', '🙏', '💯'];

    const addEmoji = (emoji) => {
        setNewMessage((prev) => `${prev}${emoji}`);
        setShowEmojiPicker(false);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const teacherColors = [
        ['#4285f4', '#3b5998'],
        ['#8b5cf6', '#7c3aed'],
        ['#10b981', '#059669'],
        ['#f59e0b', '#d97706'],
        ['#ef4444', '#dc2626'],
        ['#ec4899', '#db2777'],
        ['#06b6d4', '#0891b2'],
        ['#f97316', '#ea580c'],
    ];

    const getTeacherColor = (tId) => {
        const idx = (parseInt(tId) || 0) % teacherColors.length;
        return teacherColors[idx];
    };

    const pinnedMessages = messages.filter(m => m.is_pinned);

    return (
        <div style={{ padding: '1.5rem', height: 'calc(100vh - 2rem)' }}>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #4285f4, #3b5998)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <i className="bi bi-chat-dots-fill" style={{ color: '#fff', fontSize: '1.15rem' }}></i>
                        </div>
                        <div>
                            <h5 style={{ margin: 0, color: '#1f2937', fontSize: '1.05rem', fontWeight: 600 }}>
                                Teacher Lounge
                            </h5>
                            <small style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                                {messages.length} messages &middot; All teachers welcome &middot; {truncateName(teacherName, 16)}
                            </small>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(34,197,94,0.12)', padding: '6px 12px',
                        borderRadius: '20px', fontSize: '0.78rem', color: '#4ade80',
                        border: '1px solid rgba(34,197,94,0.15)',
                    }}>
                        <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: '#22c55e', display: 'inline-block',
                            boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                        }}></span>
                        Online
                    </div>
                </div>

                {/* Pinned Messages */}
                {pinnedMessages.length > 0 && (
                    <div style={{
                        padding: '0.6rem 1.5rem',
                        background: '#fffbea',
                        borderBottom: '1px solid #fde68a',
                        maxHeight: '100px', overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <i className="bi bi-pin-angle-fill" style={{ color: '#facc15', fontSize: '0.8rem' }}></i>
                            <span style={{
                                color: '#facc15', fontSize: '0.7rem', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                                Pinned ({pinnedMessages.length})
                            </span>
                        </div>
                        {pinnedMessages.map(pm => (
                            <div key={pm.id} style={{
                                fontSize: '0.8rem', color: '#4b5563', padding: '2px 0',
                                display: 'flex', gap: '6px', alignItems: 'baseline',
                            }}>
                                <strong style={{ color: '#2563eb', flexShrink: 0, fontSize: '0.78rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pm.teacher_name || 'Teacher'}>
                                    {truncateName(pm.teacher_name || 'Teacher', 18)}:
                                </strong>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {pm.content}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Chat Area */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minHeight: 0,
                        background: '#f9fafb',
                    }}
                >
                    {loading ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '4rem', color: '#6b7280',
                        }}>
                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                            Loading messages...
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '4rem 2rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                        }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(66,133,244,0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i className="bi bi-chat-dots" style={{ fontSize: '1.5rem', color: '#4285f4' }}></i>
                            </div>
                            <div>
                                <h6 style={{ color: '#374151', marginBottom: '4px', fontWeight: 600 }}>
                                    Welcome to the Teacher Lounge!
                                </h6>
                                <p style={{ fontSize: '0.85rem', margin: 0, color: '#6b7280' }}>
                                    Start a conversation with your fellow teachers.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => {
                                const isOwn = msg.teacher === parseInt(teacherId);
                                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                const sameAsPrev = prevMsg && prevMsg.teacher === msg.teacher;
                                const showDate = idx === 0 ||
                                    new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                                const showHeader = !sameAsPrev || showDate;
                                const [c1, c2] = getTeacherColor(msg.teacher);
                                const displayName = msg.teacher_name || 'Teacher';

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDate && (
                                            <div style={{
                                                textAlign: 'center', padding: '1rem 0 0.5rem',
                                                fontSize: '0.7rem', color: '#9ca3af',
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                            }}>
                                                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                                <span style={{
                                                    background: '#ffffff', padding: '3px 12px',
                                                    borderRadius: '10px', fontWeight: 500,
                                                    border: '1px solid #e5e7eb',
                                                }}>
                                                    {new Date(msg.created_at).toLocaleDateString('en-US', {
                                                        weekday: 'long', month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                            </div>
                                        )}

                                        <div style={{
                                            display: 'flex',
                                            flexDirection: isOwn ? 'row-reverse' : 'row',
                                            gap: '10px',
                                            alignItems: 'flex-start',
                                            marginTop: showHeader ? '12px' : '1px',
                                            padding: '2px 0',
                                        }}>
                                            <div style={{ width: '38px', flexShrink: 0 }}>
                                                {showHeader && (
                                                    <img
                                                        src={msg.teacher_profile_img || getDefaultAvatar(displayName, c1, c2)}
                                                        alt={displayName}
                                                        style={{
                                                            width: '38px', height: '38px', borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            border: `2px solid ${c1}33`,
                                                            background: '#ffffff',
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div style={{
                                                maxWidth: '65%', display: 'flex', flexDirection: 'column',
                                                alignItems: isOwn ? 'flex-end' : 'flex-start',
                                            }}>
                                                {showHeader && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'baseline', gap: '8px',
                                                        marginBottom: '4px',
                                                        flexDirection: isOwn ? 'row-reverse' : 'row',
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.82rem', fontWeight: 600,
                                                            color: isOwn ? '#93c5fd' : c1,
                                                            maxWidth: '170px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }} title={isOwn ? 'You' : displayName}>
                                                            {isOwn ? 'You' : truncateName(displayName, 20)}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            color: '#9ca3af',
                                                        }}>
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    style={{
                                                        background: isOwn
                                                            ? '#e8f0ff'
                                                            : '#ffffff',
                                                        border: isOwn
                                                            ? '1px solid #bfdbfe'
                                                            : '1px solid #e5e7eb',
                                                        borderRadius: isOwn
                                                            ? '14px 14px 4px 14px'
                                                            : '14px 14px 14px 4px',
                                                        padding: '10px 14px',
                                                        color: '#1f2937',
                                                        fontSize: '0.88rem',
                                                        lineHeight: '1.5',
                                                        position: 'relative',
                                                        cursor: 'default',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        const a = e.currentTarget.querySelector('.msg-actions');
                                                        if (a) a.style.opacity = '1';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const a = e.currentTarget.querySelector('.msg-actions');
                                                        if (a) a.style.opacity = '0';
                                                    }}
                                                >
                                                    {msg.is_pinned && (
                                                        <i className="bi bi-pin-fill" style={{
                                                            color: '#facc15', fontSize: '0.65rem',
                                                            position: 'absolute', top: '5px',
                                                            right: isOwn ? 'auto' : '8px',
                                                            left: isOwn ? '8px' : 'auto',
                                                        }}></i>
                                                    )}

                                                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {msg.content}
                                                    </div>

                                                    {!showHeader && (
                                                        <div style={{
                                                            fontSize: '0.62rem', color: '#9ca3af',
                                                            marginTop: '3px', textAlign: isOwn ? 'right' : 'left',
                                                        }}>
                                                            {formatTime(msg.created_at)}
                                                        </div>
                                                    )}

                                                    <div className="msg-actions" style={{
                                                        opacity: 0, transition: 'opacity 0.15s',
                                                        position: 'absolute', top: '-10px',
                                                        [isOwn ? 'left' : 'right']: '-4px',
                                                        display: 'flex', gap: '2px',
                                                        background: '#ffffff',
                                                        borderRadius: '8px', padding: '3px',
                                                        border: '1px solid #e5e7eb',
                                                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                                                    }}>
                                                        <button
                                                            onClick={() => togglePin(msg.id)}
                                                            title={msg.is_pinned ? 'Unpin' : 'Pin'}
                                                            style={{
                                                                background: 'transparent', border: 'none',
                                                                color: msg.is_pinned ? '#facc15' : '#6b7280',
                                                                cursor: 'pointer', padding: '4px 6px',
                                                                borderRadius: '6px', fontSize: '0.78rem',
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            <i className={`bi ${msg.is_pinned ? 'bi-pin-fill' : 'bi-pin-angle'}`}></i>
                                                        </button>
                                                        {isOwn && (
                                                            <button
                                                                onClick={() => hideMessage(msg.id)}
                                                                title="Delete"
                                                                style={{
                                                                    background: 'transparent', border: 'none',
                                                                    color: '#ef4444', cursor: 'pointer',
                                                                    padding: '4px 6px', borderRadius: '6px',
                                                                    fontSize: '0.78rem', lineHeight: 1,
                                                                }}
                                                            >
                                                                <i className="bi bi-trash3"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '0.85rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    background: '#ffffff',
                    flexShrink: 0,
                }}>
                    <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, position: 'relative' }} ref={emojiPickerRef}>
                            {showEmojiPicker && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '52px',
                                    left: 0,
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    padding: '8px',
                                    boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                    gap: '4px',
                                    zIndex: 10,
                                }}>
                                    {emojiOptions.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => addEmoji(emoji)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                fontSize: '1.1rem',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '6px',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                                placeholder="Type a message to the teacher lounge..."
                                rows={1}
                                style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '12px',
                                    padding: '10px 14px',
                                    color: '#1f2937',
                                    fontSize: '0.88rem',
                                    resize: 'none',
                                    outline: 'none',
                                    minHeight: '44px',
                                    maxHeight: '120px',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#93c5fd'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            title="Insert emoji"
                            style={{
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '12px',
                                width: '44px',
                                height: '44px',
                                color: '#4b5563',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            😊
                        </button>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            style={{
                                background: newMessage.trim()
                                    ? 'linear-gradient(135deg, #4285f4, #3b5998)'
                                    : '#f3f4f6',
                                border: newMessage.trim()
                                    ? '1px solid rgba(66,133,244,0.3)'
                                    : '1px solid #d1d5db',
                                borderRadius: '12px',
                                padding: '10px 20px',
                                color: newMessage.trim() ? '#fff' : '#9ca3af',
                                cursor: newMessage.trim() ? 'pointer' : 'default',
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                                height: '44px',
                            }}
                        >
                            {sending ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <><i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }}></i> Send</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TeacherCommunity;
