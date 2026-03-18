import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import WeeklyGoalCard from './WeeklyGoalCard';
import StreakCalendar from './StreakCalendar';
import AchievementBadges from './AchievementBadges';
import RecentBookings from './RecentBookings';
import LoadingSpinner from '../LoadingSpinner';
import './EnhancedDashboard.css';

import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const EnhancedDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const studentId = localStorage.getItem('studentId');
    const studentLoginStatus = localStorage.getItem('studentLoginStatus');

    // Authentication check and fetch data
    useEffect(() => {
        if (studentLoginStatus !== 'true') {
            navigate('/student/login');
        } else {
            document.title = 'LMS | Student Dashboard';
            if (studentId) {
                fetchDashboardData();
            }
        }
    }, [studentLoginStatus, studentId, navigate]);

    // Handle window resize for responsive sidebar
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

    const fetchDashboardData = async () => {
        if (!studentId) {
            console.log('Student ID not available');
            return;
        }
        try {
            console.log('Fetching data for student:', studentId);
            
            // Fetch course progress data (which is working in MyProgress)
            const progressResponse = await axios.get(`${baseUrl}/student/course-progress/${studentId}/`);
            const courseProgress = progressResponse.data;
            
            // Calculate stats from course progress
            const stats = {
                total: courseProgress.length,
                completed: courseProgress.filter(cp => cp.is_completed).length,
                inProgress: courseProgress.filter(cp => !cp.is_completed && cp.progress_percentage > 0).length,
                totalTime: courseProgress.reduce((sum, cp) => sum + (cp.total_time_spent_seconds || 0), 0),
                avgProgress: courseProgress.length > 0 
                    ? Math.round(courseProgress.reduce((sum, cp) => sum + (cp.progress_percentage || 0), 0) / courseProgress.length)
                    : 0
            };
            
            // Format time
            const hours = Math.floor(stats.totalTime / 3600);
            const minutes = Math.floor((stats.totalTime % 3600) / 60);
            const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            
            // Try to fetch enhanced dashboard data for additional info (streak, weekly goal, etc)
            try {
                const enhancedResponse = await axios.get(`${baseUrl}/student/enhanced-dashboard/${studentId}/`);
                const enhancedData = enhancedResponse.data;
                
                // Merge with calculated stats - use course progress counts as primary source
                setDashboardData({
                    ...enhancedData,
                    enrolled_courses: stats.total,
                    courses_completed: stats.completed,
                    courses_in_progress: stats.inProgress,
                    total_learning_time_formatted: timeFormatted,
                    overall_progress_percentage: stats.avgProgress
                });
            } catch (enhancedError) {
                // If enhanced dashboard fails, use just the calculated stats
                console.warn('Enhanced dashboard not available, using basic stats:', enhancedError);
                setDashboardData({
                    enrolled_courses: stats.total,
                    courses_completed: stats.completed,
                    courses_in_progress: stats.inProgress,
                    total_learning_time_formatted: timeFormatted,
                    overall_progress_percentage: stats.avgProgress,
                    recent_courses: courseProgress.slice(0, 3).map(cp => ({
                        id: cp.course?.id || cp.id,
                        title: cp.course?.title || 'Unknown Course',
                        featured_img: cp.course?.featured_img || null,
                        teacher: cp.course?.teacher?.full_name || 'Unknown Teacher',
                        progress_percentage: cp.progress_percentage,
                        completed_chapters: cp.completed_chapters,
                        total_chapters: cp.total_chapters
                    })),
                    weekly_goal: null,
                    recent_achievements: []
                });
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const getFullImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        // If URL is already absolute, return as is
        if (imageUrl.startsWith('http')) return imageUrl;
        // If URL is relative, prepend the base URL (without /api part)
        return SITE_URL + imageUrl;
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
                <div className="dashboard-content">
                    <div className="mobile-header">
                        <button 
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <i className="bi bi-list"></i>
                        </button>
                        <div className="logo-mini">Kannari Music Academy</div>
                    </div>
                    <div className="dashboard-main">
                        <LoadingSpinner size="lg" text="Loading dashboard..." />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
            
            {/* Mobile overlay when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
            
            <div className="dashboard-content">
                {/* Mobile Header with Toggle */}
                <div className="mobile-header">
                    <button 
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <i className="bi bi-list"></i>
                    </button>
                    <div className="logo-mini">Kannari Music Academy</div>
                </div>

                <div className="dashboard-main">
                    {/* Welcome Header */}
                    <div className="welcome-header game-style">
                        <div className="welcome-content">
                            <div className="welcome-text">
                                <h2>Welcome Back, Musician! 🎵</h2>
                                <p>Keep the rhythm going — your musical journey continues!</p>
                            </div>
                        </div>
                        <div className="xp-bar-container">
                            <div className="xp-info">
                                <span>Overall Progress</span>
                                <span>{dashboardData?.overall_progress_percentage || 0}%</span>
                            </div>
                            <div className="xp-bar">
                                <div 
                                    className="xp-fill"
                                    style={{ width: `${dashboardData?.overall_progress_percentage || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="row g-3 mb-4">
                        <div className="col-6 col-lg-3">
                            <div className="stat-card stat-card-primary game-card">
                                <div className="stat-icon-wrapper">
                                    <i className="bi bi-music-note-list"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{dashboardData?.enrolled_courses || 0}</h3>
                                    <p>Total Courses</p>
                                </div>
                                <Link to="/student/my-courses" className="stat-link" aria-label="View all courses">
                                    <i className="bi bi-arrow-right-circle-fill"></i>
                                </Link>
                            </div>
                        </div>
                        <div className="col-6 col-lg-2">
                            <div className="stat-card stat-card-success game-card">
                                <div className="stat-icon-wrapper">
                                    <i className="bi bi-check-circle-fill"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{dashboardData?.courses_completed || 0}</h3>
                                    <p>Completed</p>
                                </div>
                                {dashboardData?.courses_in_progress > 0 && (
                                    <span className="stat-badge pulse">
                                        {dashboardData.courses_in_progress} in progress
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="col-6 col-lg-3">
                            <div className="stat-card stat-card-info game-card">
                                <div className="stat-icon-wrapper">
                                    <i className="bi bi-trophy-fill"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>{dashboardData?.overall_progress_percentage || 0}%</h3>
                                    <p>Avg Progress</p>
                                </div>
                                <div className="mini-progress">
                                    <div 
                                        className="mini-progress-fill" 
                                        style={{ width: `${dashboardData?.overall_progress_percentage || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Streak Calendar & Achievements Row */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-lg-7">
                            <StreakCalendar studentId={studentId} />
                        </div>
                        <div className="col-12 col-lg-5">
                            <AchievementBadges studentId={studentId} compact={true} />
                        </div>
                    </div>

                    {/* Weekly Goal and Continue Learning Row */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <WeeklyGoalCard 
                                weeklyGoal={dashboardData?.weekly_goal}
                                studentId={studentId}
                                onGoalUpdate={fetchDashboardData}
                            />
                        </div>

                        {/* Continue Learning Section */}
                        {dashboardData?.recent_courses && dashboardData.recent_courses.length > 0 && (
                            <div className="col-12 col-md-6">
                                <div className="card border-0 h-100">
                                    <div className="card-header">
                                        <h5 className="mb-0">
                                            <i className="bi bi-play-circle-fill me-2"></i>
                                            Continue Learning
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {dashboardData.recent_courses.slice(0, 1).map((course, index) => (
                                            <div key={index} className="course-progress-card">
                                                <div className="course-img-wrapper">
                                                    {course.featured_img ? (
                                                        <img 
                                                            src={getFullImageUrl(course.featured_img)} 
                                                            alt={course.title} 
                                                            className="course-img" 
                                                        />
                                                    ) : (
                                                        <div className="course-img-placeholder">
                                                            <i className="bi bi-book"></i>
                                                        </div>
                                                    )}
                                                    <div className="course-progress-overlay">
                                                        <span>{course.progress_percentage}%</span>
                                                    </div>
                                                </div>
                                                <div className="course-info">
                                                    <h6 className="course-title">{course.title}</h6>
                                                    <p className="course-teacher mb-2">
                                                        <i className="bi bi-person me-1"></i>
                                                        {course.teacher}
                                                    </p>
                                                    <div className="progress mb-2">
                                                        <div 
                                                            className="progress-bar" 
                                                            style={{ width: `${course.progress_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <small className="text-muted">
                                                        {course.completed_chapters}/{course.total_chapters} chapters completed
                                                    </small>
                                                    <Link to={`/detail/${course.id}`} className="stretched-link"></Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    
                </div>
            </div>
        </div>
    );
};

export default EnhancedDashboard;