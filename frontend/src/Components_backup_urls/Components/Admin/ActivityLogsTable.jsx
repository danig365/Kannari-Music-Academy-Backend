import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const ActivityLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    model_name: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const perPage = 30;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/audit/activity-logs/?limit=${perPage}&offset=${(page - 1) * perPage}`;
      if (filters.action) url += `&action=${filters.action}`;
      if (filters.model_name) url += `&model_name=${encodeURIComponent(filters.model_name)}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.date_from) url += `&date_from=${filters.date_from}`;
      if (filters.date_to) url += `&date_to=${filters.date_to}`;
      const res = await axios.get(url);
      setLogs(res.data.results || []);
      setTotal(res.data.count || 0);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    }
    setLoading(false);
  };

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({ action: '', model_name: '', search: '', date_from: '', date_to: '' });
    setPage(1);
    setTimeout(fetchLogs, 0);
  };

  const handleExport = () => {
    const headers = ['ID', 'Date', 'Action', 'Actor', 'Actor Type', 'Model', 'Object ID', 'Description', 'IP'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      l.action,
      `"${(l.actor || '').replace(/"/g, '""')}"`,
      l.actor_type,
      l.model_name,
      l.object_id || '-',
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.ip_address || '-',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const actionBadge = (action) => {
    const colors = {
      login: '#10b981', logout: '#6b7280',
      create: '#3b82f6', update: '#f59e0b', delete: '#ef4444',
      view: '#8b5cf6', export: '#06b6d4',
      message: '#7c3aed', submission: '#ec4899',
      session_join: '#10b981', session_leave: '#f97316',
      session_start: '#059669', session_end: '#dc2626',
    };
    const color = colors[action] || '#64748b';
    return (
      <span style={{
        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
        backgroundColor: `${color}15`, color: color,
        whiteSpace: 'nowrap'
      }}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const actorBadge = (type) => {
    const colors = { admin: '#ef4444', teacher: '#6366f1', student: '#3b82f6', parent: '#8b5cf6' };
    if (!type) return null;
    return (
      <span style={{
        padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: '600',
        backgroundColor: `${colors[type] || '#94a3b8'}15`, color: colors[type] || '#64748b',
        marginLeft: '6px'
      }}>
        {type}
      </span>
    );
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      {/* Filters */}
      <div className="card mb-3" style={{ border: '1px solid #e2e8f0' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Action</label>
              <select className="form-select form-select-sm" value={filters.action}
                onChange={e => setFilters({ ...filters, action: e.target.value })}>
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="message">Message</option>
                <option value="submission">Submission</option>
                <option value="session_join">Session Join</option>
                <option value="session_leave">Session Leave</option>
                <option value="session_start">Session Start</option>
                <option value="session_end">Session End</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Model</label>
              <input type="text" className="form-control form-control-sm" value={filters.model_name}
                onChange={e => setFilters({ ...filters, model_name: e.target.value })} placeholder="e.g. Message" />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Search</label>
              <input type="text" className="form-control form-control-sm" value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search description..." />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>From</label>
              <input type="date" className="form-control form-control-sm" value={filters.date_from}
                onChange={e => setFilters({ ...filters, date_from: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>To</label>
              <input type="date" className="form-control form-control-sm" value={filters.date_to}
                onChange={e => setFilters({ ...filters, date_to: e.target.value })} />
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleFilter}>
                <i className="bi bi-search me-1"></i>Filter
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleReset}>
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
              <button className="btn btn-outline-success btn-sm" onClick={handleExport}>
                <i className="bi bi-download me-1"></i>CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        <div style={{ padding: '8px 16px', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '13px' }}>
          <strong style={{ color: '#16a34a' }}>{total}</strong> <span style={{ color: '#64748b' }}>total logs</span>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#faf5ff', borderRadius: '8px', fontSize: '13px' }}>
          <strong style={{ color: '#7c3aed' }}>{logs.filter(l => l.action === 'message').length}</strong> <span style={{ color: '#64748b' }}>messages (this page)</span>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#fdf2f8', borderRadius: '8px', fontSize: '13px' }}>
          <strong style={{ color: '#ec4899' }}>{logs.filter(l => l.action === 'submission').length}</strong> <span style={{ color: '#64748b' }}>submissions (this page)</span>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', fontSize: '13px' }}>
          <strong style={{ color: '#059669' }}>{logs.filter(l => l.action.startsWith('session')).length}</strong> <span style={{ color: '#64748b' }}>session events (this page)</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-journal-x" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
          <p className="mt-2 text-muted">No activity logs found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ fontWeight: '600', color: '#475569', width: '60px' }}>ID</th>
                <th style={{ fontWeight: '600', color: '#475569', width: '140px' }}>Time</th>
                <th style={{ fontWeight: '600', color: '#475569', width: '110px' }}>Action</th>
                <th style={{ fontWeight: '600', color: '#475569', width: '180px' }}>Actor</th>
                <th style={{ fontWeight: '600', color: '#475569', width: '100px' }}>Model</th>
                <th style={{ fontWeight: '600', color: '#475569' }}>Description</th>
                <th style={{ fontWeight: '600', color: '#475569', width: '110px' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}>
                  <td style={{ color: '#94a3b8' }}>#{log.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span title={new Date(log.created_at).toLocaleString()}>{timeAgo(log.created_at)}</span>
                  </td>
                  <td>{actionBadge(log.action)}</td>
                  <td>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{log.actor || 'System'}</span>
                    {actorBadge(log.actor_type)}
                  </td>
                  <td>
                    {log.model_name && (
                      <span style={{ padding: '1px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '11px', color: '#475569' }}>
                        {log.model_name}
                      </span>
                    )}
                    {log.object_id && <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>#{log.object_id}</span>}
                  </td>
                  <td style={{ 
                    maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: '#475569'
                  }}>
                    {log.description}
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{log.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedLog && (
        <div className="card mt-3" style={{ border: '1px solid #e2e8f0' }}>
          <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8fafc', padding: '12px 16px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              Activity Log #{selectedLog.id}
            </span>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedLog(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div className="row g-3">
              <div className="col-md-3">
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Action</label>
                <div>{actionBadge(selectedLog.action)}</div>
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actor</label>
                <div style={{ fontWeight: '500' }}>{selectedLog.actor || 'System'} {actorBadge(selectedLog.actor_type)}</div>
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Model / Object</label>
                <div>{selectedLog.model_name || '-'} {selectedLog.object_id ? `#${selectedLog.object_id}` : ''}</div>
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Timestamp</label>
                <div style={{ fontSize: '13px' }}>{new Date(selectedLog.created_at).toLocaleString()}</div>
              </div>
              <div className="col-12">
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Description</label>
                <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedLog.description || 'No description'}
                </div>
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>IP Address</label>
                <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>{selectedLog.ip_address || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination pagination-sm justify-content-center">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(pageNum)}>{pageNum}</button>
                </li>
              );
            })}
            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
          <div className="text-center text-muted" style={{ fontSize: '12px' }}>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
          </div>
        </nav>
      )}
    </div>
  );
};

export default ActivityLogsTable;
