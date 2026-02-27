import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolLogin = () => {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = 'School Login | Kannari Music Academy';
        const schoolLoginStatus = localStorage.getItem('schoolLoginStatus');
        if (schoolLoginStatus === 'true') {
            navigate('/school-dashboard');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
        setErrorMsg('');
    };

    const submitForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData();
        formData.append('email', loginData.email);
        formData.append('password', loginData.password);

        try {
            const response = await axios.post(`${baseUrl}/school-login`, formData);
            if (response.data.bool === true) {
                localStorage.setItem('schoolLoginStatus', 'true');
                localStorage.setItem('schoolUserId', response.data.school_user_id);
                localStorage.setItem('schoolId', response.data.school_id);
                localStorage.setItem('schoolName', response.data.school_name);
                localStorage.setItem('schoolEmail', response.data.school_email);
                navigate('/school-dashboard');
            } else {
                setErrorMsg('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrorMsg('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
            padding: '40px 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ maxWidth: '1200px', width: '100%' }}>
                
                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 20px',
                        background: '#e3f2fd',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: '#1565c0',
                        fontWeight: '500',
                        marginBottom: '20px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        School Partner Portal
                    </div>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '10px',
                        letterSpacing: '-0.5px'
                    }}>School Access</h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#6b7280',
                        fontWeight: '400'
                    }}>Sign in to manage your school account</p>
                </div>

                {/* Main Card */}
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '48px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    }}>
                        
                        {/* Back Link */}
                        <Link to="/" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#6b7280',
                            textDecoration: 'none',
                            fontSize: '14px',
                            marginBottom: '32px',
                            fontWeight: '500',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#1565c0'}
                        onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Home
                        </Link>

                        {/* Header with Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: '600',
                                    color: '#1a1a1a',
                                    marginBottom: '4px',
                                    letterSpacing: '-0.3px'
                                }}>School Login</h2>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: 0
                                }}>Enter your school credentials</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMsg && (
                            <div style={{
                                padding: '14px 16px',
                                background: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '8px',
                                color: '#721c24',
                                marginBottom: '24px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                ⚠ {errorMsg}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submitForm}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                
                                {/* Email Address */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}>Email</label>
                                    <input
                                        type="email"
                                        onChange={handleChange}
                                        name="email"
                                        value={loginData.email}
                                        placeholder="school@kannari.com"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            fontSize: '15px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box',
                                            color: '#1a1a1a'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1976d2';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#374151',
                                        marginBottom: '8px'
                                    }}>Password</label>
                                    <input
                                        type="password"
                                        onChange={handleChange}
                                        name="password"
                                        value={loginData.password}
                                        placeholder="Enter your school password"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            fontSize: '15px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box',
                                            color: '#1a1a1a'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1976d2';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '14px 24px',
                                        background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        marginTop: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: loading ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading) {
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 6px 16px rgba(25, 118, 210, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!loading) {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.3)';
                                        }
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <span style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid #ffffff',
                                                borderTopColor: 'transparent',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                animation: 'spin 0.6s linear infinite'
                                            }}></span>
                                            Logging in...
                                            <style>{`
                                                @keyframes spin {
                                                    to { transform: rotate(360deg); }
                                                }
                                            `}</style>
                                        </>
                                    ) : (
                                        <>
                                            Login
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                                <polyline points="10 17 15 12 10 7"></polyline>
                                                <line x1="15" y1="12" x2="3" y2="12"></line>
                                            </svg>
                                        </>
                                    )}
                                </button>

                            </div>
                        </form>
                    </div>

                    {/* Info Notice */}
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '12px',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#6b7280',
                            lineHeight: '1.5'
                        }}>
                            Need help accessing your school account? Contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolLogin;