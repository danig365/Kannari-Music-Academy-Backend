import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SchoolSidebar = ({ isOpen = false, setIsOpen = null, isMobile = false, onNavigate = null }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const schoolName = localStorage.getItem('schoolName');

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleNavClick = (e, path) => {
        if (isMobile) {
            e.preventDefault();
            e.stopPropagation();
            if (setIsOpen) {
                setIsOpen(false);
            }
            if (onNavigate) {
                onNavigate(path);
            } else {
                setTimeout(() => {
                    navigate(path);
                }, 100);
            }
        }
    };

    const navItems = [
        { path: '/school-dashboard', icon: 'bi-grid', label: 'Dashboard' },
        { path: '/school/teachers', icon: 'bi-person-check', label: 'Teachers' },
        { path: '/school/students', icon: 'bi-people', label: 'Students' },
        { path: '/school/group-classes', icon: 'bi-diagram-3', label: 'Group Classes' },
        { path: '/school/lesson-assignments', icon: 'bi-journal-bookmark', label: 'Lesson Assignments' },
        { path: '/school/progress', icon: 'bi-graph-up', label: 'Progress Overview' },
        { path: '/school/chat-locks', icon: 'bi-shield-lock', label: 'Chat Lock Management' },
    ];

    return (
        <div className="d-flex flex-column h-100" style={{
            backgroundColor: '#0f1624',
            color: '#8b92a7',
            width: isMobile ? '100%' : '260px',
            height: '100%',
            maxHeight: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'
                        }}>
                        <i className="bi bi-building text-white fs-4"></i>
                    </div>
                    <div>
                        <div className="fw-bold text-white" style={{ fontSize: '18px' }}>Kannari Music Academy</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>School Portal</div>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-grow-1 py-3">
                <nav>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={(e) => handleNavClick(e, item.path)}
                            className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                            style={{
                                color: isActive(item.path) ? '#fff' : '#8b92a7',
                                backgroundColor: isActive(item.path) ? 'rgba(13, 110, 253, 0.15)' : 'transparent',
                                borderLeft: isActive(item.path) ? '3px solid #0d6efd' : '3px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item.path)) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = '#fff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.path)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#8b92a7';
                                }
                            }}
                        >
                            <i className={`bi ${item.icon} me-3`} style={{ fontSize: '18px' }}></i>
                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                                fontSize: '16px'
                            }}>
                            {schoolName ? schoolName.substring(0, 2).toUpperCase() : 'SC'}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="text-white fw-medium" style={{ fontSize: '14px' }}>
                                {schoolName || 'School'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                School Admin
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <Link
                            to="/school/settings"
                            onClick={(e) => handleNavClick(e, '/school/settings')}
                            className="text-decoration-none flex-fill text-center py-2 rounded-2"
                            style={{
                                color: '#8b92a7',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                fontSize: '13px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#8b92a7';
                            }}
                        >
                            <i className="bi bi-gear me-1"></i> Settings
                        </Link>
                        <Link
                            to="/school-logout"
                            onClick={(e) => handleNavClick(e, '/school-logout')}
                            className="text-decoration-none flex-fill text-center py-2 rounded-2"
                            style={{
                                color: '#8b92a7',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                fontSize: '13px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#8b92a7';
                            }}
                        >
                            <i className="bi bi-box-arrow-right me-1"></i> Logout
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolSidebar;
