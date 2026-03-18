import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminSidebar = ({ isOpen = false, setIsOpen = null, isMobile = false, onNavigate = null }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const adminRole = localStorage.getItem('adminRole');
    const adminName = localStorage.getItem('adminName');

    // Debug: Log sidebar state
    console.log('AdminSidebar - State:', { isOpen, isMobile, currentPath: location.pathname });

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleNavClick = (e, path) => {
        console.log('AdminSidebar - Nav clicked:', { path, isMobile, isOpen });
        
        if (isMobile) {
            // Prevent default and handle navigation manually for mobile
            e.preventDefault();
            e.stopPropagation();
            
            console.log('AdminSidebar - Mobile navigation to:', path);
            
            // Close sidebar first
            if (setIsOpen) {
                setIsOpen(false);
            }
            
            // Use the onNavigate callback if provided, otherwise navigate directly
            if (onNavigate) {
                onNavigate(path);
            } else {
                // Small delay to allow sidebar close animation
                setTimeout(() => {
                    navigate(path);
                }, 100);
            }
        }
    };

    return (
        <div className="d-flex flex-column h-100 admin-sidebar-inner" style={{ 
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
                             background: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)'
                         }}>
                        <i className="bi bi-music-note-beamed text-white fs-4"></i>
                    </div>
                    <div>
                        <div className="fw-bold text-white" style={{ fontSize: '18px' }}>Kannari Music Academy</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>Admin Portal</div>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-grow-1 py-3">
                <nav>
                    <Link 
                        to="/admin-panel/dashboard" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/dashboard')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/dashboard') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/dashboard') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/dashboard') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/dashboard')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/dashboard')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-grid me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>Dashboard</span>
                    </Link>

                    <Link 
                        to="/admin-panel/users-management" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/users-management')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/users-management') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/users-management') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/users-management') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/users-management')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/users-management')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-people me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>User Management</span>
                    </Link>

                    <Link 
                        to="/admin-panel/lesson-management" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/lesson-management')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/lesson-management') || location.pathname.startsWith('/admin-panel/lesson-management') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/lesson-management') || location.pathname.startsWith('/admin-panel/lesson-management') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/lesson-management') || location.pathname.startsWith('/admin-panel/lesson-management') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/lesson-management') && !location.pathname.startsWith('/admin-panel/lesson-management')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/lesson-management') && !location.pathname.startsWith('/admin-panel/lesson-management')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-collection-play me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>Course Management</span>
                    </Link>

                    <Link 
                        to="/admin-panel/activity-logs" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/activity-logs')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/activity-logs') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/activity-logs') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/activity-logs') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/activity-logs')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/activity-logs')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-clock-history me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>Activity Logs</span>
                    </Link>

                    <Link 
                        to="/admin-panel/subscriptions" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/subscriptions')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/subscriptions') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/subscriptions') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/subscriptions') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/subscriptions')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/subscriptions')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-credit-card-2-front me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>Subscriptions</span>
                    </Link>

                    <Link 
                        to="/admin-panel/games-analytics" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/games-analytics')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/games-analytics') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/games-analytics') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/games-analytics') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/games-analytics')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/games-analytics')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-controller me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>Games Analytics</span>
                    </Link>

                    <Link 
                        to="/admin-panel/audit-logs" 
                        onClick={(e) => handleNavClick(e, '/admin-panel/audit-logs')}
                        className="text-decoration-none d-flex align-items-center px-4 py-3 position-relative"
                        style={{ 
                            color: isActive('/admin-panel/audit-logs') ? '#fff' : '#8b92a7',
                            backgroundColor: isActive('/admin-panel/audit-logs') ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                            borderLeft: isActive('/admin-panel/audit-logs') ? '3px solid #4285f4' : '3px solid transparent',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin-panel/audit-logs')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin-panel/audit-logs')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#8b92a7';
                            }
                        }}
                    >
                        <i className="bi bi-shield-check me-3" style={{ fontSize: '18px' }}></i>
                        <span style={{ fontSize: '14px' }}>Audit Logs</span>
                    </Link>
                </nav>
            </div>

            {/* Footer - Admin Info & Actions */}
            <div className="mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" 
                             style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                                 fontSize: '16px'
                             }}>
                            {adminName ? adminName.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="text-white fw-medium" style={{ fontSize: '14px' }}>
                                {adminName || 'Admin User'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {adminRole?.replace('_', ' ') || 'Super Admin'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                        <Link 
                            to="/admin-panel/settings" 
                            onClick={(e) => handleNavClick(e, '/admin-panel/settings')}
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
                            to="/admin-panel/logout" 
                            onClick={(e) => handleNavClick(e, '/admin-panel/logout')}
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

export default AdminSidebar;