import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './StreakCalendar.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const StreakCalendar = ({ studentId }) => {
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredDate, setHoveredDate] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchStreakData();
        }
    }, [studentId]);

    const fetchStreakData = async () => {
        try {
            const response = await axios.get(`${baseUrl}/student/streak-calendar/${studentId}/`);
            setStreakData(response.data);
        } catch (error) {
            console.error('Error fetching streak data:', error);
            // Set default data if API fails
            setStreakData({
                calendar_data: {},
                current_streak: 0,
                longest_streak: 0,
                total_active_days: 0,
                this_week_active: 0,
                today: new Date().toISOString().split('T')[0],
                start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        } finally {
            setLoading(false);
        }
    };

    const getActivityLevel = (dateStr) => {
        if (!streakData?.calendar_data) return 0;
        return streakData.calendar_data[dateStr] || 0;
    };

    const getActivityColor = (level) => {
        const colors = {
            0: '#ebedf0',
            1: '#9be9a8',
            2: '#40c463',
            3: '#30a14e',
            4: '#216e39'
        };
        return colors[level] || colors[0];
    };

    const getActivityLabel = (level) => {
        const labels = {
            0: 'No activity',
            1: 'Light activity',
            2: 'Moderate activity',
            3: 'High activity',
            4: 'Very high activity'
        };
        return labels[level] || labels[0];
    };

    const generateCalendarWeeks = () => {
        if (!streakData) return [];
        
        const weeks = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 77); // 11 weeks back
        
        // Align to Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        for (let week = 0; week < 12; week++) {
            const days = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + (week * 7) + day);
                const dateStr = currentDate.toISOString().split('T')[0];
                const isFuture = currentDate > today;
                const isToday = dateStr === today.toISOString().split('T')[0];
                
                days.push({
                    date: dateStr,
                    level: isFuture ? -1 : getActivityLevel(dateStr),
                    isToday,
                    isFuture,
                    displayDate: currentDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    })
                });
            }
            weeks.push(days);
        }
        
        return weeks;
    };

    const getMonthLabels = () => {
        const months = [];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 77);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        let lastMonth = -1;
        for (let week = 0; week < 12; week++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (week * 7));
            const month = weekStart.getMonth();
            
            if (month !== lastMonth) {
                months.push({
                    week,
                    label: weekStart.toLocaleDateString('en-US', { month: 'short' })
                });
                lastMonth = month;
            }
        }
        return months;
    };

    if (loading) {
        return (
            <div className="streak-calendar-card loading">
                <LoadingSpinner size="sm" />
            </div>
        );
    }

    const weeks = generateCalendarWeeks();
    const monthLabels = getMonthLabels();

    return (
        <div className="streak-calendar-card">
            {/* Header with Streak Stats */}
            <div className="streak-header">
                <div className="streak-title">
                    <i className="bi bi-fire"></i>
                    <h5>Learning Streak</h5>
                </div>
                <div className="streak-stats">
                    <div className="streak-stat current">
                        <span className="streak-number">{streakData?.current_streak || 0}</span>
                        <span className="streak-label">Current</span>
                        {streakData?.current_streak > 0 && (
                            <span className="fire-emoji">🔥</span>
                        )}
                    </div>
                    <div className="streak-stat best">
                        <span className="streak-number">{streakData?.longest_streak || 0}</span>
                        <span className="streak-label">Best</span>
                        <span className="trophy-emoji">🏆</span>
                    </div>
                </div>
            </div>

            {/* Activity Summary */}
            <div className="activity-summary">
                <div className="activity-stat">
                    <i className="bi bi-calendar-check"></i>
                    <span>{streakData?.total_active_days || 0} active days</span>
                </div>
                <div className="activity-stat">
                    <i className="bi bi-calendar-week"></i>
                    <span>{streakData?.this_week_active || 0}/7 this week</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-container">
                {/* Month Labels */}
                <div className="month-labels">
                    {monthLabels.map((m, i) => (
                        <span 
                            key={i} 
                            className="month-label"
                            style={{ gridColumnStart: m.week + 2 }}
                        >
                            {m.label}
                        </span>
                    ))}
                </div>

                {/* Day Labels */}
                <div className="calendar-grid">
                    <div className="day-labels">
                        <span></span>
                        <span>Mon</span>
                        <span></span>
                        <span>Wed</span>
                        <span></span>
                        <span>Fri</span>
                        <span></span>
                    </div>

                    {/* Calendar Cells */}
                    <div className="calendar-weeks">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="calendar-week">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={day.date}
                                        className={`calendar-cell ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}`}
                                        style={{ 
                                            backgroundColor: day.isFuture ? 'transparent' : getActivityColor(day.level),
                                            borderColor: day.isToday ? '#4285f4' : 'transparent'
                                        }}
                                        onMouseEnter={() => !day.isFuture && setHoveredDate(day)}
                                        onMouseLeave={() => setHoveredDate(null)}
                                        title={day.isFuture ? '' : `${day.displayDate}: ${getActivityLabel(day.level)}`}
                                    >
                                        {day.isToday && <span className="today-dot"></span>}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="calendar-legend">
                    <span className="legend-label">Less</span>
                    {[0, 1, 2, 3, 4].map(level => (
                        <div
                            key={level}
                            className="legend-cell"
                            style={{ backgroundColor: getActivityColor(level) }}
                        ></div>
                    ))}
                    <span className="legend-label">More</span>
                </div>
            </div>

            {/* Tooltip */}
            {hoveredDate && (
                <div className="calendar-tooltip">
                    <strong>{hoveredDate.displayDate}</strong>
                    <span>{getActivityLabel(hoveredDate.level)}</span>
                </div>
            )}

            {/* Motivational Message */}
            {streakData?.current_streak > 0 ? (
                <div className="streak-motivation">
                    <span className="motivation-emoji">⚡</span>
                    <span>
                        {streakData.current_streak >= 7 
                            ? "Amazing! You're on fire! Keep this streak going!" 
                            : streakData.current_streak >= 3 
                                ? "Great progress! You're building a habit!" 
                                : "Good start! Keep learning daily!"}
                    </span>
                </div>
            ) : (
                <div className="streak-motivation start">
                    <span className="motivation-emoji">🎯</span>
                    <span>Start your learning streak today!</span>
                </div>
            )}
        </div>
    );
};

export default StreakCalendar;
