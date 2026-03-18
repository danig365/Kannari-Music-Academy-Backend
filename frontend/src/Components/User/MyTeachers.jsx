import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyTeachers = () => {
    const navigate = useNavigate();
    const studentId = localStorage.getItem('studentId');
    const studentLoginStatus = localStorage.getItem('studentLoginStatus');
    const [teacherData, setTeacherData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Authentication check
    useEffect(() => {
        if (studentLoginStatus !== 'true') {
            navigate('/student/login');
        }
    }, [studentLoginStatus, navigate]);

    useEffect(() => {
        document.title = 'LMS | My Teachers';
    }, []);

    useEffect(() => {
        if (studentLoginStatus === 'true') {
            const fetchTeachers = async () => {
                try {
                    const response = await axios.get(`${baseUrl}/fetch-my-teachers/${studentId}`);
                    setTeacherData(response.data);
                    setLoading(false);
                } catch (error) {
                    console.log('Error fetching teachers:', error);
                    setLoading(false);
                }
            };
            if (studentId) {
                fetchTeachers();
            }
        }
    }, [studentId, studentLoginStatus]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <div className="dashboard-content">
                    <div className="dashboard-main">
                        <LoadingSpinner size="lg" text="Loading teachers..." />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <div className="dashboard-main">
                {/* Header */}
                <div className="mb-4">
                    <h2 style={{
                        color: '#1f2937',
                        fontWeight: '700',
                        marginBottom: '0.5rem'
                    }}>
                        <i className="bi bi-people me-2" style={{ color: '#4285f4' }}></i>
                        My Teachers
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: 0 }}>
                        {teacherData.length} teacher{teacherData.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Teachers Grid */}
                {teacherData.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '3rem',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                        <i className="bi bi-person-fill-x" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem', display: 'block' }}></i>
                        <h5 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>No Teachers Yet</h5>
                        <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                            Enroll in courses to connect with teachers
                        </p>
                        <Link
                            to="/all-courses"
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#4285f4',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                border: 'none'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#3b7ce1'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#4285f4'}
                        >
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {teacherData.map((enrollment, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                }}
                            >
                                {/* Teacher Avatar */}
                                <Link to={`/teacher-detail/${enrollment.teacher.id}`}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        backgroundColor: '#4285f4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1rem',
                                        overflow: 'hidden',
                                        border: '3px solid #e5e7eb',
                                        transition: 'all 0.2s'
                                    }}>
                                        {enrollment.teacher.profile_img ? (
                                            <img
                                                src={enrollment.teacher.profile_img}
                                                alt={enrollment.teacher.full_name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <span style={{ color: 'white', fontSize: '2rem', fontWeight: '600' }}>
                                                {enrollment.teacher.full_name?.substring(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                {/* Teacher Name */}
                                <Link to={`/teacher-detail/${enrollment.teacher.id}`} style={{ textDecoration: 'none' }}>
                                    <h5 style={{
                                        color: '#1f2937',
                                        fontWeight: '600',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {enrollment.teacher.full_name}
                                    </h5>
                                </Link>

                                {/* Teacher Email */}
                                <p style={{
                                    color: '#6b7280',
                                    fontSize: '0.875rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <i className="bi bi-envelope me-1"></i>
                                    {enrollment.teacher.email}
                                </p>

                                {/* Course Info */}
                                <p style={{
                                    color: '#9ca3af',
                                    fontSize: '0.875rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <i className="bi bi-book me-1"></i>
                                    {enrollment.course?.title}
                                </p>

                                {/* Action Buttons */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    width: '100%'
                                }}>
                                    <Link
                                        to={`/teacher-detail/${enrollment.teacher.id}`}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#4285f4',
                                            color: 'white',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            textAlign: 'center',
                                            fontWeight: '500',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s',
                                            border: 'none'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#3b7ce1'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#4285f4'}
                                    >
                                        <i className="bi bi-person me-1"></i> View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default MyTeachers;
