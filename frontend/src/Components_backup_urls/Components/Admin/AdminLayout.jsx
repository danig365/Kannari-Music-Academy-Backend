import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const adminLoginStatus = localStorage.getItem('adminLoginStatus');
    const adminId = localStorage.getItem('adminId');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Debug: Log authentication status
    console.log('AdminLayout - Auth Check:', { adminLoginStatus, adminId });
    console.log('AdminLayout - Current Path:', location.pathname);
    console.log('AdminLayout - Mobile State:', { isMobile, sidebarOpen });
    
    // Handle window resize for responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            console.log('AdminLayout - Resize detected:', { windowWidth: window.innerWidth, isMobile: mobile });
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change for mobile
    useEffect(() => {
        console.log('AdminLayout - Route changed to:', location.pathname);
        if (isMobile) {
            console.log('AdminLayout - Closing sidebar due to route change (mobile)');
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);
    
    const toggleSidebar = useCallback((e) => {
        e.stopPropagation();
        console.log('AdminLayout - Toggle sidebar clicked, current state:', sidebarOpen, '-> new state:', !sidebarOpen);
        setSidebarOpen(prev => !prev);
    }, [sidebarOpen]);

    const closeSidebar = useCallback(() => {
        console.log('AdminLayout - Closing sidebar via overlay');
        setSidebarOpen(false);
    }, []);

    // Handle navigation from sidebar on mobile
    const handleMobileNavigation = useCallback((path) => {
        console.log('AdminLayout - Mobile navigation to:', path);
        setSidebarOpen(false);
        // Small delay to allow sidebar animation to start before navigation
        setTimeout(() => {
            navigate(path);
        }, 50);
    }, [navigate]);
    
    // Redirect to login if not authenticated
    if (adminLoginStatus !== 'true') {
        console.log('AdminLayout - Redirecting to login (not authenticated)');
        return <Navigate to="/admin-login" replace />;
    }

    return (
        <div className="admin-layout">
            {/* Mobile Header Bar with Toggle */}
            {isMobile && (
                <div className="admin-mobile-header">
                    <button 
                        className="admin-sidebar-toggle"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                        type="button"
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                    <span className="admin-mobile-title">Admin Panel</span>
                </div>
            )}

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div 
                    className="admin-sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar - Fixed position */}
            <aside 
                className={`admin-sidebar ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : 'closed'}`}
                data-is-open={sidebarOpen}
                data-is-mobile={isMobile}
            >
                <AdminSidebar 
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isMobile={isMobile}
                    onNavigate={handleMobileNavigation}
                />
            </aside>

            {/* Main Content - Offset by sidebar width */}
            <main className="admin-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
