import React from 'react';

const ActivityChart = ({ activityData }) => {
    const maxMinutes = Math.max(...activityData.map(d => d.minutes), 30);
    
    return (
        <div className="activity-chart-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">
                    <i className="bi bi-bar-chart-line me-2 text-primary"></i>
                    Weekly Activity
                </h5>
                <div className="d-flex gap-3">
                    <span className="d-flex align-items-center">
                        <span className="legend-dot bg-primary me-2"></span>
                        <small className="text-muted">Minutes</small>
                    </span>
                    <span className="d-flex align-items-center">
                        <span className="legend-dot bg-success me-2"></span>
                        <small className="text-muted">Lessons</small>
                    </span>
                </div>
            </div>

            <div className="chart-container">
                <div className="chart-bars">
                    {activityData.map((day, index) => (
                        <div key={index} className="chart-bar-group">
                            <div className="chart-bar-wrapper">
                                <div 
                                    className="chart-bar minutes-bar"
                                    style={{ 
                                        height: `${(day.minutes / maxMinutes) * 100}%`,
                                        minHeight: day.minutes > 0 ? '10px' : '0'
                                    }}
                                    title={`${day.minutes} minutes`}
                                >
                                    {day.minutes > 0 && (
                                        <span className="bar-value">{day.minutes}m</span>
                                    )}
                                </div>
                            </div>
                            <div className="chart-bar-wrapper">
                                <div 
                                    className="chart-bar lessons-bar"
                                    style={{ 
                                        height: `${(day.lessons / 5) * 100}%`,
                                        minHeight: day.lessons > 0 ? '10px' : '0'
                                    }}
                                    title={`${day.lessons} lessons`}
                                >
                                    {day.lessons > 0 && (
                                        <span className="bar-value">{day.lessons}</span>
                                    )}
                                </div>
                            </div>
                            <span className="chart-label">{day.date}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="row mt-4 pt-3 border-top">
                <div className="col-4 text-center">
                    <h4 className="mb-0 text-primary">
                        {activityData.reduce((sum, d) => sum + d.minutes, 0)}
                    </h4>
                    <small className="text-muted">Total Minutes</small>
                </div>
                <div className="col-4 text-center">
                    <h4 className="mb-0 text-success">
                        {activityData.reduce((sum, d) => sum + d.lessons, 0)}
                    </h4>
                    <small className="text-muted">Lessons Completed</small>
                </div>
                <div className="col-4 text-center">
                    <h4 className="mb-0 text-warning">
                        {activityData.filter(d => d.minutes > 0).length}
                    </h4>
                    <small className="text-muted">Active Days</small>
                </div>
            </div>

            <style jsx>{`
                .activity-chart-container {
                    background: #fff;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                }

                .legend-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 4px;
                }

                .chart-container {
                    padding: 1rem 0;
                }

                .chart-bars {
                    display: flex;
                    justify-content: space-around;
                    align-items: flex-end;
                    height: 200px;
                    gap: 0.5rem;
                }

                .chart-bar-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }

                .chart-bar-wrapper {
                    display: flex;
                    align-items: flex-end;
                    height: 150px;
                    margin-bottom: 0.5rem;
                    width: 100%;
                    justify-content: center;
                }

                .chart-bar {
                    width: 20px;
                    border-radius: 8px 8px 0 0;
                    position: relative;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .chart-bar:hover {
                    opacity: 0.8;
                    transform: scaleY(1.02);
                }

                .minutes-bar {
                    background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
                    margin-right: 4px;
                }

                .lessons-bar {
                    background: linear-gradient(180deg, #10b981 0%, #34d399 100%);
                }

                .bar-value {
                    position: absolute;
                    top: -20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #374151;
                    white-space: nowrap;
                }

                .chart-label {
                    font-size: 0.8rem;
                    color: #6b7280;
                    font-weight: 500;
                    margin-top: 0.5rem;
                }

                @media (max-width: 768px) {
                    .chart-bar {
                        width: 15px;
                    }
                    
                    .bar-value {
                        font-size: 0.6rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default ActivityChart;
