import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './AdminDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_schools: 0,
        total_teachers: 0,
        total_students: 0,
        total_courses: 0,
        total_enrollments: 0,
        recent_enrollments: [],
        popular_courses: [],
        monthly_stats: { labels: [], enrollments: [] },
        category_stats: [],
        top_teachers: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Admin Dashboard | Kannari Music Academy';
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${baseUrl}/admin/stats/`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    return (
        <>
            <h2 className="mb-4 admin-dashboard-header">
                <i className="bi bi-speedometer2 me-2"></i>
                Admin Dashboard
            </h2>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card admin-stat-card bg-primary h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-building"></i>
                            <h3 className="mt-2">{stats.total_schools}</h3>
                            <p className="mb-0">Schools</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card admin-stat-card bg-success h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-person-check"></i>
                            <h3 className="mt-2">{stats.total_teachers}</h3>
                            <p className="mb-0">Teachers</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card admin-stat-card bg-info h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-people"></i>
                            <h3 className="mt-2">{stats.total_students}</h3>
                            <p className="mb-0">Students</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card admin-stat-card bg-warning h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-book"></i>
                            <h3 className="mt-2">{stats.total_courses}</h3>
                            <p className="mb-0">Courses</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                    <div className="card admin-stat-card bg-danger h-100">
                        <div className="card-body text-center">
                            <i className="bi bi-people"></i>
                            <h3 className="mt-2">{stats.total_enrollments}</h3>
                            <p className="mb-0">Enrollments</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {/* Recent Enrollments */}
                <div className="col-12 col-lg-6">
                    <div className="card admin-content-card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-clock-history me-2"></i>
                                Recent Enrollments
                            </h5>
                        </div>
                        <div className="card-body">
                            {stats.recent_enrollments.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Course</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recent_enrollments.map((enrollment, index) => (
                                                <tr key={index}>
                                                    <td>{enrollment.student_name}</td>
                                                    <td className="text-truncate" style={{maxWidth: '150px'}}>
                                                        {enrollment.course_title}
                                                    </td>
                                                    <td><small>{enrollment.enrolled_time}</small></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted text-center admin-empty-state">No recent enrollments</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Popular Courses */}
                <div className="col-12 col-lg-6">
                    <div className="card admin-content-card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-star me-2"></i>
                                Popular Courses
                            </h5>
                        </div>
                        <div className="card-body">
                            {stats.popular_courses.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {stats.popular_courses.map((course, index) => (
                                        <li key={index} className="list-group-item admin-list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{course.title}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    <i className="bi bi-people me-1"></i>
                                                    {course.enrollments} {course.enrollments === 1 ? 'student' : 'students'}
                                                </small>
                                            </div>
                                            <span className="badge bg-warning">
                                                <i className="bi bi-star-fill me-1"></i>
                                                {course.rating?.toFixed(1) || 'New'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted text-center admin-empty-state">Your musical journey starts here.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Teachers */}
                <div className="col-12 col-lg-6">
                    <div className="card admin-content-card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-trophy me-2"></i>
                                Top Teachers
                            </h5>
                        </div>
                        <div className="card-body">
                            {stats.top_teachers?.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {stats.top_teachers.map((teacher, index) => (
                                        <li key={index} className="list-group-item admin-list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{teacher.name}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    <i className="bi bi-book me-1"></i>
                                                    {teacher.courses} courses
                                                </small>
                                            </div>
                                            <span className="badge bg-success">
                                                <i className="bi bi-people me-1"></i>
                                                {teacher.students} {teacher.students === 1 ? 'student' : 'students'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted text-center admin-empty-state">No teachers yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category Stats */}
                <div className="col-12 col-lg-6">
                    <div className="card admin-content-card h-100">
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-tags me-2"></i>
                                Courses by Category
                            </h5>
                        </div>
                        <div className="card-body">
                            {stats.category_stats?.length > 0 ? (
                                <ul className="list-group list-group-flush">
                                    {stats.category_stats.map((category, index) => (
                                        <li key={index} className="list-group-item admin-list-group-item d-flex justify-content-between align-items-center">
                                            <span>{category.title}</span>
                                            <span className="badge bg-primary rounded-pill">
                                                {category.course_count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted text-center admin-empty-state">No categories yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
