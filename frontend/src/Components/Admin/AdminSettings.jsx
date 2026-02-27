import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const AdminSettings = () => {
    const adminId = localStorage.getItem('adminId');
    
    const [settings, setSettings] = useState({
        site_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        maintenance_mode: false,
        allow_registration: true,
        default_language: 'en',
        timezone: 'UTC'
    });
    
    const [admin, setAdmin] = useState({
        full_name: '',
        email: '',
        phone: '',
        role: '',
        profile_img: null
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        document.title = 'Settings | Admin Dashboard';
        fetchSettings();
        fetchAdminProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminId]);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${baseUrl}/get-settings/`);
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };
    
    const fetchAdminProfile = async () => {
        try {
            if (!adminId) {
                setErrorMsg('Admin ID not found. Please login again.');
                return;
            }
            const response = await axios.get(`${baseUrl}/admin-user/${adminId}/`);
            setAdmin({
                ...response.data,
                profile_img: response.data.profile_img || null
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            setErrorMsg('Failed to load profile. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings({
            ...settings,
            [e.target.name]: value
        });
    };
    
    const handleProfileChange = (e) => {
        if (e.target.type === 'file') {
            setAdmin({
                ...admin,
                profile_img: e.target.files[0]
            });
        } else {
            setAdmin({
                ...admin,
                [e.target.name]: e.target.value
            });
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await axios.put(`${baseUrl}/system-settings/${settings.id}/`, settings);
            setSuccessMsg('Settings saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setErrorMsg('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };
    
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');
        
        if (!admin.full_name || !admin.full_name.trim()) {
            setErrorMsg('Full Name is required');
            setSaving(false);
            return;
        }
        
        if (!admin.email || !admin.email.trim()) {
            setErrorMsg('Email is required');
            setSaving(false);
            return;
        }
        
        const formData = new FormData();
        formData.append('full_name', admin.full_name.trim());
        formData.append('email', admin.email.trim());
        formData.append('phone', admin.phone ? admin.phone.trim() : '');
        
        if (admin.profile_img instanceof File) {
            formData.append('profile_img', admin.profile_img);
        }

        try {
            await axios.put(`${baseUrl}/admin-user/${adminId}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            localStorage.setItem('adminName', admin.full_name);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error.response?.data) {
                const errorData = error.response.data;
                const errorMessage = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
                setErrorMsg(`Failed to update profile:\n${errorMessage}`);
            } else {
                setErrorMsg('Failed to update profile. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMsg('New passwords do not match!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setErrorMsg('Password must be at least 6 characters long!');
            return;
        }

        setSaving(true);
        
        const formData = new FormData();
        formData.append('password', passwordData.newPassword);

        try {
            await axios.post(`${baseUrl}/admin/change-password/${adminId}/`, formData);
            setSuccessMsg('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            setErrorMsg('Failed to change password. Please try again.');
            console.error('Error changing password:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading settings..." />
            </div>
        );
    }

    return (
        <>
            <div className="mb-4">
                <h2 style={{fontSize: '28px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px'}}>
                    <i className="bi bi-gear me-2" style={{color: '#2563eb'}}></i>
                    Settings & Profile
                </h2>
                <p style={{color: '#6b7280', fontSize: '14px', marginBottom: 0}}>
                    Manage your profile information and system preferences.
                </p>
            </div>

            {successMsg && (
                <div className="alert alert-dismissible fade show mb-4" style={{backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '6px'}} role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {successMsg}
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
                </div>
            )}

            {errorMsg && (
                <div className="alert alert-dismissible fade show mb-4" style={{backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px'}}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {errorMsg}
                    <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
                </div>
            )}

            {/* Profile Section */}
            <div className="row g-4 mb-4">
                <div className="col-md-8">
                    <div className="card" style={{border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
                        <div className="card-header" style={{backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
                            <h5 className="mb-0" style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a'}}>
                                <i className="bi bi-person-badge me-2"></i>
                                My Profile
                            </h5>
                        </div>
                        <div className="card-body" style={{padding: '24px'}}>
                            <form onSubmit={handleProfileSubmit}>
                                <div className="mb-3">
                                    <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="full_name"
                                        value={admin.full_name}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={admin.email}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Phone</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="phone"
                                        value={admin.phone || ''}
                                        onChange={handleProfileChange}
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Role</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={admin.role?.replace('_', ' ').toUpperCase()}
                                        disabled
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            backgroundColor: '#f9fafb',
                                            color: '#6b7280'
                                        }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Profile Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        name="profile_img"
                                        accept="image/*"
                                        onChange={handleProfileChange}
                                        style={{
                                            padding: '10px 14px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn"
                                    disabled={saving}
                                    style={{backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '14px', padding: '10px 20px'}}
                                >
                                    {saving ? 'Saving...' : 'Update Profile'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Profile Picture */}
                <div className="col-md-4">
                    <div className="card" style={{border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', textAlign: 'center'}}>
                        <div className="card-body" style={{padding: '24px'}}>
                            {admin.profile_img && typeof admin.profile_img === 'string' && admin.profile_img.length > 0 ? (
                                <img
                                    src={admin.profile_img}
                                    alt={admin.full_name}
                                    className="rounded-circle mb-3"
                                    style={{width: '150px', height: '150px', objectFit: 'cover', border: '3px solid #dbeafe'}}
                                />
                            ) : (
                                <div style={{
                                    width: '150px',
                                    height: '150px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '50%',
                                    margin: '0 auto 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '48px'
                                }}>
                                    <i className="bi bi-person-fill" style={{color: '#9ca3af'}}></i>
                                </div>
                            )}
                            <h5 style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px'}}>{admin.full_name}</h5>
                            <p style={{color: '#6b7280', fontSize: '13px', marginBottom: '12px'}}>{admin.email}</p>
                            <span className="badge" style={{backgroundColor: '#2563eb', color: 'white', padding: '6px 12px', fontSize: '12px', fontWeight: '500'}}>
                                {admin.role?.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Section */}
            <div className="card mb-4" style={{border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
                <div className="card-header" style={{backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
                    <h5 className="mb-0" style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a'}}>
                        <i className="bi bi-lock me-2"></i>
                        Change Password
                    </h5>
                </div>
                <div className="card-body" style={{padding: '24px'}}>
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    style={{
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    style={{
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    style={{
                                        padding: '10px 14px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn mt-3"
                            disabled={saving}
                            style={{backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '14px', padding: '10px 20px'}}
                        >
                            {saving ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>

            {/* System Settings Section */}
            <div className="mb-4 mt-5">
                <h3 style={{fontSize: '20px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px'}}>
                    <i className="bi bi-toggles me-2"></i>
                    System Settings
                </h3>
            </div>

                    <form onSubmit={handleSubmit}>
                        {/* General Settings */}
                        <div className="card mb-4" style={{border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px'}}>
                            <div className="card-header" style={{backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
                                <h5 className="mb-0" style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a'}}>
                                    <i className="bi bi-info-circle me-2"></i>
                                    General Settings
                                </h5>
                            </div>
                            <div className="card-body" style={{padding: '24px'}}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Site Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="site_name"
                                            value={settings.site_name}
                                            onChange={handleChange}
                                            style={{
                                                padding: '10px 14px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Contact Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="contact_email"
                                            value={settings.contact_email}
                                            onChange={handleChange}
                                            style={{
                                                padding: '10px 14px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Contact Phone</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="contact_phone"
                                            value={settings.contact_phone || ''}
                                            onChange={handleChange}
                                            style={{
                                                padding: '10px 14px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Address</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="address"
                                            value={settings.address || ''}
                                            onChange={handleChange}
                                            style={{
                                                padding: '10px 14px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Localization */}
                        <div className="card mb-4" style={{border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px'}}>
                            <div className="card-header" style={{backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
                                <h5 className="mb-0" style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a'}}>
                                    <i className="bi bi-globe me-2"></i>
                                    Localization
                                </h5>
                            </div>
                            <div className="card-body" style={{padding: '24px'}}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Default Language</label>
                                        <select
                                            className="form-select"
                                            name="default_language"
                                            value={settings.default_language}
                                            onChange={handleChange}
                                            style={{
                                                padding: '10px 14px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                backgroundColor: '#f9fafb'
                                            }}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">Hindi</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label" style={{fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px'}}>Timezone</label>
                                        <select
                                            className="form-select"
                                            name="timezone"
                                            value={settings.timezone}
                                            onChange={handleChange}
                                            style={{
                                                padding: '10px 14px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                backgroundColor: '#f9fafb'
                                            }}
                                        >
                                            <option value="UTC">UTC</option>
                                            <option value="Asia/Kolkata">India (IST)</option>
                                            <option value="America/New_York">US Eastern</option>
                                            <option value="America/Los_Angeles">US Pacific</option>
                                            <option value="Europe/London">UK</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Options */}
                        <div className="card mb-4" style={{border: 'none', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px'}}>
                            <div className="card-header" style={{backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px'}}>
                                <h5 className="mb-0" style={{fontSize: '16px', fontWeight: '600', color: '#1a1a1a'}}>
                                    <i className="bi bi-toggles me-2"></i>
                                    System Options
                                </h5>
                            </div>
                            <div className="card-body" style={{padding: '24px'}}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="maintenanceMode"
                                                name="maintenance_mode"
                                                checked={settings.maintenance_mode}
                                                onChange={handleChange}
                                                style={{cursor: 'pointer'}}
                                            />
                                            <label className="form-check-label" htmlFor="maintenanceMode" style={{cursor: 'pointer'}}>
                                                <strong style={{color: '#1a1a1a'}}>Maintenance Mode</strong>
                                                <br />
                                                <small style={{color: '#6b7280', fontSize: '13px'}}>
                                                    When enabled, only admins can access the site
                                                </small>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="allowRegistration"
                                                name="allow_registration"
                                                checked={settings.allow_registration}
                                                onChange={handleChange}
                                                style={{cursor: 'pointer'}}
                                            />
                                            <label className="form-check-label" htmlFor="allowRegistration" style={{cursor: 'pointer'}}>
                                                <strong style={{color: '#1a1a1a'}}>Allow Registration</strong>
                                                <br />
                                                <small style={{color: '#6b7280', fontSize: '13px'}}>
                                                    Allow new users to register
                                                </small>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="d-flex justify-content-end" style={{marginTop: '32px'}}>
                            <button
                                type="submit"
                                className="btn btn-lg"
                                disabled={saving}
                                style={{backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '14px', padding: '12px 28px'}}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-2"></i>
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
        </>
    );
};

export default AdminSettings;
