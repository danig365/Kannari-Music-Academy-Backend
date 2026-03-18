import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentSubscription, formatAccessLevel, getAccessLevelColor } from '../../services/subscriptionService';
import LoadingSpinner from '../LoadingSpinner';
import './SubscriptionStatusCard.css';

const SubscriptionStatusCard = ({ studentId, compact = false }) => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!studentId) {
                setLoading(false);
                return;
            }
            
            try {
                const data = await getStudentSubscription(studentId);
                setSubscription(data);
            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [studentId]);

    if (loading) {
        return (
            <div className={`subscription-status-card ${compact ? 'compact' : ''}`}>
                <div className="subscription-loading">
                    <LoadingSpinner size="sm" />
                </div>
            </div>
        );
    }

    // No subscription or no active subscription
    if (!subscription || !subscription.has_active_subscription) {
        return (
            <div className={`subscription-status-card no-subscription ${compact ? 'compact' : ''}`}>
                <div className="subscription-icon">
                    <i className="bi bi-credit-card-2-front"></i>
                </div>
                <div className="subscription-info">
                    <h4>No Active Subscription</h4>
                    <p>Subscribe to unlock premium courses and features</p>
                </div>
                <Link to="/subscriptions" className="btn btn-primary subscribe-btn">
                    <i className="bi bi-star me-2"></i>
                    View Plans
                </Link>
            </div>
        );
    }

    const { subscription: sub, usage } = subscription;
    const accessLevel = sub?.plan_details?.access_level || 0;
    const levelColor = getAccessLevelColor(accessLevel);
    const daysRemaining = sub?.days_remaining || 0;
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

    // Calculate usage percentages
    const coursesUsedPercent = usage?.max_courses 
        ? Math.round((usage.courses_accessed / usage.max_courses) * 100) 
        : 0;
    const lessonsUsedPercent = usage?.max_lessons 
        ? Math.round((usage.lessons_accessed / usage.max_lessons) * 100) 
        : 0;
    const weeklyLessonsPercent = usage?.lessons_per_week 
        ? Math.round((usage.current_week_lessons / usage.lessons_per_week) * 100) 
        : 0;

    if (compact) {
        return (
            <div className="subscription-status-card compact">
                <div className="subscription-badge" style={{ backgroundColor: levelColor }}>
                    <i className="bi bi-award me-1"></i>
                    {formatAccessLevel(accessLevel)}
                </div>
                <div className="subscription-compact-info">
                    <span className="plan-name">{sub?.plan_details?.name || 'Active Plan'}</span>
                    <span className={`days-left ${isExpiringSoon ? 'expiring' : ''}`}>
                        {daysRemaining} days left
                    </span>
                </div>
                <Link to="/subscriptions" className="btn btn-sm btn-outline-primary">
                    Manage
                </Link>
            </div>
        );
    }

    return (
        <div className="subscription-status-card active">
            <div className="subscription-header">
                <div className="subscription-badge" style={{ backgroundColor: levelColor }}>
                    <i className="bi bi-award me-1"></i>
                    {formatAccessLevel(accessLevel)} Plan
                </div>
                <span className={`subscription-status-badge ${sub?.status}`}>
                    {sub?.status === 'active' ? (
                        <><i className="bi bi-check-circle me-1"></i>Active</>
                    ) : (
                        sub?.status
                    )}
                </span>
            </div>
            
            <div className="subscription-details">
                <h4 className="plan-name">{sub?.plan_details?.name || 'Active Plan'}</h4>
                
                {/* Days Remaining */}
                <div className={`days-remaining-section ${isExpiringSoon ? 'expiring' : ''}`}>
                    <div className="days-icon">
                        <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="days-info">
                        <span className="days-count">{daysRemaining}</span>
                        <span className="days-label">days remaining</span>
                    </div>
                    {isExpiringSoon && (
                        <span className="expiring-badge">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            Expiring Soon
                        </span>
                    )}
                </div>

                {/* Assigned Teacher */}
                {subscription.assigned_teacher && (
                    <div className="assigned-teacher-section">
                        <div className="teacher-avatar">
                            {subscription.assigned_teacher.profile_img ? (
                                <img src={subscription.assigned_teacher.profile_img} alt="Teacher" />
                            ) : (
                                <i className="bi bi-person-fill"></i>
                            )}
                        </div>
                        <div className="teacher-info">
                            <span className="teacher-label">Your Assigned Teacher</span>
                            <span className="teacher-name">{subscription.assigned_teacher.fullname}</span>
                        </div>
                    </div>
                )}

                {/* Usage Stats */}
                <div className="usage-stats">
                    <div className="usage-item">
                        <div className="usage-header">
                            <span><i className="bi bi-book me-1"></i>Courses</span>
                            <span>{usage?.courses_accessed || 0} / {usage?.max_courses || '∞'}</span>
                        </div>
                        <div className="usage-bar">
                            <div 
                                className="usage-fill" 
                                style={{ 
                                    width: `${Math.min(coursesUsedPercent, 100)}%`,
                                    backgroundColor: coursesUsedPercent > 90 ? '#ef4444' : '#3b82f6'
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="usage-item">
                        <div className="usage-header">
                            <span><i className="bi bi-play-circle me-1"></i>Lessons</span>
                            <span>{usage?.lessons_accessed || 0} / {usage?.max_lessons || '∞'}</span>
                        </div>
                        <div className="usage-bar">
                            <div 
                                className="usage-fill" 
                                style={{ 
                                    width: `${Math.min(lessonsUsedPercent, 100)}%`,
                                    backgroundColor: lessonsUsedPercent > 90 ? '#ef4444' : '#10b981'
                                }}
                            ></div>
                        </div>
                    </div>

                    {usage?.lessons_per_week > 0 && (
                        <div className="usage-item">
                            <div className="usage-header">
                                <span><i className="bi bi-calendar-week me-1"></i>Weekly Lessons</span>
                                <span>{usage?.current_week_lessons || 0} / {usage?.lessons_per_week}</span>
                            </div>
                            <div className="usage-bar">
                                <div 
                                    className="usage-fill" 
                                    style={{ 
                                        width: `${Math.min(weeklyLessonsPercent, 100)}%`,
                                        backgroundColor: weeklyLessonsPercent > 90 ? '#f59e0b' : '#8b5cf6'
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plan Features */}
                {sub?.plan_details?.features_list && sub.plan_details.features_list.length > 0 && (
                    <div className="plan-features-preview">
                        <h5><i className="bi bi-check2-square me-1"></i>Your Benefits</h5>
                        <ul>
                            {sub.plan_details.features_list.slice(0, 3).map((feature, idx) => (
                                <li key={idx}>
                                    <i className="bi bi-check-circle-fill"></i>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="subscription-actions">
                <Link to="/subscriptions" className="btn btn-outline-primary">
                    <i className="bi bi-gear me-1"></i>
                    Manage Subscription
                </Link>
                {isExpiringSoon && (
                    <Link to="/subscriptions" className="btn btn-primary">
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Renew Now
                    </Link>
                )}
            </div>
        </div>
    );
};

export default SubscriptionStatusCard;
