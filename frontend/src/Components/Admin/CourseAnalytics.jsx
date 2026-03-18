import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './CourseAnalytics.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const CourseAnalytics = () => {
    const { course_id } = useParams();
    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [progressData, setProgressData] = useState({});
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentProgress, setStudentProgress] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('progress');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        document.title = 'Course Analytics | Admin Dashboard';
        if (course_id) {
            fetchCourseData();
            fetchEnrolledStudents();
        }
    }, [course_id]);

    const fetchCourseData = async () => {
        try {
            const response = await axios.get(`${baseUrl}/course/${course_id}/`);
            setCourseData(response.data);
        } catch (error) {
            console.error('Error fetching course:', error);
        }
    };

    const fetchEnrolledStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseUrl}/enrolled-students/${course_id}/`);
            const students = response.data || [];
            setEnrolledStudents(students);
            
            // Fetch progress for each student
            const progressPromises = students.map(async (enrollment) => {
                try {
                    const progressRes = await axios.get(
                        `${baseUrl}/student/${enrollment.student?.id}/course/${course_id}/progress-enhanced/`
                    );
                    return { studentId: enrollment.student?.id, progress: progressRes.data };
                } catch (err) {
                    return { studentId: enrollment.student?.id, progress: null };
                }
            });
            
            const progressResults = await Promise.all(progressPromises);
            const progressMap = {};
            progressResults.forEach(({ studentId, progress }) => {
                if (studentId) {
                    progressMap[studentId] = progress;
                }
            });
            setProgressData(progressMap);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentProgress = async (student) => {
        setSelectedStudent(student);
        try {
            const response = await axios.get(
                `${baseUrl}/student/${student.id}/course/${course_id}/progress-enhanced/`
            );
            setStudentProgress(response.data);
        } catch (error) {
            console.error('Error fetching student progress:', error);
            setStudentProgress(null);
        }
    };

    const getProgressPercentage = (studentId) => {
        const progress = progressData[studentId];
        if (!progress) return 0;
        return progress.overall_progress || 0;
    };

    const getCompletedLessons = (studentId) => {
        const progress = progressData[studentId];
        if (!progress) return 0;
        return progress.completed_lessons || 0;
    };

    const getTotalLessons = (studentId) => {
        const progress = progressData[studentId];
        if (!progress) return 0;
        return progress.total_lessons || 0;
    };

    const filteredStudents = enrolledStudents
        .filter(enrollment => {
            const student = enrollment.student;
            if (!student) return false;
            const searchLower = searchTerm.toLowerCase();
            return (
                student.fullname?.toLowerCase().includes(searchLower) ||
                student.email?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'progress') {
                const progressA = getProgressPercentage(a.student?.id);
                const progressB = getProgressPercentage(b.student?.id);
                return sortOrder === 'desc' ? progressB - progressA : progressA - progressB;
            } else if (sortBy === 'name') {
                const nameA = a.student?.fullname || '';
                const nameB = b.student?.fullname || '';
                return sortOrder === 'desc' 
                    ? nameB.localeCompare(nameA)
                    : nameA.localeCompare(nameB);
            } else if (sortBy === 'enrolled') {
                const dateA = new Date(a.enrolled_time);
                const dateB = new Date(b.enrolled_time);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
            return 0;
        });

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#22c55e';
        if (percentage >= 50) return '#f59e0b';
        if (percentage >= 25) return '#3b82f6';
        return '#ef4444';
    };

    const averageProgress = enrolledStudents.length > 0
        ? Math.round(
            enrolledStudents.reduce((sum, e) => sum + getProgressPercentage(e.student?.id), 0) 
            / enrolledStudents.length
        )
        : 0;

    const completedStudents = enrolledStudents.filter(
        e => getProgressPercentage(e.student?.id) === 100
    ).length;

    if (loading) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading analytics..." />
            </div>
        );
    }

    return (
        <div className="course-analytics-container">
            {/* Header */}
            <div className="analytics-header">
                <div className="d-flex align-items-center gap-3">
                    <Link
                        to="/admin-panel/lesson-management"
                        className="btn back-btn"
                    >
                        <i className="bi bi-arrow-left"></i>
                    </Link>
                    <div>
                        <h2 className="analytics-title">
                            <i className="bi bi-graph-up me-2"></i>
                            Course Analytics
                        </h2>
                        <p className="analytics-subtitle">{courseData?.title}</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{enrolledStudents.length}</h3>
                        <p>Total Enrolled</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                        <i className="bi bi-trophy-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{completedStudents}</h3>
                        <p>Completed Course</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <i className="bi bi-percent"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{averageProgress}%</h3>
                        <p>Average Progress</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                        <i className="bi bi-collection-play-fill"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{courseData?.total_modules || 0}</h3>
                        <p>Total Modules</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="sort-controls">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="progress">Sort by Progress</option>
                        <option value="name">Sort by Name</option>
                        <option value="enrolled">Sort by Enrolled Date</option>
                    </select>
                    <button
                        className="sort-order-btn"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        <i className={`bi bi-sort-${sortOrder === 'desc' ? 'down' : 'up'}`}></i>
                    </button>
                </div>
            </div>

            {/* Students List */}
            <div className="students-grid">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((enrollment) => {
                        const student = enrollment.student;
                        if (!student) return null;
                        const progress = getProgressPercentage(student.id);
                        const completed = getCompletedLessons(student.id);
                        const total = getTotalLessons(student.id);
                        
                        return (
                            <div
                                key={enrollment.id}
                                className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                                onClick={() => fetchStudentProgress(student)}
                            >
                                <div className="student-header">
                                    <div className="student-avatar">
                                        {student.profile_img ? (
                                            <img src={student.profile_img} alt={student.fullname} />
                                        ) : (
                                            <span>{student.fullname?.charAt(0) || 'S'}</span>
                                        )}
                                    </div>
                                    <div className="student-info">
                                        <h4>{student.fullname || 'Unknown Student'}</h4>
                                        <p>{student.email}</p>
                                    </div>
                                    <div 
                                        className="progress-badge"
                                        style={{ 
                                            backgroundColor: `${getProgressColor(progress)}15`,
                                            color: getProgressColor(progress)
                                        }}
                                    >
                                        {progress}%
                                    </div>
                                </div>
                                <div className="progress-section">
                                    <div className="progress-bar-track">
                                        <div 
                                            className="progress-bar-fill"
                                            style={{ 
                                                width: `${progress}%`,
                                                background: `linear-gradient(90deg, ${getProgressColor(progress)} 0%, ${getProgressColor(progress)}cc 100%)`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="progress-meta">
                                        <span>{completed} / {total} lessons</span>
                                        <span>
                                            Enrolled: {new Date(enrollment.enrolled_time).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <i className="bi bi-people"></i>
                        <h4>No Students Found</h4>
                        <p>No students match your search criteria</p>
                    </div>
                )}
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && studentProgress && (
                <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                    <div className="student-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="d-flex align-items-center gap-3">
                                <div className="student-avatar large">
                                    {selectedStudent.profile_img ? (
                                        <img src={selectedStudent.profile_img} alt={selectedStudent.fullname} />
                                    ) : (
                                        <span>{selectedStudent.fullname?.charAt(0) || 'S'}</span>
                                    )}
                                </div>
                                <div>
                                    <h3>{selectedStudent.fullname}</h3>
                                    <p>{selectedStudent.email}</p>
                                </div>
                            </div>
                            <button 
                                className="close-btn"
                                onClick={() => setSelectedStudent(null)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Overall Progress */}
                            <div className="overall-progress-card">
                                <div className="progress-circle">
                                    <svg viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                                        <circle 
                                            cx="50" cy="50" r="45" 
                                            fill="none" 
                                            stroke={getProgressColor(studentProgress.overall_progress || 0)}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(studentProgress.overall_progress || 0) * 2.83} 283`}
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                    <span className="progress-text">{studentProgress.overall_progress || 0}%</span>
                                </div>
                                <div className="progress-stats">
                                    <div className="stat">
                                        <span className="value">{studentProgress.completed_lessons || 0}</span>
                                        <span className="label">Completed</span>
                                    </div>
                                    <div className="stat">
                                        <span className="value">{studentProgress.total_lessons || 0}</span>
                                        <span className="label">Total Lessons</span>
                                    </div>
                                </div>
                            </div>

                            {/* Module Progress */}
                            <h4 className="section-title">Module Progress</h4>
                            <div className="modules-progress-list">
                                {studentProgress.modules?.map((module, index) => (
                                    <div key={module.id || index} className="module-progress-item">
                                        <div className="module-header">
                                            <span className="module-number">{index + 1}</span>
                                            <div className="module-info">
                                                <h5>{module.title}</h5>
                                                <p>{module.completed_lessons || 0} / {module.total_lessons || 0} lessons</p>
                                            </div>
                                            <span 
                                                className="module-progress-badge"
                                                style={{ color: getProgressColor(module.progress || 0) }}
                                            >
                                                {module.progress || 0}%
                                            </span>
                                        </div>
                                        <div className="progress-bar-track small">
                                            <div 
                                                className="progress-bar-fill"
                                                style={{ 
                                                    width: `${module.progress || 0}%`,
                                                    background: getProgressColor(module.progress || 0)
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseAnalytics;
