import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import LoadingSpinner from '../LoadingSpinner';
import './MyAchievements.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyAchievements = () => {
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const studentId = localStorage.getItem('studentId');
    const studentLoginStatus = localStorage.getItem('studentLoginStatus');

    // Authentication check
    useEffect(() => {
        if (studentLoginStatus !== 'true') {
            navigate('/student/login');
        }
    }, [studentLoginStatus, navigate]);

    // Responsive detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (studentLoginStatus === 'true') {
            document.title = 'Kannari Music Academy | My Achievements';
            fetchAchievements();
        }
    }, [studentLoginStatus]);

    const fetchAchievements = async () => {
        try {
            const [earned, all] = await Promise.all([
                axios.get(`${baseUrl}/student/achievements/${studentId}/`),
                axios.get(`${baseUrl}/achievements/`)
            ]);
            setAchievements(earned.data);
            setAllAchievements(all.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            setLoading(false);
        }
    };

    const earnedIds = achievements.map(a => a.achievement?.id || a.achievement);

    const getAchievementTypeIcon = (type) => {
        const icons = {
            'completion': 'bi-trophy',
            'quiz_master': 'bi-patch-question',
            'time_spent': 'bi-clock-history',
            'first_steps': 'bi-footprints',
            'social': 'bi-people'
        };
        return icons[type] || 'bi-award';
    };

    const getAchievementTypeColor = (type) => {
        const colors = {
            'completion': '#ffd43b',
            'quiz_master': '#69db7c',
            'time_spent': '#4dabf7',
            'first_steps': '#da77f2',
            'social': '#ffa94d'
        };
        return colors[type] || '#868e96';
    };

    return (
        <div className="achievements-container">
            {/* Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                setIsOpen={setSidebarOpen} 
                isMobile={isMobile}
            />

            {/* Sidebar Overlay */}
            {isMobile && sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="achievements-content">
                {/* Mobile Header */}
                <div className="mobile-header">
                    <button 
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <i className="bi bi-list" aria-hidden="true"></i>
                    </button>
                    <div className="logo-mini">Kannari Music Academy</div>
                </div>

                <div className="achievements-main">
                    {/* Header */}
                    <div className="achievements-header">
                        <h2>
                            <i className="bi bi-trophy-fill me-2" aria-hidden="true"></i>
                            My Achievements
                        </h2>
                        <span className="achievements-badge">
                            {achievements.length} / {allAchievements.length} Unlocked
                        </span>
                    </div>

                    {/* Summary Card */}
                    <div className="summary-card">
                        <div className="summary-item">
                            <h3 style={{ color: '#3b82f6' }}>{achievements.length}</h3>
                            <p>Achievements Earned</p>
                        </div>
                        <div className="summary-item">
                            <h3 style={{ color: '#f59e0b' }}>
                                {achievements.reduce((sum, a) => sum + (a.achievement?.points || 0), 0)}
                            </h3>
                            <p>Total Points</p>
                        </div>
                        <div className="summary-item">
                            <h3 style={{ color: '#10b981' }}>
                                {Math.round((achievements.length / (allAchievements.length || 1)) * 100) || 0}%
                            </h3>
                            <p>Completion Rate</p>
                        </div>
                    </div>

                    {/* Earned Achievements */}
                    <h5 className="section-title">
                        <i className="bi bi-check-circle-fill" style={{ color: '#10b981' }} aria-hidden="true"></i>
                        Earned Achievements
                    </h5>
                    {loading ? (
                        <LoadingSpinner size="md" text="Loading achievements..." />
                    ) : achievements.length > 0 ? (
                        <div className="achievements-grid">
                            {achievements.map((item, index) => {
                                const achievement = item.achievement;
                                return (
                                    <div key={index} className="achievement-card earned">
                                        <div 
                                            className="achievement-icon-wrapper"
                                            style={{ backgroundColor: getAchievementTypeColor(achievement?.achievement_type) }}
                                        >
                                            {achievement?.icon ? (
                                                <img src={achievement.icon} alt={achievement.name} />
                                            ) : (
                                                <i className={`bi ${getAchievementTypeIcon(achievement?.achievement_type)}`} aria-hidden="true"></i>
                                            )}
                                        </div>
                                        <h6 className="achievement-name">{achievement?.name}</h6>
                                        <p className="achievement-desc">{achievement?.description}</p>
                                        <div className="achievement-meta">
                                            <span className="achievement-badge">
                                                <i className="bi bi-star-fill me-1" aria-hidden="true"></i>
                                                {achievement?.points} pts
                                            </span>
                                            <small className="achievement-meta-text">
                                                Earned: {new Date(item.earned_at).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="alert-info">
                            <i className="bi bi-music-note-beamed me-2" aria-hidden="true"></i>
                            Start your musical journey to earn your first achievement!
                        </div>
                    )}

                    {/* Locked Achievements */}
                    <h5 className="section-title">
                        <i className="bi bi-lock-fill" style={{ color: '#9ca3af' }} aria-hidden="true"></i>
                        Locked Achievements
                    </h5>
                    <div className="achievements-grid">
                        {allAchievements
                            .filter(a => !earnedIds.includes(a.id))
                            .map((achievement, index) => (
                                <div key={index} className="achievement-card locked">
                                    <div className="achievement-icon-wrapper locked">
                                        <i className={`bi ${getAchievementTypeIcon(achievement.achievement_type)}`} aria-hidden="true"></i>
                                    </div>
                                    <h6 className="achievement-name">{achievement.name}</h6>
                                    <p className="achievement-desc">{achievement.description}</p>
                                    <div className="achievement-meta">
                                        <span className="achievement-badge-locked">
                                            <i className="bi bi-star me-1" aria-hidden="true"></i>
                                            {achievement.points} pts
                                        </span>
                                        <small className="achievement-meta-text">
                                            Goal: {achievement.requirement_value}
                                        </small>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAchievements;
