import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import LoadingSpinner from '../LoadingSpinner';
import StreakCalendar from './StreakCalendar';
import './MyAchievements.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyAchievements = () => {
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
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
            const [earned, all, dashboard] = await Promise.all([
                axios.get(`${baseUrl}/student/achievements/${studentId}/`),
                axios.get(`${baseUrl}/achievements/`),
                axios.get(`${baseUrl}/student/enhanced-dashboard/${studentId}/`),
            ]);
            setAchievements(earned.data);
            setAllAchievements(all.data);
            setDashboardData(dashboard.data);
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
            'social': 'bi-people',
            'streak': 'bi-fire',
        };
        return icons[type] || 'bi-award';
    };

    const getAchievementTypeColor = (type) => {
        const colors = {
            'completion': '#ffd43b',
            'quiz_master': '#69db7c',
            'time_spent': '#4dabf7',
            'first_steps': '#da77f2',
            'social': '#ffa94d',
            'streak': '#ff6b35',
        };
        return colors[type] || '#868e96';
    };

    const getXpTier = (xp) => {
        if (xp >= 1000) return { label: 'Music Master',   color: '#7C9BB8', next: null,  nextXp: 0    };
        if (xp >= 600)  return { label: 'Rhythm Master',  color: '#D85C4A', next: 1000, nextXp: 1000 };
        if (xp >= 300)  return { label: 'Music Maker',    color: '#C9A66B', next: 600,  nextXp: 600  };
        if (xp >= 100)  return { label: 'Rising Star',    color: '#101C2C', next: 300,  nextXp: 300  };
        return                 { label: 'Beginner',        color: '#16a34a', next: 100,  nextXp: 100  };
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

                    {/* XP Level Bar */}
                    {dashboardData && (() => {
                        const xp = dashboardData.total_xp || 0;
                        const streak = dashboardData.practice_streak || 0;
                        const tier = getXpTier(xp);
                        const prevXp = tier.label === 'Beginner' ? 0
                            : tier.label === 'Rising Star' ? 100
                            : tier.label === 'Music Maker' ? 300
                            : tier.label === 'Rhythm Master' ? 600 : 1000;
                        const pct = tier.next
                            ? Math.round(((xp - prevXp) / (tier.nextXp - prevXp)) * 100)
                            : 100;
                        return (
                            <div style={{
                                background: '#fff',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: 14,
                                padding: '20px 24px',
                                marginBottom: 20,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 20,
                                alignItems: 'center',
                            }}>
                                {/* XP block */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, color: tier.color, fontSize: 15 }}>
                                            <i className="bi bi-lightning-charge-fill me-1"></i>{tier.label}
                                        </span>
                                        <span style={{ fontSize: 13, color: '#64748b' }}>
                                            {xp} XP{tier.next ? ` / ${tier.nextXp} XP` : ' (Max)'}
                                        </span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${pct}%`,
                                            height: '100%',
                                            background: tier.color,
                                            borderRadius: 8,
                                            transition: 'width 0.6s ease'
                                        }} />
                                    </div>
                                    {tier.next && (
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                            {tier.nextXp - xp} XP to next tier
                                        </div>
                                    )}
                                </div>
                                {/* Streak block */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: streak >= 4 ? '#fff7ed' : streak >= 1 ? '#fefce8' : '#F7F3EA',
                                    border: `1.5px solid ${streak >= 4 ? '#fed7aa' : streak >= 1 ? '#fef08a' : '#e2e8f0'}`,
                                    borderRadius: 12,
                                    padding: '10px 20px',
                                    minWidth: 100,
                                }}>
                                    <span style={{ fontSize: 26 }}>{streak >= 1 ? '🔥' : '💤'}</span>
                                    <span style={{
                                        fontSize: 22,
                                        fontWeight: 800,
                                        color: streak >= 4 ? '#D85C4A' : streak >= 1 ? '#ca8a04' : '#94a3b8',
                                        lineHeight: 1.1
                                    }}>{streak}d</span>
                                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Streak</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Summary Card */}
                    <div className="summary-card">
                        <div className="summary-item">
                            <h3 style={{ color: '#101C2C' }}>{achievements.length}</h3>
                            <p>Achievements Earned</p>
                        </div>
                        <div className="summary-item">
                            <h3 style={{ color: '#C9A66B' }}>
                                {dashboardData?.total_xp ?? achievements.reduce((sum, a) => sum + (a.achievement?.points || 0), 0)}
                            </h3>
                            <p>Total XP</p>
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

                    {/* Learning Streak Calendar */}
                    <StreakCalendar studentId={studentId} />
                </div>
            </div>
        </div>
    );
};

export default MyAchievements;
