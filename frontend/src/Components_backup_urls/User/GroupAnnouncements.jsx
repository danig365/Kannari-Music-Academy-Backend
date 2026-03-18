import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const PRIORITY_META = {
  urgent: { label: 'Urgent', color: '#ef4444', icon: 'bi-exclamation-triangle-fill' },
  high:   { label: 'High',   color: '#f59e0b', icon: 'bi-exclamation-circle-fill' },
  normal: { label: 'Normal', color: '#3b82f6', icon: 'bi-info-circle-fill' },
  low:    { label: 'Low',    color: '#6b7280', icon: 'bi-dash-circle' },
};

const GroupAnnouncements = ({ groupId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [groupId]);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group/${groupId}/announcements/`);
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading announcements...</div>;

  // Separate pinned from regular
  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

  return (
    <div>
      {announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
          <i className="bi bi-megaphone" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', color: '#cbd5e1' }}></i>
          No announcements yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Pinned first */}
          {pinnedAnnouncements.length > 0 && (
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                <i className="bi bi-pin-fill me-1"></i>Pinned
              </div>
              {pinnedAnnouncements.map(a => renderAnnouncement(a, expandedId, setExpandedId))}
            </div>
          )}

          {/* Regular */}
          {regularAnnouncements.length > 0 && (
            <div>
              {pinnedAnnouncements.length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Recent
                </div>
              )}
              {regularAnnouncements.map(a => renderAnnouncement(a, expandedId, setExpandedId))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const renderAnnouncement = (a, expandedId, setExpandedId) => {
  const meta = PRIORITY_META[a.priority] || PRIORITY_META.normal;
  const isExpanded = expandedId === a.id;
  const isLong = a.content && a.content.length > 200;

  const timeAgo = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      key={a.id}
      style={{
        backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        borderLeft: `4px solid ${meta.color}`, padding: '16px', marginBottom: '10px',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h6 style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{a.title}</h6>
            {a.priority !== 'normal' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '2px 8px', borderRadius: '8px', fontSize: '10px',
                fontWeight: '700', backgroundColor: `${meta.color}15`, color: meta.color,
                textTransform: 'uppercase'
              }}>
                <i className={`bi ${meta.icon}`} style={{ fontSize: '10px' }}></i>
                {meta.label}
              </span>
            )}
            {a.is_pinned && <i className="bi bi-pin-fill" style={{ color: '#f59e0b', fontSize: '14px' }}></i>}
          </div>

          <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
            {isLong && !isExpanded ? a.content.substring(0, 200) + '...' : a.content}
          </div>

          {isLong && (
            <button
              onClick={() => setExpandedId(isExpanded ? null : a.id)}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '4px 0', marginTop: '4px' }}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>

      {/* File attachment */}
      {a.file && (
        <div style={{ marginTop: '10px' }}>
          <a
            href={a.file}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px',
              color: '#2563eb', fontSize: '13px', fontWeight: '600', textDecoration: 'none'
            }}
          >
            <i className="bi bi-paperclip"></i>Attached File
          </a>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <span><i className="bi bi-person me-1"></i>{a.author_name}</span>
        <span><i className="bi bi-clock me-1"></i>{timeAgo(a.created_at)}</span>
      </div>
    </div>
  );
};

export default GroupAnnouncements;
