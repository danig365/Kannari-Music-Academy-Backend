import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolProgress = () => {
    const schoolId = localStorage.getItem('schoolId');
    const [progress, setProgress] = useState({
        total_enrollments: 0,
        total_students: 0,
        student_progress: [],
        group_progress: [],
        recent_completions: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Progress Overview | School Portal';
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            const response = await axios.get(`${baseUrl}/school/progress/${schoolId}/`);
            setProgress(response.data);
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading progress..." />
            </div>
        );
    }

    return (
        <>
            <h2 className="mb-4 school-dashboard-header">
                <i className="bi bi-graph-up me-2"></i>
                Progress Overview
            </h2>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-4 col-lg-3">
                    <div className="card school-stat-card bg-primary h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-people"></i>
                            <h3 className="mt-2">{progress.total_students}</h3>
                            <p className="mb-0">Total Students</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-4 col-lg-3">
                    <div className="card school-stat-card bg-success h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-journal-check"></i>
                            <h3 className="mt-2">{progress.total_enrollments}</h3>
                            <p className="mb-0">Total Enrollments</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Student Progress */}
                <div className="col-12 col-lg-6">
                    <div className="card school-content-card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-person-lines-fill me-2"></i>
                                Student Progress
                            </h5>
                        </div>
                        <div className="card-body">
                            {progress.student_progress?.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Courses</th>
                                                <th>Avg Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {progress.student_progress.map((sp, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <strong>{sp.name}</strong>
                                                        <br /><small className="text-muted">{sp.email}</small>
                                                    </td>
                                                    <td>{sp.total_courses}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                <div className="progress-bar bg-primary" style={{ width: `${sp.avg_progress}%` }}></div>
                                                            </div>
                                                            <small className="fw-bold">{sp.avg_progress}%</small>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No student progress data yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Group Progress */}
                <div className="col-12 col-lg-6">
                    <div className="card school-content-card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-diagram-3 me-2"></i>
                                Group Class Progress
                            </h5>
                        </div>
                        <div className="card-body">
                            {progress.group_progress?.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Group</th>
                                                <th>Students</th>
                                                <th>Teachers</th>
                                                <th>Avg Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {progress.group_progress.map((gp, index) => (
                                                <tr key={index}>
                                                    <td><strong>{gp.name}</strong></td>
                                                    <td>{gp.total_students}</td>
                                                    <td>{gp.total_teachers}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                <div className="progress-bar bg-success" style={{ width: `${gp.avg_progress}%` }}></div>
                                                            </div>
                                                            <small className="fw-bold">{gp.avg_progress}%</small>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No group classes yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Completions */}
                <div className="col-12">
                    <div className="card school-content-card">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-check-circle me-2"></i>
                                Recent Lesson Completions
                            </h5>
                        </div>
                        <div className="card-body">
                            {progress.recent_completions?.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Lesson</th>
                                                <th>Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {progress.recent_completions.map((c, index) => (
                                                <tr key={index}>
                                                    <td><strong>{c.student_name}</strong></td>
                                                    <td>{c.lesson_title}</td>
                                                    <td><small>{c.completed_at || '—'}</small></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No lesson completions recorded yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SchoolProgress;
