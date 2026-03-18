import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './AchievementBadges.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const AchievementBadges = ({ studentId, compact = false }) => {
    const [achievementData, setAchievementData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchAchievements();
        }
    }, [studentId]);

    const fetchAchievements = async () => {
        try {
            const response = await axios.get(`${baseUrl}/student/all-achievements/${studentId}/`);
            setAchievementData(response.data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            // Set default data
            setAchievementData({
                achievements: [],
                total_earned: 0,
                total_available: 0,
                total_points: 0,
                completion_percentage: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const getAchievementIcon = (achievement) => {
        if (achievement.icon) {
            return <img src={achievement.icon} alt={achievement.name} />;
        }
        
        // Default icons based on type
        const typeIcons = {
            'completion': 'bi-trophy-fill',
            'quiz_master': 'bi-mortarboard-fill',
            'time_spent': 'bi-clock-fill',
            'first_steps': 'bi-star-fill',
            'social': 'bi-people-fill'
        };
        
        return <i className={`bi ${typeIcons[achievement.achievement_type] || 'bi-award-fill'}`}></i>;
    };

    const getTypeColor = (type) => {
        const colors = {
            'completion': '#ffd700',
            'quiz_master': '#9b59b6',
            'time_spent': '#3498db',
            'first_steps': '#2ecc71',
            'social': '#e74c3c'
        };
        return colors[type] || '#95a5a6';
    };

    const getTypeGradient = (type) => {
        const gradients = {
            'completion': 'linear-gradient(135deg, #ffd700, #ffaa00)',
            'quiz_master': 'linear-gradient(135deg, #9b59b6, #8e44ad)',
            'time_spent': 'linear-gradient(135deg, #3498db, #2980b9)',
            'first_steps': 'linear-gradient(135deg, #2ecc71, #27ae60)',
            'social': 'linear-gradient(135deg, #e74c3c, #c0392b)'
        };
        return gradients[type] || 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
    };

    if (loading) {
        return (
            <div className="achievement-badges-card loading">
                <LoadingSpinner size="sm" />
            </div>
        );
    }

    if (compact) {
        // Compact view for dashboard
        const earnedAchievements = achievementData?.achievements?.filter(a => a.is_earned) || [];
        const displayAchievements = earnedAchievements.slice(0, 5);
        
        return (
            <div className="achievement-badges-compact">
                <div className="compact-header">
                    <div className="compact-title">
                        <i className="bi bi-award-fill"></i>
                        <span>Achievements</span>
                    </div>
                    <div className="compact-stats">
                        <span className="points-badge">
                            <i className="bi bi-star-fill"></i>
                            {achievementData?.total_points || 0} pts
                        </span>
                    </div>
                </div>
                
                <div className="compact-badges">
                    {displayAchievements.length > 0 ? (
                        displayAchievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className="compact-badge earned"
                                style={{ background: getTypeGradient(achievement.achievement_type) }}
                                title={achievement.name}
                                onClick={() => setSelectedAchievement(achievement)}
                            >
                                {getAchievementIcon(achievement)}
                            </div>
                        ))
                    ) : (
                        <div className="no-badges-message">
                            <i className="bi bi-emoji-smile"></i>
                            <span>Start learning to earn badges!</span>
                        </div>
                    )}
                    
                    {earnedAchievements.length > 5 && (
                        <Link to="/student/my-achievements" className="more-badges">
                            +{earnedAchievements.length - 5}
                        </Link>
                    )}
                </div>
                
                <div className="compact-progress">
                    <div className="progress-info">
                        <span>{achievementData?.total_earned || 0}/{achievementData?.total_available || 0} unlocked</span>
                        <span>{achievementData?.completion_percentage || 0}%</span>
                    </div>
                    <div className="progress-bar-track">
                        <div 
                            className="progress-bar-fill"
                            style={{ width: `${achievementData?.completion_percentage || 0}%` }}
                        ></div>
                    </div>
                </div>
                
                <Link to="/student/my-achievements" className="view-all-btn">
                    View All Achievements
                    <i className="bi bi-arrow-right"></i>
                </Link>

                {/* Achievement Detail Modal */}
                {selectedAchievement && (
                    <div className="achievement-modal-overlay" onClick={() => setSelectedAchievement(null)}>
                        <div className="achievement-modal" onClick={e => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setSelectedAchievement(null)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                            <div 
                                className="modal-badge"
                                style={{ background: getTypeGradient(selectedAchievement.achievement_type) }}
                            >
                                {getAchievementIcon(selectedAchievement)}
                            </div>
                            <h4>{selectedAchievement.name}</h4>
                            <p>{selectedAchievement.description}</p>
                            <div className="modal-meta">
                                <span className="points">
                                    <i className="bi bi-star-fill"></i>
                                    {selectedAchievement.points} points
                                </span>
                                {selectedAchievement.earned_at && (
                                    <span className="earned-date">
                                        <i className="bi bi-calendar-check"></i>
                                        Earned: {new Date(selectedAchievement.earned_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Full view
    return (
        <div className="achievement-badges-card">
            <div className="badges-header">
                <div className="header-title">
                    <i className="bi bi-award-fill"></i>
                    <h5>Achievement Badges</h5>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-value">{achievementData?.total_earned || 0}</span>
                        <span className="stat-label">Earned</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">{achievementData?.total_points || 0}</span>
                        <span className="stat-label">Points</span>
                    </div>
                </div>
            </div>

            <div className="badges-progress">
                <div className="progress-text">
                    <span>Collection Progress</span>
                    <span>{achievementData?.completion_percentage || 0}%</span>
                </div>
                <div className="progress-bar-track">
                    <div 
                        className="progress-bar-fill rainbow"
                        style={{ width: `${achievementData?.completion_percentage || 0}%` }}
                    ></div>
                </div>
            </div>

            <div className="badges-grid">
                {achievementData?.achievements?.map((achievement) => (
                    <div
                        key={achievement.id}
                        className={`badge-item ${achievement.is_earned ? 'earned' : 'locked'}`}
                        onClick={() => setSelectedAchievement(achievement)}
                    >
                        <div 
                            className="badge-icon"
                            style={{ 
                                background: achievement.is_earned 
                                    ? getTypeGradient(achievement.achievement_type)
                                    : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'
                            }}
                        >
                            {achievement.is_earned ? (
                                getAchievementIcon(achievement)
                            ) : (
                                <i className="bi bi-lock-fill"></i>
                            )}
                            {achievement.is_earned && (
                                <div className="earned-check">
                                    <i className="bi bi-check-circle-fill"></i>
                                </div>
                            )}
                        </div>
                        <div className="badge-info">
                            <span className="badge-name">{achievement.name}</span>
                            <span className="badge-points">
                                <i className="bi bi-star-fill"></i>
                                {achievement.points} pts
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
                <div className="achievement-modal-overlay" onClick={() => setSelectedAchievement(null)}>
                    <div className="achievement-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedAchievement(null)}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                        <div 
                            className={`modal-badge ${selectedAchievement.is_earned ? 'earned' : 'locked'}`}
                            style={{ 
                                background: selectedAchievement.is_earned 
                                    ? getTypeGradient(selectedAchievement.achievement_type)
                                    : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'
                            }}
                        >
                            {selectedAchievement.is_earned ? (
                                getAchievementIcon(selectedAchievement)
                            ) : (
                                <i className="bi bi-lock-fill"></i>
                            )}
                        </div>
                        <h4>{selectedAchievement.name}</h4>
                        <p>{selectedAchievement.description}</p>
                        {!selectedAchievement.is_earned && (
                            <div className="requirement-badge">
                                <i className="bi bi-target"></i>
                                Requirement: {selectedAchievement.requirement_value}
                            </div>
                        )}
                        <div className="modal-meta">
                            <span className="points">
                                <i className="bi bi-star-fill"></i>
                                {selectedAchievement.points} points
                            </span>
                            {selectedAchievement.earned_at && (
                                <span className="earned-date">
                                    <i className="bi bi-calendar-check"></i>
                                    Earned: {new Date(selectedAchievement.earned_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        {!selectedAchievement.is_earned && (
                            <div className="unlock-hint">
                                <i className="bi bi-lightbulb"></i>
                                Keep learning to unlock this achievement!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AchievementBadges;
