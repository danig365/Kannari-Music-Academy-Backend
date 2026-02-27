import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherDetail = () => {
    const { teacher_id } = useParams();
    const navigate = useNavigate();
    const studentLoginStatus = localStorage.getItem('studentLoginStatus');
    const [teacherData, setTeacherData] = useState(null);
    const [courseData, setCourseData] = useState([]);
    const [skillList, setSkillList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Authentication check
    useEffect(() => {
        if (studentLoginStatus !== 'true') {
            navigate('/user-login');
        }
    }, [studentLoginStatus, navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        document.title = 'LMS | Teacher Details';
    }, []);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const response = await axios.get(`${baseUrl}/teacher/${teacher_id}`);
                setTeacherData(response.data);
                setCourseData(response.data.teacher_courses || []);
                setSkillList(response.data.skill_list || []);
                setLoading(false);
            } catch (error) {
                console.log('Error fetching teacher data:', error);
                setLoading(false);
            }
        };
        if (teacher_id && studentLoginStatus === 'true') {
            fetchTeacherData();
        }
    }, [teacher_id, studentLoginStatus]);

    // Loading state - show spinner while fetching
    if (loading && studentLoginStatus === 'true') {
        return <LoadingSpinner fullScreen size="xl" text="Loading teacher profile..." />;
    }

    // Not authenticated - don't render anything (redirect happens in useEffect)
    if (studentLoginStatus !== 'true') {
        return null;
    }

    // Teacher not found
    if (!teacherData) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#1f2937' }}>Teacher not found</h3>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
            {/* Header Section */}
            <div style={{
                backgroundColor: 'linear-gradient(135deg, #4285f4 0%, #3b5998 100%)',
                paddingTop: '3rem',
                paddingBottom: '2rem',
                marginBottom: '2rem'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', paddingX: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                        {/* Profile Image */}
                        <div style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '4px solid white',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                            backgroundColor: '#e5e7eb'
                        }}>
                            {teacherData.profile_img ? (
                                <img
                                    src={teacherData.profile_img}
                                    alt={teacherData.full_name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#d1d5db',
                                    color: 'white',
                                    fontSize: '4rem',
                                    fontWeight: '600'
                                }}>
                                    {teacherData.full_name?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Teacher Info */}
                        <div style={{ color: 'white' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                {teacherData.full_name}
                            </h1>
                            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>
                                {teacherData.detail}
                            </p>

                            {/* Quick Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>TOTAL COURSES</p>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>{teacherData.total_teacher_course || 0}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>EMAIL</p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{teacherData.email}</p>
                                </div>
                            </div>

                            {/* Skills */}
                            {skillList.length > 0 && (
                                <div>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: '600' }}>SKILLS</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {skillList.map((skill, index) => (
                                            <span
                                                key={index}
                                                style={{
                                                    display: 'inline-block',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    color: 'white',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    border: '1px solid rgba(255, 255, 255, 0.3)'
                                                }}
                                            >
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
                {/* About Section */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{ color: '#1f2937', fontWeight: '700', marginBottom: '1rem' }}>
                        <i className="bi bi-info-circle me-2" style={{ color: '#4285f4' }}></i>
                        About
                    </h3>
                    <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {teacherData.detail}
                    </p>

                    {/* Qualifications */}
                    {teacherData.qualification && (
                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                            <h5 style={{ color: '#374151', fontWeight: '600', marginBottom: '0.5rem' }}>Qualifications</h5>
                            <p style={{ color: '#6b7280' }}>{teacherData.qualification}</p>
                        </div>
                    )}

                    {/* Social Links */}
                    <div>
                        <h5 style={{ color: '#374151', fontWeight: '600', marginBottom: '1rem' }}>Follow</h5>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {teacherData.face_url && (
                                <a
                                    href={teacherData.face_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1877f2',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    <i className="bi bi-facebook" style={{ fontSize: '1.2rem' }}></i>
                                </a>
                            )}
                            {teacherData.insta_url && (
                                <a
                                    href={teacherData.insta_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    <i className="bi bi-instagram" style={{ fontSize: '1.2rem' }}></i>
                                </a>
                            )}
                            {teacherData.twit_url && (
                                <a
                                    href={teacherData.twit_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1DA1F2',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    <i className="bi bi-twitter" style={{ fontSize: '1.2rem' }}></i>
                                </a>
                            )}
                            {teacherData.you_url && (
                                <a
                                    href={teacherData.you_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: '#FF0000',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    <i className="bi bi-youtube" style={{ fontSize: '1.2rem' }}></i>
                                </a>
                            )}
                            {teacherData.web_url && (
                                <a
                                    href={teacherData.web_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: '#4285f4',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    <i className="bi bi-globe2" style={{ fontSize: '1.2rem' }}></i>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Courses Section */}
                {courseData.length > 0 && (
                    <div>
                        <h3 style={{
                            color: '#1f2937',
                            fontWeight: '700',
                            marginBottom: '1.5rem'
                        }}>
                            <i className="bi bi-book me-2" style={{ color: '#4285f4' }}></i>
                            Courses by {teacherData.full_name}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {courseData.map((course, index) => (
                                <Link
                                    to={`/detail/${course.id}`}
                                    key={index}
                                    style={{
                                        textDecoration: 'none',
                                        backgroundColor: 'white',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.3s ease'
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
                                    <div style={{
                                        width: '100%',
                                        height: '160px',
                                        backgroundColor: '#4285f4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <i className="bi bi-book" style={{ fontSize: '2.5rem' }}></i>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <h6 style={{
                                            color: '#1f2937',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {course.title}
                                        </h6>
                                        <p style={{
                                            color: '#6b7280',
                                            fontSize: '0.875rem',
                                            marginBottom: 0,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {course.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDetail;
