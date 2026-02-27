import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import './TeacherLayout.css';

const TeacherLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const teacherLoginStatus = localStorage.getItem('teacherLoginStatus');
    const teacherId = localStorage.getItem('teacherId');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Debug: Log authentication status
    console.log('TeacherLayout - Auth Check:', { teacherLoginStatus, teacherId });
    console.log('TeacherLayout - Current Path:', location.pathname);
    console.log('TeacherLayout - Mobile State:', { isMobile, sidebarOpen });
    
    // Handle window resize for responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            console.log('TeacherLayout - Resize detected:', { windowWidth: window.innerWidth, isMobile: mobile });
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
        console.log('TeacherLayout - Route changed to:', location.pathname);
        if (isMobile) {
            console.log('TeacherLayout - Closing sidebar due to route change (mobile)');
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);
    
    const toggleSidebar = useCallback((e) => {
        e.stopPropagation();
        console.log('TeacherLayout - Toggle sidebar clicked, current state:', sidebarOpen, '-> new state:', !sidebarOpen);
        setSidebarOpen(prev => !prev);
    }, [sidebarOpen]);

    const closeSidebar = useCallback(() => {
        console.log('TeacherLayout - Closing sidebar via overlay');
        setSidebarOpen(false);
    }, []);

    // Handle navigation from sidebar on mobile
    const handleMobileNavigation = useCallback((path) => {
        console.log('TeacherLayout - Mobile navigation to:', path);
        setSidebarOpen(false);
        // Small delay to allow sidebar animation to start before navigation
        setTimeout(() => {
            navigate(path);
        }, 50);
    }, [navigate]);
    
    // Redirect to login if not authenticated
    if (teacherLoginStatus !== 'true') {
        console.log('TeacherLayout - Redirecting to login (not authenticated)');
        return <Navigate to="/teacher-login" replace />;
    }

    return (
        <div className="teacher-layout">
            {/* Mobile Header Bar with Toggle */}
            {isMobile && (
                <div className="teacher-mobile-header">
                    <button 
                        className="teacher-sidebar-toggle"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                        type="button"
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                    <span className="teacher-mobile-title">Teacher Panel</span>
                </div>
            )}

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div 
                    className="teacher-sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar - Fixed position */}
            <aside 
                className={`teacher-sidebar ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : 'closed'}`}
                data-is-open={sidebarOpen}
                data-is-mobile={isMobile}
            >
                <TeacherSidebar 
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isMobile={isMobile}
                    onNavigate={handleMobileNavigation}
                />
            </aside>

            {/* Main Content - Offset by sidebar width */}
            <main className="teacher-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default TeacherLayout;
