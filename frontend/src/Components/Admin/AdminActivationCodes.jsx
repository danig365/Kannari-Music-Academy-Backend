import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const STATUS_STYLE = {
    unused: { bg: '#dcfce7', color: '#16a34a', label: 'Unused' },
    used: { bg: '#e5e7eb', color: '#374151', label: 'Used' },
    revoked: { bg: '#fee2e2', color: '#dc2626', label: 'Revoked' },
};

const AdminActivationCodes = () => {
    const adminId = localStorage.getItem('adminId');
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [count, setCount] = useState(1);
    const [note, setNote] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const fetchCodes = useCallback(async () => {
        setLoading(true);
        try {
            const q = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
            const res = await axios.get(`${baseUrl}/admin/activation-codes/?requester_admin_id=${adminId}${q}`);
            setCodes(res.data.codes || []);
        } catch (e) {
            setCodes([]);
        } finally {
            setLoading(false);
        }
    }, [adminId, statusFilter]);

    useEffect(() => {
        document.title = 'Activation Codes | Kannari Music Academy';
        fetchCodes();
    }, [fetchCodes]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            await axios.post(`${baseUrl}/admin/activation-codes/generate/`, {
                requester_admin_id: adminId,
                count: parseInt(count) || 1,
                note: note.trim() || null,
                expires_at: expiresAt || null,
            });
            setNote('');
            setExpiresAt('');
            setCount(1);
            setStatusFilter('all');
            fetchCodes();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not generate codes.');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async (code) => {
        if (!window.confirm(`Revoke code ${code.code}? It can no longer be used.`)) return;
        try {
            await axios.post(`${baseUrl}/admin/activation-code/${code.id}/revoke/`, { requester_admin_id: adminId });
            fetchCodes();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not revoke code.');
        }
    };

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code.code).then(() => {
            setCopiedId(code.id);
            setTimeout(() => setCopiedId(null), 1500);
        });
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontWeight: 800, color: '#101C2C', marginBottom: 4 }}>
                <i className="bi bi-key-fill me-2"></i>Activation Codes
            </h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Generate single-use codes to activate pending student accounts. Give a code to a student — once they enter it, it can't be reused.
            </p>

            {/* Generate */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h5 style={{ fontWeight: 700, color: '#101C2C', marginBottom: 16 }}>Generate codes</h5>
                <form onSubmit={handleGenerate} className="row g-3 align-items-end">
                    <div className="col-md-2">
                        <label className="form-label">How many</label>
                        <input type="number" min="1" max="100" className="form-control" value={count}
                            onChange={(e) => setCount(e.target.value)} />
                    </div>
                    <div className="col-md-5">
                        <label className="form-label">Note (optional)</label>
                        <input type="text" className="form-control" placeholder="e.g. for John / March cohort"
                            value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Expires (optional)</label>
                        <input type="date" className="form-control" value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                        <button type="submit" className="btn btn-primary w-100" disabled={generating}
                            style={{ background: '#101C2C', border: 'none' }}>
                            {generating ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['all', 'unused', 'used', 'revoked'].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className="btn btn-sm"
                        style={{
                            background: statusFilter === s ? '#101C2C' : '#f1f5f9',
                            color: statusFilter === s ? '#fff' : '#374151',
                            border: 'none', textTransform: 'capitalize',
                        }}>
                        {s}
                    </button>
                ))}
            </div>

            {/* List */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
                ) : codes.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No codes yet. Generate some above.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table mb-0" style={{ minWidth: 720 }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th>Code</th><th>Status</th><th>Note</th><th>Used by</th>
                                    <th>Created</th><th>Expires</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.map((c) => {
                                    const st = STATUS_STYLE[c.status] || STATUS_STYLE.unused;
                                    return (
                                        <tr key={c.id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', color: '#101C2C' }}>
                                                {c.code}
                                            </td>
                                            <td>
                                                <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ color: '#6b7280' }}>{c.note || '—'}</td>
                                            <td style={{ color: '#6b7280' }}>{c.used_by_name || '—'}</td>
                                            <td style={{ color: '#6b7280', fontSize: 13 }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                                            <td style={{ color: '#6b7280', fontSize: 13 }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <button className="btn btn-sm btn-outline-secondary" title="Copy code" onClick={() => copyCode(c)}>
                                                        <i className={`bi ${copiedId === c.id ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                                    </button>
                                                    {c.status === 'unused' && (
                                                        <button className="btn btn-sm btn-outline-danger" title="Revoke" onClick={() => handleRevoke(c)}>
                                                            <i className="bi bi-x-circle"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminActivationCodes;
