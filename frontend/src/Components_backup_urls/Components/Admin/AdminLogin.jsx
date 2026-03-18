import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_BASE_URL } from '../../config';
import { validateLoginForm, FieldError } from '../../utils/formValidation';

const baseUrl = API_BASE_URL;

const AdminLogin = () => {
    const navigate = useNavigate();
    const [adminLoginData, setAdminLoginData] = useState({
        email: '',
        password: ''
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        document.title = 'Admin Login | Kannari Music Academy';
        const adminLoginStatus = localStorage.getItem('adminLoginStatus');
        if (adminLoginStatus === 'true') {
            navigate('/admin-dashboard');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setAdminLoginData({
            ...adminLoginData,
            [e.target.name]: e.target.value
        });
        setErrorMsg('');
    };

    const submitForm = async (e) => {
        e.preventDefault();

        const errors = validateLoginForm(adminLoginData);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setLoading(true);
        
        const formData = new FormData();
        formData.append('email', adminLoginData.email);
        formData.append('password', adminLoginData.password);

        try {
            const response = await axios.post(`${baseUrl}/admin-login`, formData);
            if (response.data.bool === true) {
                localStorage.setItem('adminLoginStatus', 'true');
                localStorage.setItem('adminId', response.data.admin_id);
                localStorage.setItem('adminRole', response.data.role);
                localStorage.setItem('adminName', response.data.name);
                navigate('/admin-dashboard');
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
                        background: '#fff3e0',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: '#e65100',
                        fontWeight: '500',
                        marginBottom: '20px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Secure Admin Access
                    </div>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '10px',
                        letterSpacing: '-0.5px'
                    }}>Admin Portal</h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#6b7280',
                        fontWeight: '400'
                    }}>Access your administrative dashboard</p>
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
                        onMouseEnter={(e) => e.target.style.color = '#1976d2'}
                        onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to home
                        </Link>

                        {/* Header with Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <div>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: '600',
                                    color: '#1a1a1a',
                                    marginBottom: '4px',
                                    letterSpacing: '-0.3px'
                                }}>Admin Sign In</h2>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: 0
                                }}>Enter your credentials to continue</p>
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
                        <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* Email Address */}
                            <div>
                                <label htmlFor="email" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    onChange={handleChange}
                                    value={adminLoginData.email}
                                    placeholder="admin@kannari.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '15px',
                                        border: fieldErrors.email ? '1px solid #ef4444' : '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        color: '#1a1a1a'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = fieldErrors.email ? '#ef4444' : '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <FieldError error={fieldErrors.email} />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '8px'
                                }}>Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    onChange={handleChange}
                                    value={adminLoginData.password}
                                    placeholder="Enter your admin password"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '15px',
                                        border: fieldErrors.password ? '1px solid #ef4444' : '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        color: '#1a1a1a'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = fieldErrors.password ? '#ef4444' : '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <FieldError error={fieldErrors.password} />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '14px 24px',
                                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
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
                                    boxShadow: loading ? 'none' : '0 4px 12px rgba(255, 107, 107, 0.4)',
                                    opacity: loading ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.target.style.transform = 'translateY(-1px)';
                                        e.target.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                                    }
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                            style={{
                                                animation: 'spin 1s linear infinite'
                                            }}
                                        >
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                        Logging in...
                                        <style>
                                            {`
                                                @keyframes spin {
                                                    from { transform: rotate(0deg); }
                                                    to { transform: rotate(360deg); }
                                                }
                                            `}
                                        </style>
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </>
                                )}
                            </button>

                        </form>
                    </div>

                    {/* Security Notice */}
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        background: '#fff9e6',
                        border: '1px solid #ffe58f',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d48806" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <div>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#7c4a03',
                                fontWeight: '500',
                                marginBottom: '4px'
                            }}>Authorized Access Only</p>
                            <p style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#8c6e1f',
                                lineHeight: '1.5'
                            }}>
                                This portal is restricted to authorized administrators. All login attempts are monitored and logged.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;