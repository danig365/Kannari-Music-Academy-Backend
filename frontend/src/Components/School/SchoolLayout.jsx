import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SchoolSidebar from './SchoolSidebar';
import './SchoolLayout.css';

const SchoolLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const schoolLoginStatus = localStorage.getItem('schoolLoginStatus');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    const toggleSidebar = useCallback((e) => {
        e.stopPropagation();
        setSidebarOpen(prev => !prev);
    }, []);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const handleMobileNavigation = useCallback((path) => {
        setSidebarOpen(false);
        setTimeout(() => {
            navigate(path);
        }, 50);
    }, [navigate]);

    if (schoolLoginStatus !== 'true') {
        return <Navigate to="/school-login" replace />;
    }

    return (
        <div className="school-layout">
            {isMobile && (
                <div className="school-mobile-header">
                    <button
                        className="school-sidebar-toggle"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                        type="button"
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                    <span className="school-mobile-title">School Portal</span>
                </div>
            )}

            {isMobile && sidebarOpen && (
                <div
                    className="school-sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                ></div>
            )}

            <aside
                className={`school-sidebar ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : 'closed'}`}
                data-is-open={sidebarOpen}
                data-is-mobile={isMobile}
            >
                <SchoolSidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isMobile={isMobile}
                    onNavigate={handleMobileNavigation}
                />
            </aside>

            <main className="school-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default SchoolLayout;
