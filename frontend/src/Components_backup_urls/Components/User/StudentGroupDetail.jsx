import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Sidebar from './Sidebar';
import GroupChat from './GroupChat';
import GroupSessions from './GroupSessions';
import GroupAnnouncements from './GroupAnnouncements';

const baseUrl = API_BASE_URL;

const StudentGroupDetail = ({ group, onBack }) => {
  const studentId = localStorage.getItem('studentId');
  const [activeTab, setActiveTab] = useState('chat');
  const [groupDetail, setGroupDetail] = useState(group);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${group.name} | Kannari Music Academy`;
    fetchGroupDetail();
  }, [group.id]);

  const fetchGroupDetail = async () => {
    try {
      const res = await axios.get(`${baseUrl}/group-class/${group.id}/`);
      setGroupDetail(prev => ({ ...prev, ...res.data }));
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { key: 'chat', icon: 'bi-chat-dots', label: 'Chat', count: groupDetail.message_count },
    { key: 'sessions', icon: 'bi-camera-video', label: 'Sessions', count: groupDetail.session_count, live: groupDetail.live_sessions > 0 },
    { key: 'announcements', icon: 'bi-megaphone', label: 'Announcements', count: groupDetail.announcement_count },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      {isMobile && sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', display: isMobile ? 'block' : 'none' }}>
            <i className="bi bi-list"></i>
          </button>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{groupDetail.name || group.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {groupDetail.student_count || group.student_count} students
              {groupDetail.teacher_name && ` • ${groupDetail.teacher_name}`}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  backgroundColor: activeTab === t.key ? '#fff' : 'transparent',
                  color: activeTab === t.key ? '#1e293b' : '#64748b',
                  boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s', position: 'relative'
                }}
              >
                <i className={`bi ${t.icon} me-1`}></i>
                {t.label}
                {t.live && (
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', marginLeft: '4px', verticalAlign: 'middle' }}></span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'chat' && <GroupChat groupId={group.id} studentId={studentId} />}
          {activeTab === 'sessions' && <GroupSessions groupId={group.id} studentId={studentId} />}
          {activeTab === 'announcements' && <GroupAnnouncements groupId={group.id} />}
        </div>
      </div>
    </div>
  );
};

export default StudentGroupDetail;
