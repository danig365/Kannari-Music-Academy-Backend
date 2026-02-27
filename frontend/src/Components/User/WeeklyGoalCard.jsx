import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const WeeklyGoalCard = ({ weeklyGoal, studentId, onGoalUpdate }) => {
    const [showModal, setShowModal] = useState(false);
    const [goalType, setGoalType] = useState(weeklyGoal?.goal_type || 'lessons');
    const [targetValue, setTargetValue] = useState(weeklyGoal?.target_value || 5);
    const [saving, setSaving] = useState(false);

    const goalTypeLabels = {
        'lessons': { label: 'Lessons', icon: 'bi-book', unit: 'lessons' },
        'minutes': { label: 'Minutes', icon: 'bi-clock', unit: 'minutes' },
        'courses': { label: 'Courses', icon: 'bi-mortarboard', unit: 'courses' }
    };

    const currentGoal = goalTypeLabels[weeklyGoal?.goal_type || 'lessons'];
    const progressPercentage = weeklyGoal?.progress_percentage || 0;
    const currentValue = weeklyGoal?.current_value || 0;
    const target = weeklyGoal?.target_value || 5;

    const handleSaveGoal = async () => {
        setSaving(true);
        try {
            const response = await axios.post(`${baseUrl}/student/create-weekly-goal/${studentId}/`, {
                goal_type: goalType,
                target_value: targetValue
            });
            
            if (response.data.bool) {
                Swal.fire({
                    title: 'Goal Updated!',
                    text: 'Your weekly goal has been set.',
                    icon: 'success',
                    toast: true,
                    timer: 3000,
                    position: 'top-right',
                    showConfirmButton: false
                });
                setShowModal(false);
                if (onGoalUpdate) onGoalUpdate();
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update goal. Please try again.',
                icon: 'error',
                toast: true,
                timer: 3000,
                position: 'top-right',
                showConfirmButton: false
            });
        }
        setSaving(false);
    };

    const getMotivationalMessage = () => {
        if (progressPercentage >= 100) return "🎉 Goal achieved! Amazing work!";
        if (progressPercentage >= 75) return "Almost there! Keep pushing!";
        if (progressPercentage >= 50) return "Halfway through! You got this!";
        if (progressPercentage >= 25) return "Great start! Keep it up!";
        return "Let's crush this week's goal!";
    };

    return (
        <>
            <div className="card h-100 border-0 shadow-sm weekly-goal-card">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 className="card-title mb-1">
                                <i className={`bi ${currentGoal.icon} me-2 text-primary`}></i>
                                Weekly Goal
                            </h5>
                            <p className="text-muted small mb-0">{getMotivationalMessage()}</p>
                        </div>
                        <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowModal(true)}
                        >
                            <i className="bi bi-gear"></i>
                        </button>
                    </div>

                    {/* Circular Progress */}
                    <div className="text-center mb-3">
                        <div className="circular-progress" style={{ '--progress': progressPercentage }}>
                            <div className="circular-progress-inner">
                                <span className="progress-value">{currentValue}</span>
                                <span className="progress-divider">/</span>
                                <span className="progress-target">{target}</span>
                            </div>
                        </div>
                        <p className="mt-2 mb-0">
                            <span className="badge bg-light text-dark">
                                {currentGoal.label}
                            </span>
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress mb-2" style={{ height: '10px' }}>
                        <div 
                            className={`progress-bar ${progressPercentage >= 100 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                    </div>
                    <div className="d-flex justify-content-between">
                        <small className="text-muted">{progressPercentage}% complete</small>
                        <small className="text-muted">{target - currentValue} {currentGoal.unit} left</small>
                    </div>

                    {weeklyGoal?.is_achieved && (
                        <div className="alert alert-success mt-3 mb-0 py-2">
                            <i className="bi bi-trophy-fill me-2"></i>
                            Goal Achieved!
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .weekly-goal-card {
                        background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
                        border-radius: 16px;
                    }

                    .circular-progress {
                        width: 120px;
                        height: 120px;
                        border-radius: 50%;
                        background: conic-gradient(
                            #4f46e5 calc(var(--progress) * 1%),
                            #e5e7eb calc(var(--progress) * 1%)
                        );
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto;
                        position: relative;
                    }

                    .circular-progress-inner {
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        background: #fff;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }

                    .progress-value {
                        font-size: 1.75rem;
                        font-weight: 700;
                        color: #4f46e5;
                        line-height: 1;
                    }

                    .progress-divider {
                        font-size: 0.9rem;
                        color: #9ca3af;
                        margin: 2px 0;
                    }

                    .progress-target {
                        font-size: 1rem;
                        color: #6b7280;
                    }
                `}</style>
            </div>

            {/* Goal Settings Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Set Weekly Goal</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Goal Type</label>
                                    <div className="row g-2">
                                        {Object.entries(goalTypeLabels).map(([key, value]) => (
                                            <div key={key} className="col-6">
                                                <div 
                                                    className={`goal-type-option ${goalType === key ? 'active' : ''}`}
                                                    onClick={() => setGoalType(key)}
                                                >
                                                    <i className={`bi ${value.icon} me-2`}></i>
                                                    {value.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Target ({goalTypeLabels[goalType].unit} per week)</label>
                                    <input 
                                        type="range" 
                                        className="form-range" 
                                        min="1" 
                                        max={goalType === 'minutes' ? 300 : 20} 
                                        value={targetValue}
                                        onChange={(e) => setTargetValue(parseInt(e.target.value))}
                                    />
                                    <div className="text-center">
                                        <span className="badge bg-primary fs-5">{targetValue}</span>
                                        <span className="ms-2 text-muted">{goalTypeLabels[goalType].unit}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handleSaveGoal}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Goal'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .goal-type-option {
                    padding: 0.75rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .goal-type-option:hover {
                    border-color: #4f46e5;
                    background: #f0f9ff;
                }

                .goal-type-option.active {
                    border-color: #4f46e5;
                    background: #4f46e5;
                    color: #fff;
                }
            `}</style>
        </>
    );
};

export default WeeklyGoalCard;
