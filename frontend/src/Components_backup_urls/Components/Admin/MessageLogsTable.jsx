import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const MessageLogsTable = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sender_type: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const perPage = 25;

  useEffect(() => {
    fetchMessages();
  }, [page]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/messages/?limit=${perPage}&offset=${(page - 1) * perPage}`;
      if (filters.sender_type) url += `&sender_type=${filters.sender_type}`;
      const res = await axios.get(url);
      const data = res.data;
      setMessages(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setLoading(false);
  };

  const handleFilter = () => {
    setPage(1);
    fetchMessages();
  };

  const handleExport = () => {
    // Build CSV from current messages
    const headers = ['ID', 'Date', 'Sender Type', 'Sender ID', 'Recipient Type', 'Content', 'Parent Link', 'Read'];
    const rows = filteredMessages.map(m => [
      m.id,
      new Date(m.created_at).toLocaleString(),
      m.sender_type,
      m.sender_teacher || m.sender_parent || m.sender_student || '-',
      m.recipient_type,
      `"${(m.content || '').replace(/"/g, '""')}"`,
      m.parent_link || '-',
      m.is_read ? 'Yes' : 'No',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `message_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Client-side search/date filtering
  const filteredMessages = messages.filter(m => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!(m.content || '').toLowerCase().includes(s) &&
          !(m.sender_display || '').toLowerCase().includes(s)) return false;
    }
    if (filters.date_from) {
      if (new Date(m.created_at) < new Date(filters.date_from)) return false;
    }
    if (filters.date_to) {
      if (new Date(m.created_at) > new Date(filters.date_to + 'T23:59:59')) return false;
    }
    return true;
  });

  const timeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const now = new Date(); const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const senderBadge = (type) => {
    const colors = { teacher: '#6366f1', parent: '#8b5cf6', student: '#3b82f6', admin: '#ef4444' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
        backgroundColor: `${colors[type] || '#94a3b8'}15`, color: colors[type] || '#64748b' }}>
        {type}
      </span>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="card mb-3" style={{ border: '1px solid #e2e8f0' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Sender Type</label>
              <select className="form-select form-select-sm" value={filters.sender_type}
                onChange={e => setFilters({ ...filters, sender_type: e.target.value })}>
                <option value="">All</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Search Content</label>
              <input type="text" className="form-control form-control-sm" value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search messages..." />
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
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleFilter}>
                <i className="bi bi-search me-1"></i>Filter
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                setFilters({ sender_type: '', search: '', date_from: '', date_to: '' });
                setPage(1);
                setTimeout(fetchMessages, 0);
              }}>
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
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          <strong>{filteredMessages.length}</strong> messages shown
        </span>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          <i className="bi bi-circle-fill text-success me-1" style={{ fontSize: '8px' }}></i>
          {filteredMessages.filter(m => m.is_read).length} read
        </span>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          <i className="bi bi-circle-fill text-warning me-1" style={{ fontSize: '8px' }}></i>
          {filteredMessages.filter(m => !m.is_read).length} unread
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary me-2"></div>Loading messages...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-5" style={{ color: '#94a3b8' }}>
          <i className="bi bi-chat-left-text" style={{ fontSize: '40px' }}></i>
          <p className="mt-2">No messages found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={{ fontWeight: '600', color: '#64748b', width: '50px' }}>#</th>
                <th style={{ fontWeight: '600', color: '#64748b' }}>Date</th>
                <th style={{ fontWeight: '600', color: '#64748b' }}>From</th>
                <th style={{ fontWeight: '600', color: '#64748b' }}>To</th>
                <th style={{ fontWeight: '600', color: '#64748b' }}>Message</th>
                <th style={{ fontWeight: '600', color: '#64748b', width: '60px' }}>Status</th>
                <th style={{ fontWeight: '600', color: '#64748b', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map(msg => (
                <tr key={msg.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMsg(selectedMsg?.id === msg.id ? null : msg)}>
                  <td style={{ color: '#94a3b8' }}>{msg.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{timeAgo(msg.created_at)}</td>
                  <td>{senderBadge(msg.sender_type)} <span className="ms-1">{msg.sender_display || '-'}</span></td>
                  <td>{senderBadge(msg.recipient_type)}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.content}
                  </td>
                  <td>
                    {msg.is_read ? (
                      <span style={{ color: '#10b981' }}><i className="bi bi-check-circle-fill"></i></span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}><i className="bi bi-circle-fill" style={{ fontSize: '8px' }}></i></span>
                    )}
                  </td>
                  <td>
                    <i className={`bi ${selectedMsg?.id === msg.id ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: '#94a3b8' }}></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Expanded message detail */}
          {selectedMsg && (
            <div className="card mb-3" style={{ border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div className="card-body" style={{ padding: '16px' }}>
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>From:</strong> {senderBadge(selectedMsg.sender_type)} {selectedMsg.sender_display || '-'}</p>
                    <p className="mb-1"><strong>To:</strong> {senderBadge(selectedMsg.recipient_type)}</p>
                    <p className="mb-1"><strong>Parent Link ID:</strong> {selectedMsg.parent_link || '-'}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Date:</strong> {selectedMsg.created_at ? new Date(selectedMsg.created_at).toLocaleString() : '-'}</p>
                    <p className="mb-1"><strong>Read:</strong> {selectedMsg.is_read ? 'Yes' : 'No'}</p>
                    <p className="mb-1"><strong>Message ID:</strong> {selectedMsg.id}</p>
                  </div>
                </div>
                <hr />
                <div style={{ whiteSpace: 'pre-wrap', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedMsg.content}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          <i className="bi bi-chevron-left me-1"></i>Previous
        </button>
        <span style={{ fontSize: '13px', color: '#64748b' }}>Page {page}</span>
        <button className="btn btn-outline-secondary btn-sm" disabled={messages.length < perPage} onClick={() => setPage(p => p + 1)}>
          Next<i className="bi bi-chevron-right ms-1"></i>
        </button>
      </div>
    </div>
  );
};

export default MessageLogsTable;
