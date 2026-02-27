import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolDashboard = () => {
    const schoolId = localStorage.getItem('schoolId');
    const schoolName = localStorage.getItem('schoolName');
    const [stats, setStats] = useState({
        total_teachers: 0,
        total_students: 0,
        total_courses: 0,
        total_groups: 0,
        total_lesson_assignments: 0,
        school_name: '',
        school_status: '',
        recent_assignments: [],
        group_classes: [],
        teachers: [],
        students: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'School Dashboard | Kannari Music Academy';
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${baseUrl}/school/dashboard/${schoolId}/`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching school stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    return (
        <>
            <h2 className="mb-4 school-dashboard-header">
                <i className="bi bi-building me-2"></i>
                {schoolName || 'School'} Dashboard
            </h2>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card school-stat-card bg-primary h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-person-check"></i>
                            <h3 className="mt-2">{stats.total_teachers}</h3>
                            <p className="mb-0">Teachers</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card school-stat-card bg-success h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-people"></i>
                            <h3 className="mt-2">{stats.total_students}</h3>
                            <p className="mb-0">Students</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card school-stat-card bg-info h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-book"></i>
                            <h3 className="mt-2">{stats.total_courses}</h3>
                            <p className="mb-0">Courses</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card school-stat-card bg-warning h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-diagram-3"></i>
                            <h3 className="mt-2">{stats.total_groups}</h3>
                            <p className="mb-0">Groups</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card school-stat-card bg-danger h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-journal-bookmark"></i>
                            <h3 className="mt-2">{stats.total_lesson_assignments}</h3>
                            <p className="mb-0">Assignments</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Teachers */}
                <div className="col-12 col-lg-6">
                    <div className="card school-content-card h-100">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-person-check me-2"></i>
                                Teachers
                            </h5>
                            <Link to="/school/teachers" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            {stats.teachers?.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {stats.teachers.map((teacher, index) => (
                                        <li key={index} className="list-group-item school-list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{teacher.name}</strong>
                                                <br />
                                                <small className="text-muted">{teacher.email}</small>
                                            </div>
                                            <div className="text-end">
                                                <span className="badge bg-primary me-1">{teacher.courses} courses</span>
                                                <span className="badge bg-success">{teacher.students} {teacher.students === 1 ? 'student' : 'students'}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No teachers assigned yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Students */}
                <div className="col-12 col-lg-6">
                    <div className="card school-content-card h-100">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-people me-2"></i>
                                Students
                            </h5>
                            <Link to="/school/students" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            {stats.students?.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {stats.students.map((student, index) => (
                                        <li key={index} className="list-group-item school-list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{student.name}</strong>
                                                <br />
                                                <small className="text-muted">{student.email}</small>
                                            </div>
                                            <span className="badge bg-info">{student.enrolled_courses} courses</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No students enrolled yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Group Classes */}
                <div className="col-12 col-lg-6">
                    <div className="card school-content-card h-100">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-diagram-3 me-2"></i>
                                Group Classes
                            </h5>
                            <Link to="/school/group-classes" className="btn btn-sm btn-outline-primary">Manage</Link>
                        </div>
                        <div className="card-body">
                            {stats.group_classes?.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {stats.group_classes.map((group, index) => (
                                        <li key={index} className="list-group-item school-list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{group.name}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    <i className="bi bi-person-check me-1"></i>{group.teachers} teachers &middot;
                                                    <i className="bi bi-people ms-2 me-1"></i>{group.students} {group.students === 1 ? 'student' : 'students'}
                                                </small>
                                            </div>
                                            <span className={`badge ${group.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                {group.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No group classes created yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Lesson Assignments */}
                <div className="col-12 col-lg-6">
                    <div className="card school-content-card h-100">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-journal-bookmark me-2"></i>
                                Recent Assignments
                            </h5>
                            <Link to="/school/lesson-assignments" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            {stats.recent_assignments?.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Lesson</th>
                                                <th>Assigned To</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recent_assignments.map((a, index) => (
                                                <tr key={index}>
                                                    <td className="text-truncate" style={{ maxWidth: '120px' }}>{a.lesson_title}</td>
                                                    <td>{a.target}</td>
                                                    <td>
                                                        <span className={`badge ${a.assignment_type === 'group' ? 'bg-warning' : 'bg-info'}`}>
                                                            {a.assignment_type}
                                                        </span>
                                                    </td>
                                                    <td><small>{a.assigned_at}</small></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted text-center school-empty-state">No lesson assignments yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SchoolDashboard;
