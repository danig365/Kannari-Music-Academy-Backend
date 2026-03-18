import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Sidebar from './Sidebar';
import StudentGroupDetail from './StudentGroupDetail';
import './EnhancedDashboard.css';

const baseUrl = API_BASE_URL;

const StudentGroups = () => {
  const studentId = localStorage.getItem('studentId');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.title = 'My Groups | Kannari Music Academy';
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${baseUrl}/student/${studentId}/my-groups/`);
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
    setLoading(false);
  };

  if (selectedGroup) {
    return <StudentGroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      {isMobile && sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', marginLeft: isMobile ? 0 : '250px' }}>
        <div className="mobile-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <i className="bi bi-list"></i>
          </button>
          <div className="logo-mini">Kannari Music Academy</div>
        </div>

        <div style={{ padding: '32px', width: '100%' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>
              <i className="bi bi-diagram-3 me-2"></i>My Groups
            </h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>View your group classes, chat with members, and join sessions.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>Loading groups...</div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
              <i className="bi bi-diagram-3" style={{ fontSize: '40px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
              You're not part of any group classes yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  style={{
                    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                    padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
                    borderLeft: group.live_now ? '4px solid #10b981' : '4px solid #6366f1'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {group.name}
                        {group.live_now && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534', animation: 'pulse 2s infinite' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                            LIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        {group.school_name} {group.teacher_name && <span>&bull; {group.teacher_name}</span>}
                      </div>
                      {group.schedule && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          <i className="bi bi-clock me-1"></i>{group.schedule}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                        <i className="bi bi-people me-1"></i>{group.student_count} students
                      </span>
                      {group.upcoming_sessions > 0 && (
                        <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                          <i className="bi bi-camera-video me-1"></i>{group.upcoming_sessions} upcoming
                        </span>
                      )}
                      {group.announcement_count > 0 && (
                        <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e' }}>
                          <i className="bi bi-megaphone me-1"></i>{group.announcement_count}
                        </span>
                      )}
                    </div>
                  </div>
                  {group.description && (
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '10px', lineHeight: '1.5' }}>
                      {group.description.length > 150 ? group.description.substring(0, 150) + '...' : group.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGroups;
