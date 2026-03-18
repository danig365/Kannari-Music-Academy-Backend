import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../config';

const SchoolChatLock = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, locked, unlocked
    const [searchTerm, setSearchTerm] = useState('');
    const [actionModal, setActionModal] = useState(null); // { policy, action: 'lock' | 'unlock' }
    const [unlockDuration, setUnlockDuration] = useState(24);
    const [unlockNotes, setUnlockNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchPolicies = useCallback(async () => {
        try {
            let url = `${API_BASE_URL}/chat-lock-policies/`;
            if (filter === 'locked') url += '?locked=true';
            else if (filter === 'unlocked') url += '?locked=false';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch chat lock policies');
            const data = await res.json();
            setPolicies(data);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        fetchPolicies();
    }, [fetchPolicies]);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchPolicies, 30000);
        return () => clearInterval(interval);
    }, [fetchPolicies]);

    const handleToggle = async () => {
        if (!actionModal) return;
        setActionLoading(true);
        try {
            const { policy, action } = actionModal;
            const body = { action };
            if (action === 'unlock') {
                body.duration_hours = unlockDuration;
                body.notes = unlockNotes;
                const schoolId = localStorage.getItem('schoolId');
                if (schoolId) body.school_id = schoolId;
            }
            const res = await fetch(`${API_BASE_URL}/admin/chat-lock/${policy.parent_link}/toggle/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.bool) {
                setSuccessMsg(data.message);
                setActionModal(null);
                setUnlockDuration(24);
                setUnlockNotes('');
                fetchPolicies();
                setTimeout(() => setSuccessMsg(''), 4000);
            } else {
                setError(data.error || 'Action failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredPolicies = policies.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (p.student_name || '').toLowerCase().includes(term) ||
            (p.parent_name || '').toLowerCase().includes(term) ||
            (p.student_email || '').toLowerCase().includes(term) ||
            (p.parent_email || '').toLowerCase().includes(term) ||
            (p.teacher_names || []).some(t => t.toLowerCase().includes(term))
        );
    });

    const getAgeTierBadge = (tier) => {
        switch (tier) {
            case '18_plus': return { label: '18+', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
            case '13_17': return { label: '13-17', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
            case '4_12': return { label: '4-12', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
            default: return { label: 'Unknown', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
        }
    };

    const getLockReasonLabel = (reason) => {
        switch (reason) {
            case 'age_default': return 'Age Default';
            case 'admin_lock': return 'Admin Lock';
            case 'policy': return 'Policy Violation';
            default: return reason || '—';
        }
    };

    const getStatusInfo = (policy) => {
        const allowed = policy.chat_allowed?.allowed;
        const reason = policy.chat_allowed?.reason || '';
        if (allowed) {
            return { label: 'Chat Open', color: '#10b981', icon: 'bi-unlock-fill' };
        }
        return { label: 'Chat Locked', color: '#ef4444', icon: 'bi-lock-fill' };
    };

    const stats = {
        total: policies.length,
        locked: policies.filter(p => !p.chat_allowed?.allowed).length,
        unlocked: policies.filter(p => p.chat_allowed?.allowed).length,
        minors: policies.filter(p => p.age_tier === '4_12').length,
        teens: policies.filter(p => p.age_tier === '13_17').length,
    };

    if (loading && policies.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-muted">Loading chat lock policies...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
                        <i className="bi bi-shield-lock me-2" style={{ color: '#6366f1' }}></i>
                        Chat Lock Management
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        Control parent-teacher messaging based on student age and safety policies
                    </p>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={() => { setLoading(true); fetchPolicies(); }}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
            </div>

            {/* Success / Error */}
            {successMsg && (
                <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-3" style={{ fontSize: '14px' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
                </div>
            )}
            {error && (
                <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3" style={{ fontSize: '14px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                    <button className="btn-close btn-sm ms-auto" onClick={() => setError('')}></button>
                </div>
            )}

            {/* Stats Row */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Pairs', value: stats.total, icon: 'bi-people', color: '#6366f1' },
                    { label: 'Currently Locked', value: stats.locked, icon: 'bi-lock-fill', color: '#ef4444' },
                    { label: 'Currently Open', value: stats.unlocked, icon: 'bi-unlock-fill', color: '#10b981' },
                    { label: 'Ages 4-12', value: stats.minors, icon: 'bi-shield-exclamation', color: '#f59e0b' },
                    { label: 'Ages 13-17', value: stats.teens, icon: 'bi-shield-check', color: '#3b82f6' },
                ].map((stat, i) => (
                    <div className="col-6 col-md" key={i}>
                        <div className="rounded-3 p-3 text-center" style={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                            <i className={`bi ${stat.icon} d-block mb-1`} style={{ fontSize: '20px', color: stat.color }}></i>
                            <div className="fw-bold" style={{ fontSize: '22px', color: '#1e293b' }}>{stat.value}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div className="btn-group btn-group-sm">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'locked', label: 'Locked' },
                        { key: 'unlocked', label: 'Unlocked' },
                    ].map(f => (
                        <button
                            key={f.key}
                            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="ms-auto" style={{ maxWidth: '300px', flex: '1 1 200px' }}>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search student, parent, teacher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Policies Table */}
            {filteredPolicies.length === 0 ? (
                <div className="text-center py-5" style={{ backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                    <i className="bi bi-shield-check d-block mb-2" style={{ fontSize: '40px', color: '#d1d5db' }}></i>
                    <p className="text-muted mb-0">
                        {searchTerm ? 'No matching records found' : 'No chat lock policies found'}
                    </p>
                </div>
            ) : (
                <div className="rounded-3" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0" style={{ fontSize: '14px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                                    <th className="py-3 px-3" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Student</th>
                                    <th className="py-3 px-3" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Parent</th>
                                    <th className="py-3 px-3" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Teacher(s)</th>
                                    <th className="py-3 px-3 text-center" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Age Tier</th>
                                    <th className="py-3 px-3 text-center" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                                    <th className="py-3 px-3" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Reason</th>
                                    <th className="py-3 px-3" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Unlock Expires</th>
                                    <th className="py-3 px-3 text-center" style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPolicies.map((policy) => {
                                    const statusInfo = getStatusInfo(policy);
                                    const tierBadge = getAgeTierBadge(policy.age_tier);
                                    return (
                                        <tr key={policy.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td className="py-3 px-3">
                                                <div className="fw-medium" style={{ color: '#1e293b' }}>{policy.student_name || '—'}</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{policy.student_email || ''}</div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="fw-medium" style={{ color: '#1e293b' }}>{policy.parent_name || '—'}</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {policy.parent_email || ''} 
                                                    {policy.relationship && <span className="ms-1 text-capitalize">({policy.relationship})</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {(policy.teacher_names || []).length > 0 ? (
                                                    policy.teacher_names.map((name, i) => (
                                                        <span key={i} className="badge me-1 mb-1" style={{
                                                            backgroundColor: 'rgba(99,102,241,0.1)',
                                                            color: '#6366f1',
                                                            fontWeight: 500,
                                                            fontSize: '12px'
                                                        }}>{name}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: '12px' }}>No teacher assigned</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className="badge" style={{
                                                    backgroundColor: tierBadge.bg,
                                                    color: tierBadge.color,
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    padding: '4px 10px'
                                                }}>{tierBadge.label}</span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span style={{ color: statusInfo.color, fontWeight: 600, fontSize: '13px' }}>
                                                    <i className={`bi ${statusInfo.icon} me-1`}></i>{statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div style={{ fontSize: '13px', color: '#475569' }}>
                                                    {policy.chat_allowed?.reason || getLockReasonLabel(policy.lock_reason)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {policy.unlock_expires_at ? (
                                                    <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 500 }}>
                                                        <i className="bi bi-clock me-1"></i>
                                                        {new Date(policy.unlock_expires_at).toLocaleString()}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: '12px' }}>—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {policy.age_tier === '18_plus' ? (
                                                    <span className="text-muted" style={{ fontSize: '12px' }}>N/A (Adult)</span>
                                                ) : policy.chat_allowed?.allowed ? (
                                                    <button
                                                        className="btn btn-sm px-3 py-1"
                                                        style={{
                                                            backgroundColor: 'rgba(239,68,68,0.1)',
                                                            color: '#ef4444',
                                                            border: '1px solid rgba(239,68,68,0.2)',
                                                            fontWeight: 500,
                                                            fontSize: '12px'
                                                        }}
                                                        onClick={() => setActionModal({ policy, action: 'lock' })}
                                                    >
                                                        <i className="bi bi-lock me-1"></i>Lock
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm px-3 py-1"
                                                        style={{
                                                            backgroundColor: 'rgba(16,185,129,0.1)',
                                                            color: '#10b981',
                                                            border: '1px solid rgba(16,185,129,0.2)',
                                                            fontWeight: 500,
                                                            fontSize: '12px'
                                                        }}
                                                        onClick={() => setActionModal({ policy, action: 'unlock' })}
                                                    >
                                                        <i className="bi bi-unlock me-1"></i>Unlock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-3 p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                <div className="fw-medium mb-2" style={{ color: '#475569' }}><i className="bi bi-info-circle me-1"></i> Chat Lock Rules</div>
                <div className="row g-2">
                    <div className="col-md-4">
                        <span className="badge me-1" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Ages 4-12</span>
                        Chat locked by default. Only unlocked during live sessions or by admin.
                    </div>
                    <div className="col-md-4">
                        <span className="badge me-1" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Ages 13-17</span>
                        Allowed during teacher office hours and live sessions.
                    </div>
                    <div className="col-md-4">
                        <span className="badge me-1" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Ages 18+</span>
                        Chat always available. No restrictions.
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setActionModal(null)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                            <div className="modal-header border-0 pb-0 px-4 pt-4">
                                <h5 className="modal-title fw-bold" style={{ color: '#1e293b' }}>
                                    {actionModal.action === 'lock' ? (
                                        <><i className="bi bi-lock-fill text-danger me-2"></i>Lock Chat</>
                                    ) : (
                                        <><i className="bi bi-unlock-fill text-success me-2"></i>Unlock Chat</>
                                    )}
                                </h5>
                                <button className="btn-close" onClick={() => setActionModal(null)}></button>
                            </div>
                            <div className="modal-body px-4 py-3">
                                <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb' }}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span style={{ color: '#64748b', fontSize: '13px' }}>Student:</span>
                                        <span className="fw-medium" style={{ fontSize: '13px' }}>{actionModal.policy.student_name}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span style={{ color: '#64748b', fontSize: '13px' }}>Parent:</span>
                                        <span className="fw-medium" style={{ fontSize: '13px' }}>{actionModal.policy.parent_name}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span style={{ color: '#64748b', fontSize: '13px' }}>Age Tier:</span>
                                        <span className="fw-medium" style={{ fontSize: '13px' }}>
                                            {getAgeTierBadge(actionModal.policy.age_tier).label}
                                        </span>
                                    </div>
                                </div>

                                {actionModal.action === 'lock' ? (
                                    <div className="alert alert-warning py-2" style={{ fontSize: '13px' }}>
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        This will immediately lock chat for this parent-student pair. 
                                        The parent will not be able to send or receive teacher messages until unlocked.
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label fw-medium" style={{ fontSize: '13px', color: '#475569' }}>
                                                Unlock Duration
                                            </label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {[
                                                    { val: 1, label: '1 Hour' },
                                                    { val: 4, label: '4 Hours' },
                                                    { val: 24, label: '24 Hours' },
                                                    { val: 72, label: '3 Days' },
                                                    { val: 168, label: '1 Week' },
                                                    { val: 720, label: '30 Days' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.val}
                                                        className={`btn btn-sm ${unlockDuration === opt.val ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() => setUnlockDuration(opt.val)}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-2">
                                                <label className="form-label" style={{ fontSize: '12px', color: '#6b7280' }}>Or custom hours:</label>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    style={{ maxWidth: '120px' }}
                                                    value={unlockDuration}
                                                    onChange={(e) => setUnlockDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label fw-medium" style={{ fontSize: '13px', color: '#475569' }}>
                                                Notes (optional)
                                            </label>
                                            <textarea
                                                className="form-control form-control-sm"
                                                rows="2"
                                                placeholder="Reason for unlock..."
                                                value={unlockNotes}
                                                onChange={(e) => setUnlockNotes(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer border-0 px-4 pb-4 pt-0">
                                <button className="btn btn-light btn-sm" onClick={() => setActionModal(null)}>Cancel</button>
                                <button
                                    className={`btn btn-sm ${actionModal.action === 'lock' ? 'btn-danger' : 'btn-success'}`}
                                    onClick={handleToggle}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <><span className="spinner-border spinner-border-sm me-1"></span>Processing...</>
                                    ) : actionModal.action === 'lock' ? (
                                        <><i className="bi bi-lock me-1"></i>Confirm Lock</>
                                    ) : (
                                        <><i className="bi bi-unlock me-1"></i>Confirm Unlock ({unlockDuration}h)</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolChatLock;
