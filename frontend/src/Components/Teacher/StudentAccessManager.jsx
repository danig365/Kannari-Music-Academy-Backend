import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

// Small 3-way segmented control: Auto / Unlocked / Locked
const Seg = ({ value, onChange, size = 'sm' }) => {
    const opts = [
        { v: 'auto', label: 'Auto', icon: 'bi-calendar-week', color: '#64748b' },
        { v: 'unlocked', label: 'Unlocked', icon: 'bi-unlock-fill', color: '#16a34a' },
        { v: 'locked', label: 'Locked', icon: 'bi-lock-fill', color: '#dc2626' },
    ];
    const cur = value || 'auto';
    return (
        <div style={{ display: 'inline-flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {opts.map((o) => (
                <button key={o.v} type="button" onClick={() => onChange(o.v)}
                    title={o.label}
                    style={{
                        border: 'none', cursor: 'pointer',
                        padding: size === 'sm' ? '4px 9px' : '6px 12px',
                        fontSize: size === 'sm' ? 12 : 13, fontWeight: 600,
                        background: cur === o.v ? o.color : '#fff',
                        color: cur === o.v ? '#fff' : '#94a3b8',
                    }}>
                    <i className={`bi ${o.icon}`}></i>{size !== 'sm' && <span> {o.label}</span>}
                </button>
            ))}
        </div>
    );
};

const StudentAccessManager = ({ studentId, studentName, courseId, requesterType = 'teacher', requesterId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [saving, setSaving] = useState(false);

    const auth = useCallback(() => ({ requester_type: requesterType, requester_id: requesterId }), [requesterType, requesterId]);

    const fetchState = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/student/${studentId}/course/${courseId}/access-state/`);
            setData(res.data);
        } catch (e) {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [studentId, courseId]);

    useEffect(() => { fetchState(); }, [fetchState]);

    const post = async (url, body) => {
        setSaving(true);
        try {
            await axios.post(`${baseUrl}${url}`, { ...auth(), ...body });
            await fetchState();
        } catch (err) {
            alert(err.response?.data?.error || 'Could not update access.');
        } finally {
            setSaving(false);
        }
    };

    const setCourseMode = (mode) => post(`/student/${studentId}/course/${courseId}/access-mode/`, { mode });
    const setModule = (chapterId, state) => post(`/student/${studentId}/module/${chapterId}/access/`, { state });
    const setLesson = (lessonId, state) => post(`/student/${studentId}/lesson/${lessonId}/access/`, { state });

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 720, margin: '30px 0', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                {/* Header */}
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h5 style={{ margin: 0, fontWeight: 800, color: '#101C2C' }}>Manage Access</h5>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                            {studentName || `Student #${studentId}`}{data?.course_title ? ` · ${data.course_title}` : ''}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ padding: 22, opacity: saving ? 0.6 : 1, pointerEvents: saving ? 'none' : 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>Loading…</div>
                    ) : !data ? (
                        <div style={{ textAlign: 'center', color: '#dc2626', padding: 30 }}>Could not load access. Is the student enrolled in this course?</div>
                    ) : (
                        <>
                            {/* Course-level mode */}
                            <div style={{ background: '#F7F3EA', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#101C2C' }}>Whole-course access</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Auto = one module/week · Unlocked = full self-paced · Locked = open modules/lessons individually below</div>
                                </div>
                                <Seg value={data.access_mode} onChange={setCourseMode} size="lg" />
                            </div>

                            {/* Modules + lessons */}
                            {data.modules.map((m, i) => (
                                <div key={m.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            <button onClick={() => setExpanded((p) => ({ ...p, [m.id]: !p[m.id] }))}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                                <i className={`bi ${expanded[m.id] ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                            </button>
                                            <span style={{
                                                width: 22, height: 22, borderRadius: '50%', background: m.unlocked ? '#dcfce7' : '#fee2e2',
                                                color: m.unlocked ? '#16a34a' : '#dc2626', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <i className={`bi ${m.unlocked ? 'bi-unlock' : 'bi-lock'}`}></i>
                                            </span>
                                            <span style={{ fontWeight: 600, color: '#101C2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {i + 1}. {m.title}
                                            </span>
                                        </div>
                                        <Seg value={m.student_override} onChange={(v) => setModule(m.id, v)} />
                                    </div>

                                    {expanded[m.id] && (
                                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '6px 14px 12px 44px' }}>
                                            {m.lessons.length === 0 ? (
                                                <div style={{ color: '#94a3b8', fontSize: 13, padding: '6px 0' }}>No lessons.</div>
                                            ) : m.lessons.map((l) => (
                                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 10 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                        <i className={`bi ${l.locked ? 'bi-lock text-danger' : 'bi-unlock text-success'}`} style={{ fontSize: 12 }}></i>
                                                        <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                                                    </span>
                                                    <Seg value={l.student_override} onChange={(v) => setLesson(l.id, v)} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAccessManager;
