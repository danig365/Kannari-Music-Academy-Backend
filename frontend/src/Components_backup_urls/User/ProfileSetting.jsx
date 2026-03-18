import Sidebar from './Sidebar'
import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import ChangePassword from './ChangePassword'
import LoadingSpinner from '../LoadingSpinner'
import './ProfileSetting.css'

import { API_BASE_URL } from '../../config';
import { validateStudentProfileForm, FieldError } from '../../utils/formValidation';

const baseUrl = API_BASE_URL;

const ProfileSetting = () => {
    const studentId = localStorage.getItem('studentId')
    const studentLoginStatus = localStorage.getItem('studentLoginStatus')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [loading, setLoading] = useState(true)
    const [fieldErrors, setFieldErrors] = useState({})

    const [studentData, setStudentData] = useState({
        'fullname': '',
        'email': '',
        'username': '',
        'interseted_categories': '',
        'date_of_birth': '',
        'profile_img': '',
        'p_img': ''
    });

    const [parentLinkForm, setParentLinkForm] = useState({
        parent_fullname: '',
        parent_email: '',
        parent_mobile_no: '',
        relationship: 'guardian',
        authorization_mode: 'pre_authorized'
    });

    const [consentStatus, setConsentStatus] = useState(null);
    const [consentLoading, setConsentLoading] = useState(false);
    const [resendingEmail, setResendingEmail] = useState(false);
    const [editingParent, setEditingParent] = useState(false);

    useEffect(() => {
        document.title = 'Kannari Music Academy | Settings'
    }, [])

    // Responsive detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
            if (window.innerWidth >= 768) {
                setSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Authentication check
    useEffect(() => {
        if (studentLoginStatus !== 'true') {
            window.location.href = '/user-login'
        }
    }, [studentLoginStatus])

    useEffect(() => {
        try {
            axios.get(baseUrl + '/student/' + studentId)
                .then((res) => {
                    setStudentData({
                        fullname: res.data.fullname,
                        email: res.data.email,
                        username: res.data.username,
                        interseted_categories: res.data.interseted_categories,
                        date_of_birth: res.data.date_of_birth || '',
                        profile_img: res.data.profile_img,
                        p_img: ''
                    })
                    setLoading(false)
                })
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }, [studentId])

    const handleChange = (event) => {
        setStudentData({
            ...studentData,
            [event.target.name]: event.target.value
        })
    }

    const handleFileChange = (event) => {
        setStudentData({
            ...studentData,
            [event.target.name]: event.target.files[0]
        })
    }

    const submitForm = () => {
        const errors = validateStudentProfileForm({
            fullname: studentData.fullname,
            email: studentData.email
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            Swal.fire({
                title: 'Please fix the errors below',
                icon: 'warning',
                toast: true,
                timer: 2500,
                position: 'top-right',
                timerProgressBar: true,
                showConfirmButton: false
            });
            return;
        }

        const studentFormData = new FormData()
        studentFormData.append("fullname", studentData.fullname || '')
        studentFormData.append("email", studentData.email || '')
        studentFormData.append("username", studentData.username || '')
        studentFormData.append("interseted_categories", studentData.interseted_categories || '')
        studentFormData.append("date_of_birth", studentData.date_of_birth || '')
        if (studentData.p_img && studentData.p_img !== '') {
            studentFormData.append('profile_img', studentData.p_img, studentData.p_img.name)
        }

        try {
            axios.put(baseUrl + '/student/' + studentId + '/', studentFormData, {
                headers: {
                    'content-type': 'multipart/form-data'
                }
            }).then((response) => {
                if (response.status === 200) {
                    Swal.fire({
                        title: 'Profile Updated Successfully',
                        icon: 'success',
                        toast: true,
                        timer: 3000,
                        position: 'top-right',
                        timerProgressBar: true,
                        showConfirmButton: false
                    })
                    // Dispatch storage event to notify sidebar of changes
                    window.dispatchEvent(new Event('storage'))
                }
            })
        } catch (error) {
            console.log(error)
            setStudentData({ 'status': 'error' })
        }
    }

    const submitParentLinkRequest = async () => {
        try {
            const payload = new FormData();
            payload.append('parent_fullname', parentLinkForm.parent_fullname || '');
            payload.append('parent_email', parentLinkForm.parent_email || '');
            payload.append('parent_mobile_no', parentLinkForm.parent_mobile_no || '');
            payload.append('relationship', parentLinkForm.relationship || 'guardian');
            payload.append('authorization_mode', parentLinkForm.authorization_mode || 'pre_authorized');

            const response = await axios.post(`${baseUrl}/student/${studentId}/parent/request-link/`, payload);
            if (response.data?.bool) {
                Swal.fire({
                    title: 'Consent Email Sent!',
                    html: response.data?.email_sent
                        ? 'A consent request email has been sent to your parent/guardian. They must approve before you can join live sessions.'
                        : (response.data?.message || 'Parent link requested. Ask your parent to check their email.'),
                    icon: 'success',
                    toast: true,
                    timer: 5000,
                    position: 'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                fetchConsentStatus();
            }
        } catch (error) {
            Swal.fire({
                title: 'Request Failed',
                text: error.response?.data?.message || 'Could not submit parent link request.',
                icon: 'error'
            });
        }
    }

    const fetchConsentStatus = async () => {
        setConsentLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/student/${studentId}/parent/status/`);
            if (res.data?.bool) {
                setConsentStatus(res.data);
                // Pre-fill parent form with existing data for editing
                if (res.data.has_link) {
                    setParentLinkForm(prev => ({
                        ...prev,
                        parent_fullname: res.data.parent_name || '',
                        parent_email: res.data.parent_email || '',
                        relationship: res.data.relationship || 'guardian',
                    }));
                }
            } else {
                setConsentStatus(null);
            }
        } catch {
            setConsentStatus(null);
        } finally {
            setConsentLoading(false);
        }
    };

    const resendConsentEmail = async () => {
        setResendingEmail(true);
        try {
            const res = await axios.post(`${baseUrl}/student/${studentId}/parent/resend-email/`);
            Swal.fire({
                title: res.data?.bool ? 'Email Resent!' : 'Could not resend',
                text: res.data?.message || '',
                icon: res.data?.bool ? 'success' : 'warning',
                toast: true,
                timer: 3500,
                position: 'top-right',
                timerProgressBar: true,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                title: 'Failed',
                text: error.response?.data?.message || 'Could not resend consent email.',
                icon: 'error'
            });
        } finally {
            setResendingEmail(false);
        }
    };

    // Fetch consent status on load
    useEffect(() => {
        if (studentId) {
            fetchConsentStatus();
        }
    }, [studentId]);

    return (
        <div className="profile-setting-container">
            {/* Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                setIsOpen={setSidebarOpen} 
                isMobile={isMobile}
            />

            {/* Sidebar Overlay */}
            {isMobile && sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="profile-setting-content">
                {/* Mobile Header */}
                <div className="mobile-header">
                    <button 
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <i className="bi bi-list" aria-hidden="true"></i>
                    </button>
                    <div className="logo-mini">Kannari Music Academy</div>
                </div>

                <div className="profile-setting-main">
                    {loading ? (
                        <LoadingSpinner size="lg" text="Loading your profile..." />
                    ) : (
                    <>
                    {/* Header */}
                    <div className="profile-header">
                        <h2>
                            <i className="bi bi-person-music" aria-hidden="true"></i>
                            Profile Settings
                        </h2>
                        <p>Manage your personal information and preferences</p>
                    </div>

                    <div className="profile-form-grid">
                        {/* Profile Form */}
                        <div className="profile-card">
                            <h3>
                                <i className="bi bi-person-circle" aria-hidden="true"></i>
                                Personal Information
                            </h3>

                            {/* Profile Image Preview */}
                            <div className="profile-image-section">
                                {studentData.profile_img ? (
                                    <div className="profile-image-wrapper">
                                        <img 
                                            src={studentData.profile_img} 
                                            alt={studentData.fullname}
                                            className="profile-image"
                                        />
                                    </div>
                                ) : (
                                    <div className="profile-image-wrapper">
                                        <div className="profile-image-placeholder">
                                            <i className="bi bi-person"></i>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="form-group">
                                <label>
                                    <i className='bi bi-person' aria-hidden="true"></i>Full Name
                                </label>
                                <input  
                                    name='fullname' 
                                    type="text"  
                                    value={studentData.fullname} 
                                    onChange={handleChange} 
                                    className="form-control"
                                    style={fieldErrors.fullname ? { border: '1px solid #ef4444' } : {}}
                                />
                                <FieldError error={fieldErrors.fullname} />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className='bi bi-envelope' aria-hidden="true"></i>Email
                                </label>
                                <input 
                                    name='email' 
                                    type="email" 
                                    value={studentData.email} 
                                    onChange={handleChange} 
                                    className="form-control"
                                    style={fieldErrors.email ? { border: '1px solid #ef4444' } : {}}
                                />
                                <FieldError error={fieldErrors.email} />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className='bi bi-at' aria-hidden="true"></i>Username
                                </label>
                                <input 
                                    name='username' 
                                    type="text" 
                                    value={studentData.username} 
                                    onChange={handleChange} 
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className='bi bi-image' aria-hidden="true"></i>Profile Image
                                </label>
                                <input 
                                    type="file" 
                                    onChange={handleFileChange} 
                                    name='p_img'
                                    className="form-control"
                                    accept="image/*"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className='bi bi-music-note' aria-hidden="true"></i>Interested Genres
                                </label>
                                <textarea 
                                    name='interseted_categories' 
                                    value={studentData.interseted_categories} 
                                    onChange={handleChange} 
                                    className="form-control"
                                    placeholder="Enter your favorite genres (comma separated)"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <i className='bi bi-calendar-date' aria-hidden="true"></i>Date of Birth
                                </label>
                                <input
                                    name='date_of_birth'
                                    type="date"
                                    value={studentData.date_of_birth || ''}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>

                            <button 
                                onClick={submitForm} 
                                className="submit-btn"
                            >
                                <i className='bi bi-check-lg' aria-hidden="true"></i>Update Profile
                            </button>
                        </div>

                        <div className="profile-card">
                            <h3>
                                <i className="bi bi-shield-lock" aria-hidden="true"></i>
                                Parent Consent Setup (for minors)
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '14px' }}>
                                If you are under 18, submit your parent/guardian details. They will receive an email to approve your live sessions.
                            </p>

                            {/* Consent Status Display */}
                            {consentLoading && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                                    <span className="spinner-border spinner-border-sm me-2"></span>Loading consent status...
                                </div>
                            )}

                            {consentStatus && consentStatus.has_link && !consentLoading && (
                                <div style={{
                                    background: consentStatus.link_status === 'approved' ? '#e8f5e9' : (consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked') ? '#ffebee' : '#fff8e1',
                                    border: `1px solid ${consentStatus.link_status === 'approved' ? '#a5d6a7' : (consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked') ? '#ef9a9a' : '#ffe082'}`,
                                    borderRadius: '10px',
                                    padding: '1rem 1.25rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <i className={`bi ${consentStatus.link_status === 'approved' ? 'bi-check-circle-fill text-success' : (consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked') ? 'bi-x-circle-fill text-danger' : 'bi-clock-fill text-warning'}`} style={{ fontSize: '1.2rem' }}></i>
                                        <strong>
                                            {consentStatus.link_status === 'approved' ? 'Parent Consent Approved' :
                                             (consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked') ? 'Parent Consent Denied' :
                                             'Awaiting Parent Approval'}
                                        </strong>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                        <div><strong>Parent:</strong> {consentStatus.parent_name}</div>
                                        <div><strong>Email:</strong> {consentStatus.parent_email}</div>
                                        <div><strong>Relationship:</strong> <span style={{textTransform:'capitalize'}}>{consentStatus.relationship}</span></div>
                                        {consentStatus.live_sessions_status && (
                                            <div><strong>Live Sessions:</strong> <span style={{textTransform:'capitalize'}}>{consentStatus.live_sessions_status}</span></div>
                                        )}
                                        {consentStatus.authorization_mode && (
                                            <div><strong>Mode:</strong> {consentStatus.authorization_mode === 'pre_authorized' ? 'Pre-authorized' : 'Per-session approval'}</div>
                                        )}
                                    </div>

                                    {consentStatus.link_status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={resendConsentEmail}
                                                disabled={resendingEmail}
                                                className="submit-btn"
                                                style={{ background: '#5c6bc0', flex: '1', minWidth: '180px' }}
                                            >
                                                {resendingEmail ? (
                                                    <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                                                ) : (
                                                    <><i className="bi bi-envelope-arrow-up me-1" aria-hidden="true"></i>Resend Consent Email</>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setEditingParent(!editingParent)}
                                                className="submit-btn"
                                                style={{ background: editingParent ? '#78909c' : '#ff8f00', flex: '1', minWidth: '180px' }}
                                            >
                                                <i className={`bi ${editingParent ? 'bi-x-lg' : 'bi-pencil-square'} me-1`} aria-hidden="true"></i>
                                                {editingParent ? 'Cancel Editing' : 'Edit Parent Details'}
                                            </button>
                                        </div>
                                    )}

                                    {(consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked') && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#c62828', marginBottom: '0.75rem' }}>
                                                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                Your parent/guardian declined consent. You can update parent details and send a new consent request below.
                                            </p>
                                            <button
                                                onClick={() => setEditingParent(true)}
                                                className="submit-btn"
                                                style={{ background: '#e65100', width: '100%' }}
                                            >
                                                <i className="bi bi-arrow-repeat me-1" aria-hidden="true"></i>
                                                Request Consent Again
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Request Form - show if no active consent, denied/revoked, or editing pending */}
                            {((!consentStatus || !consentStatus.has_link || consentStatus.link_status === 'denied' || consentStatus.link_status === 'revoked' || (consentStatus.link_status === 'pending' && editingParent)) && !consentLoading && (consentStatus?.link_status !== 'revoked' || editingParent) && (consentStatus?.link_status !== 'denied' || editingParent)) && (
                                <>
                                    {editingParent && (consentStatus?.link_status === 'pending' || consentStatus?.link_status === 'revoked') && (
                                        <div style={{
                                            background: consentStatus?.link_status === 'revoked' ? '#fce4ec' : '#fff3e0',
                                            border: `1px solid ${consentStatus?.link_status === 'revoked' ? '#ef9a9a' : '#ffe0b2'}`,
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
                                            color: consentStatus?.link_status === 'revoked' ? '#c62828' : '#e65100'
                                        }}>
                                            <i className="bi bi-info-circle me-1"></i>
                                            {consentStatus?.link_status === 'revoked'
                                                ? 'Your previous consent request was denied. Update parent details if needed and submit to send a new consent email.'
                                                : 'Update your parent/guardian details below. A new consent email will be sent to the updated email address.'}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label><i className='bi bi-person' aria-hidden="true"></i>Parent/Guardian Name</label>
                                        <input
                                            className="form-control"
                                            value={parentLinkForm.parent_fullname}
                                            onChange={(e) => setParentLinkForm({ ...parentLinkForm, parent_fullname: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><i className='bi bi-envelope' aria-hidden="true"></i>Parent Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={parentLinkForm.parent_email}
                                            onChange={(e) => setParentLinkForm({ ...parentLinkForm, parent_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><i className='bi bi-telephone' aria-hidden="true"></i>Parent Mobile</label>
                                        <input
                                            className="form-control"
                                            value={parentLinkForm.parent_mobile_no}
                                            onChange={(e) => setParentLinkForm({ ...parentLinkForm, parent_mobile_no: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><i className='bi bi-people' aria-hidden="true"></i>Relationship</label>
                                        <select
                                            className="form-control"
                                            value={parentLinkForm.relationship}
                                            onChange={(e) => setParentLinkForm({ ...parentLinkForm, relationship: e.target.value })}
                                        >
                                            <option value="mother">Mother</option>
                                            <option value="father">Father</option>
                                            <option value="guardian">Guardian</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <button onClick={() => {
                                        submitParentLinkRequest();
                                        setEditingParent(false);
                                    }} className="submit-btn">
                                        <i className={`bi ${editingParent ? 'bi-arrow-repeat' : 'bi-send-check'}`} aria-hidden="true"></i>
                                        {editingParent ? 'Update & Resend Consent Email' : 'Send Consent Request to Parent'}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Change Password Section */}
                        <div className="profile-card">
                            <ChangePassword />
                        </div>
                    </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProfileSetting
