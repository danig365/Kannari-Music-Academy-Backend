import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const parentId = localStorage.getItem('parentId');
  const parentName = localStorage.getItem('parentName') || 'Parent';
  const baseUrl = API_BASE_URL;

  const [activeTab, setActiveTab] = useState('overview');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivity, setChildActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    document.title = 'Parent Dashboard — Kannari Music Academy';
    if (!parentId || localStorage.getItem('parentLoginStatus') !== 'true') {
      navigate('/parent/login');
      return;
    }
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (parentId) fetchChildren();
  }, [parentId]);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/parent/${parentId}/children/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.children || [];
        setChildren(list);
        if (list.length > 0 && !selectedChild) {
          setSelectedChild(list[0]);
          fetchChildActivity(list[0].student_id);
        }
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    }
    setLoading(false);
  };

  const fetchChildActivity = async (studentId) => {
    if (!studentId) return;
    setActivityLoading(true);
    try {
      const [enrollRes, accessRes] = await Promise.all([
        fetch(`${baseUrl}/fetch-enrolled-courses/${studentId}/`).then(r => r.ok ? r.json() : []),
        fetch(`${baseUrl}/student/${studentId}/minor-access-status/`).then(r => r.ok ? r.json() : {}),
      ]);
      setChildActivity({
        enrolledCourses: Array.isArray(enrollRes) ? enrollRes : [],
        accessStatus: accessRes,
      });
    } catch (err) {
      console.error('Error fetching child activity:', err);
      setChildActivity({ enrolledCourses: [], accessStatus: {} });
    }
    setActivityLoading(false);
  };

  const selectChild = (child) => {
    setSelectedChild(child);
    fetchChildActivity(child.student_id);
  };

  const handleAuthorize = async (child) => {
    try {
      const res = await fetch(`${baseUrl}/parent/${parentId}/student/${child.student_id}/authorize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      if (res.ok) {
        fetchChildren();
        if (selectedChild && selectedChild.student_id === child.student_id) {
          fetchChildActivity(child.student_id);
        }
      }
    } catch (err) {
      console.error('Error authorizing child:', err);
    }
  };

  const handleConsentToggle = async (child, consentType, action) => {
    try {
      const url = consentType === 'live_sessions'
        ? `${baseUrl}/parent/${parentId}/student/${child.student_id}/live-consent/`
        : `${baseUrl}/parent/${parentId}/student/${child.student_id}/authorize/`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchChildren();
        if (selectedChild?.student_id === child.student_id) {
          fetchChildActivity(child.student_id);
        }
      }
    } catch (err) {
      console.error('Error toggling consent:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parentId');
    localStorage.removeItem('parentName');
    localStorage.removeItem('parentLoginStatus');
    navigate('/parent/login');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'bi-grid-1x2-fill' },
    { id: 'consent', label: 'Consent', icon: 'bi-shield-check' },
    { id: 'messages', label: 'Messages', icon: 'bi-chat-dots-fill' },
  ];

  const statusBadge = (status) => {
    const styles = {
      approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      revoked: { bg: '#fee2e2', color: '#991b1b', label: 'Revoked' },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  // ===== OVERVIEW TAB =====
  const renderOverview = () => (
    <div>
      {/* Child selector */}
      {children.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {children.map((child, i) => (
            <button key={child.student_id || i} onClick={() => selectChild(child)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                backgroundColor: selectedChild?.student_id === child.student_id ? '#7c3aed' : '#f1f5f9',
                color: selectedChild?.student_id === child.student_id ? '#fff' : '#475569',
                transition: 'all 0.2s'
              }}>
              {child.student_name || 'Child'}
            </button>
          ))}
        </div>
      )}

      {activityLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div> Loading activity...
        </div>
      ) : selectedChild && childActivity ? (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          {/* Student Info Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gridColumn: isMobile ? '1' : '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '20px' }}>
                {(selectedChild.student_name || 'S').substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontWeight: '700', color: '#1e293b', fontSize: '18px' }}>{selectedChild.student_name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {selectedChild.student_email} &nbsp;&bull;&nbsp; {statusBadge(selectedChild.link_status)}
                </p>
              </div>
            </div>
          </div>

          {/* Access Status Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h4 style={{ margin: '0 0 16px', fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
              <i className="bi bi-shield-check me-2" style={{ color: '#7c3aed' }}></i>Access Status
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Enroll in Courses', value: childActivity.accessStatus?.can_enroll },
                { label: 'Send Messages', value: childActivity.accessStatus?.can_send_messages },
                { label: 'Join Live Sessions', value: childActivity.accessStatus?.can_join_sessions },
                { label: 'Parent Approved', value: childActivity.accessStatus?.has_parent_approval },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>{item.label}</span>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: item.value ? '#d1fae5' : '#fee2e2', color: item.value ? '#065f46' : '#991b1b', fontSize: '11px'
                  }}>
                    <i className={`bi ${item.value ? 'bi-check' : 'bi-x'}`}></i>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Courses Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h4 style={{ margin: '0 0 16px', fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
              <i className="bi bi-book me-2" style={{ color: '#3b82f6' }}></i>Enrolled Courses
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>
                ({childActivity.enrolledCourses.length})
              </span>
            </h4>
            {childActivity.enrolledCourses.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No courses enrolled yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {childActivity.enrolledCourses.slice(0, 5).map((enr, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <i className="bi bi-mortarboard" style={{ color: '#3b82f6', fontSize: '16px' }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {enr.course?.title || enr.title || 'Course'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {enr.course?.techs || enr.teacher_name || ''}
                      </div>
                    </div>
                  </div>
                ))}
                {childActivity.enrolledCourses.length > 5 && (
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                    +{childActivity.enrolledCourses.length - 5} more courses
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <i className="bi bi-person-hearts" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
          <p style={{ marginTop: '12px', fontSize: '15px' }}>Select a child to view their activity</p>
        </div>
      )}
    </div>
  );

  // ===== CONSENT TAB =====
  const renderConsent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {children.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <i className="bi bi-people" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
          <p style={{ marginTop: '12px' }}>No linked children found</p>
        </div>
      ) : children.map((child, idx) => (
        <div key={child.student_id || idx} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                {(child.student_name || 'S').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{child.student_name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{child.student_email}</p>
              </div>
            </div>
            {statusBadge(child.link_status)}
          </div>

          {/* Consent controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Account Authorization */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Account Authorization</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Allow this child to use the platform</div>
              </div>
              {child.link_status === 'approved' ? (
                <button onClick={() => handleConsentToggle(child, 'account', 'revoke')}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                  Revoke
                </button>
              ) : (
                <button onClick={() => handleAuthorize(child)}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46' }}>
                  Approve
                </button>
              )}
            </div>

            {/* Live Sessions Consent */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Live Sessions</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Allow child to join live video/audio sessions</div>
              </div>
              {child.live_sessions_status === 'approved' ? (
                <button onClick={() => handleConsentToggle(child, 'live_sessions', 'revoke')}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                  Revoke
                </button>
              ) : (
                <button onClick={() => handleConsentToggle(child, 'live_sessions', 'approve')}
                  style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46' }}>
                  Approve
                </button>
              )}
            </div>

            {/* Authorization Mode */}
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Authorization Mode</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {child.authorization_mode === 'pre_authorized'
                  ? '✓ Pre-authorized (child can join sessions without per-session approval)'
                  : '🔒 Per-session login (you must approve each session individually)'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ===== MESSAGES TAB =====
  const renderMessages = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <i className="bi bi-chat-dots-fill" style={{ fontSize: '48px', color: '#c4b5fd' }}></i>
      <p style={{ color: '#64748b', marginTop: '16px', fontSize: '15px', fontWeight: '500' }}>
        Teacher conversations with your children
      </p>
      <button onClick={() => navigate('/parent/messages')}
        style={{
          marginTop: '16px', padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
        }}>
        <i className="bi bi-chat-dots me-2"></i>Open Messages
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-people-fill" style={{ fontSize: '16px', color: '#fff' }}></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Parent Portal</h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Kannari Music Academy</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              <i className="bi bi-person-circle me-1"></i>{parentName}
            </span>
            <button onClick={handleLogout}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: '500', backgroundColor: '#fff', color: '#64748b' }}>
              <i className="bi bi-box-arrow-right me-1"></i>Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '0', padding: '0 24px' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                backgroundColor: 'transparent', color: activeTab === tab.id ? '#7c3aed' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
              <i className={`bi ${tab.icon}`} style={{ fontSize: '14px' }}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '12px' }}>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'consent' && renderConsent()}
            {activeTab === 'messages' && renderMessages()}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
