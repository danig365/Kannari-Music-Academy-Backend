import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './ParentalConsent.css';

const baseUrl = API_BASE_URL;

const ParentalConsent = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [consentData, setConsentData] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    // Form state
    const [authorizationMode, setAuthorizationMode] = useState('pre_authorized');
    const [parentSignature, setParentSignature] = useState('');
    const [denyReason, setDenyReason] = useState('');
    const [showDenyForm, setShowDenyForm] = useState(false);

    useEffect(() => {
        document.title = 'Parental Consent — Kannari Music Academy';
    }, []);

    useEffect(() => {
        if (!token) {
            setError('No consent token provided. Please use the link from your email.');
            setLoading(false);
            return;
        }

        axios.get(`${baseUrl}/parent/consent/verify/?token=${encodeURIComponent(token)}`)
            .then((res) => {
                if (res.data?.bool) {
                    setConsentData(res.data);
                } else {
                    setError(res.data?.message || 'Invalid consent link.');
                }
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Could not verify consent link. It may have expired.');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleApprove = async () => {
        if (!parentSignature.trim()) {
            alert('Please type your full name as a digital signature to approve.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post(`${baseUrl}/parent/consent/respond/`, {
                token,
                decision: 'approve',
                authorization_mode: authorizationMode,
                parent_signature: parentSignature.trim(),
            });
            setSubmitted(true);
            setSubmitResult({ success: true, message: res.data?.message || 'Consent approved successfully!' });
        } catch (err) {
            setSubmitResult({ success: false, message: err.response?.data?.message || 'Failed to submit. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeny = async () => {
        setSubmitting(true);
        try {
            const res = await axios.post(`${baseUrl}/parent/consent/respond/`, {
                token,
                decision: 'deny',
                deny_reason: denyReason.trim(),
            });
            setSubmitted(true);
            setSubmitResult({ success: true, message: res.data?.message || 'Your response has been recorded.' });
        } catch (err) {
            setSubmitResult({ success: false, message: err.response?.data?.message || 'Failed to submit. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    // ======== RENDER ========

    if (loading) {
        return (
            <div className="pc-page">
                <div className="pc-container">
                    <div className="pc-loading">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p>Verifying your consent link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pc-page">
                <div className="pc-container">
                    <div className="pc-card">
                        <div className="pc-error">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <h2>Link Invalid or Expired</h2>
                            <p>{error}</p>
                            <small className="text-muted">
                                If you need a new consent link, please ask your child to resend the request from their profile.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="pc-page">
                <div className="pc-container">
                    <div className="pc-card">
                        <div className={`pc-result ${submitResult?.success ? 'pc-result-success' : 'pc-result-error'}`}>
                            <i className={`bi ${submitResult?.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                            <h2>{submitResult?.success ? 'Response Recorded' : 'Something Went Wrong'}</h2>
                            <p>{submitResult?.message}</p>
                            {submitResult?.success && (
                                <small className="text-muted">You may close this page.</small>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const alreadyApproved = consentData?.link_status === 'approved' && consentData?.live_sessions_status === 'approved';

    return (
        <div className="pc-page">
            <div className="pc-container">
                {/* Header / Branding */}
                <div className="pc-brand">
                    <h1 className="pc-brand-title">Kannari Music Academy</h1>
                    <p className="pc-brand-sub">Child Safety & Parental Consent</p>
                </div>

                <div className="pc-card">
                    {/* Title */}
                    <div className="pc-card-header">
                        <i className="bi bi-shield-lock-fill"></i>
                        <h2>Parental Consent Request</h2>
                    </div>

                    {/* Already approved message */}
                    {alreadyApproved && (
                        <div className="pc-already-approved">
                            <i className="bi bi-check-circle-fill"></i>
                            <div>
                                <strong>Already Approved</strong>
                                <p className="mb-0">You have already given consent for this child.
                                   {consentData.approved_at && ` (Approved: ${new Date(consentData.approved_at).toLocaleDateString()})`}
                                </p>
                                <small className="text-muted">You can update your preferences below if needed.</small>
                            </div>
                        </div>
                    )}

                    {/* Student Information */}
                    <div className="pc-section">
                        <h3 className="pc-section-title">
                            <i className="bi bi-person-fill"></i>
                            Your Child's Information
                        </h3>
                        <div className="pc-info-grid">
                            <div className="pc-info-item">
                                <span className="pc-info-label">Name</span>
                                <span className="pc-info-value">{consentData?.student_name}</span>
                            </div>
                            <div className="pc-info-item">
                                <span className="pc-info-label">Email</span>
                                <span className="pc-info-value">{consentData?.student_email}</span>
                            </div>
                            {consentData?.student_dob && (
                                <div className="pc-info-item">
                                    <span className="pc-info-label">Date of Birth</span>
                                    <span className="pc-info-value">{new Date(consentData.student_dob).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="pc-info-item">
                                <span className="pc-info-label">Your Relationship</span>
                                <span className="pc-info-value" style={{textTransform: 'capitalize'}}>{consentData?.relationship}</span>
                            </div>
                        </div>
                    </div>

                    {/* What you're consenting to */}
                    <div className="pc-section">
                        <h3 className="pc-section-title">
                            <i className="bi bi-info-circle-fill"></i>
                            What You're Consenting To
                        </h3>
                        <div className="pc-consent-items">
                            <div className="pc-consent-item">
                                <i className="bi bi-camera-video-fill text-primary"></i>
                                <div>
                                    <strong>Live Video/Audio Sessions</strong>
                                    <p>Your child will be able to join live one-on-one music lessons with their verified teacher via secure video call.</p>
                                </div>
                            </div>
                            <div className="pc-consent-item">
                                <i className="bi bi-shield-check text-success"></i>
                                <div>
                                    <strong>Teacher Verification Required</strong>
                                    <p>All teachers must pass ID verification, background checks, and sign child safety agreements before they can teach minors.</p>
                                </div>
                            </div>
                            <div className="pc-consent-item">
                                <i className="bi bi-record-circle text-danger"></i>
                                <div>
                                    <strong>Session Safety Logging</strong>
                                    <p>All sessions with minor students are logged for safety purposes. Recording may be enabled for safeguarding.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authorization Mode Selection */}
                    <div className="pc-section">
                        <h3 className="pc-section-title">
                            <i className="bi bi-sliders"></i>
                            Authorization Mode
                        </h3>
                        <p className="pc-section-desc">Choose how sessions are authorized for your child:</p>
                        <div className="pc-auth-options">
                            <label className={`pc-auth-option ${authorizationMode === 'pre_authorized' ? 'pc-auth-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="auth_mode"
                                    value="pre_authorized"
                                    checked={authorizationMode === 'pre_authorized'}
                                    onChange={() => setAuthorizationMode('pre_authorized')}
                                />
                                <div className="pc-auth-content">
                                    <i className="bi bi-check2-all"></i>
                                    <div>
                                        <strong>Pre-Authorized</strong>
                                        <small>Your child can join all scheduled sessions without per-session approval. Recommended for regular lessons.</small>
                                    </div>
                                </div>
                            </label>
                            <label className={`pc-auth-option ${authorizationMode === 'per_session_login' ? 'pc-auth-selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="auth_mode"
                                    value="per_session_login"
                                    checked={authorizationMode === 'per_session_login'}
                                    onChange={() => setAuthorizationMode('per_session_login')}
                                />
                                <div className="pc-auth-content">
                                    <i className="bi bi-lock"></i>
                                    <div>
                                        <strong>Per-Session Approval</strong>
                                        <small>You must approve each session individually before your child can join. More restrictive.</small>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Approve */}
                    {!showDenyForm && (
                        <div className="pc-section pc-approve-section">
                            <h3 className="pc-section-title">
                                <i className="bi bi-pen-fill"></i>
                                Digital Signature
                            </h3>
                            <p className="pc-section-desc">
                                By typing your full name below and clicking "Approve", you confirm
                                that you are the parent/guardian of <strong>{consentData?.student_name}</strong> and
                                consent to the terms described above.
                            </p>
                            <div className="pc-signature-box">
                                <input
                                    type="text"
                                    className="pc-signature-input"
                                    placeholder="Type your full legal name here"
                                    value={parentSignature}
                                    onChange={(e) => setParentSignature(e.target.value)}
                                    autoComplete="name"
                                />
                                <small className="text-muted">This serves as your electronic signature.</small>
                            </div>

                            <div className="pc-actions">
                                <button
                                    className="pc-btn pc-btn-approve"
                                    onClick={handleApprove}
                                    disabled={submitting || !parentSignature.trim()}
                                >
                                    {submitting ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                                    ) : (
                                        <><i className="bi bi-check-circle me-2"></i>Approve Consent</>
                                    )}
                                </button>
                                <button
                                    className="pc-btn pc-btn-deny-toggle"
                                    onClick={() => setShowDenyForm(true)}
                                    disabled={submitting}
                                >
                                    I do not consent
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Deny Form */}
                    {showDenyForm && (
                        <div className="pc-section pc-deny-section">
                            <h3 className="pc-section-title">
                                <i className="bi bi-x-circle-fill"></i>
                                Decline Consent
                            </h3>
                            <p className="pc-section-desc">
                                You are choosing to decline consent. Your child will not be able to join live sessions.
                            </p>
                            <div className="pc-deny-box">
                                <label className="pc-deny-label">Reason (optional):</label>
                                <textarea
                                    className="pc-deny-textarea"
                                    placeholder="You may provide a reason..."
                                    value={denyReason}
                                    onChange={(e) => setDenyReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="pc-actions">
                                <button
                                    className="pc-btn pc-btn-deny"
                                    onClick={handleDeny}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                                    ) : (
                                        <><i className="bi bi-x-circle me-2"></i>Decline Consent</>
                                    )}
                                </button>
                                <button
                                    className="pc-btn pc-btn-back"
                                    onClick={() => setShowDenyForm(false)}
                                    disabled={submitting}
                                >
                                    <i className="bi bi-arrow-left me-1"></i> Go Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer info */}
                    <div className="pc-footer-info">
                        <i className="bi bi-lock-fill"></i>
                        <small>
                            This page is secured with a unique signed token. Your response is recorded
                            with a timestamp for legal compliance. If you have concerns, please contact us at
                            <a href="mailto:support@kannarimusicacademy.com"> support@kannarimusicacademy.com</a>.
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentalConsent;
