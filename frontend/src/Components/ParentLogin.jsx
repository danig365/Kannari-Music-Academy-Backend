import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { isValidEmail, FieldError } from '../utils/formValidation';

const ParentLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'verify'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    document.title = 'Parent Login — Kannari Music Academy';
    // If already logged in, redirect
    const pid = localStorage.getItem('parentId');
    if (pid && localStorage.getItem('parentLoginStatus') === 'true') {
      navigate('/parent/dashboard');
    }
  }, []);

  const requestCode = async () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Please enter your email';
    else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) { setError(errors.email); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/parent/login/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (res.ok && data.bool !== false) {
        setStep('verify');
        setMessage(data.message || 'Verification code sent to your email');
      } else {
        setError(data.error || data.message || 'No parent account found with this email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    const errors = {};
    if (!verificationCode.trim()) errors.code = 'Please enter the code';
    else if (verificationCode.trim().length < 6) errors.code = 'Code must be 6 digits';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) { setError(errors.code); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/parent/login/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() })
      });
      const data = await res.json();
      if (res.ok && data.bool !== false) {
        localStorage.setItem('parentId', data.parent_id);
        localStorage.setItem('parentName', data.parent_name || data.name || 'Parent');
        localStorage.setItem('parentLoginStatus', 'true');
        navigate('/parent/dashboard');
      } else {
        setError(data.error || data.message || 'Invalid or expired code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'email') requestCode();
    else verifyCode();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-people-fill" style={{ fontSize: '28px', color: '#fff' }}></i>
          </div>
          <h2 style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '24px' }}>Parent Portal</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Kannari Music Academy</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '18px', color: '#1e293b' }}>
            {step === 'email' ? 'Sign In' : 'Enter Verification Code'}
          </h3>
          <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '13px' }}>
            {step === 'email'
              ? 'Enter the email associated with your parent account'
              : `We sent a code to ${email}`}
          </p>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <i className="bi bi-exclamation-circle me-1"></i>{error}
            </div>
          )}
          {message && !error && (
            <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <i className="bi bi-check-circle me-1"></i>{message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 'email' ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email Address</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setFieldErrors({}); }}
                  placeholder="parent@example.com" required autoFocus
                  style={{ width: '100%', padding: '12px 14px', border: fieldErrors.email ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <FieldError error={fieldErrors.email} />
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Verification Code</label>
                <input type="text" value={verificationCode} onChange={e => { setVerificationCode(e.target.value); setFieldErrors({}); }}
                  placeholder="Enter 6-digit code" required autoFocus maxLength="6"
                  style={{ width: '100%', padding: '12px 14px', border: fieldErrors.code ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '18px', textAlign: 'center', letterSpacing: '4px', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }} />
                <FieldError error={fieldErrors.code} />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                  Didn't receive it?{' '}
                  <button type="button" onClick={() => { setStep('email'); setError(''); setMessage(''); setVerificationCode(''); }}
                    style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: '600', padding: 0 }}>
                    Try again
                  </button>
                </p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', opacity: loading ? 0.6 : 1 }}>
              {loading ? (
                <><div className="spinner-border spinner-border-sm me-2" role="status"></div>Please wait...</>
              ) : step === 'email' ? 'Send Verification Code' : 'Verify & Sign In'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            <i className="bi bi-shield-check me-1"></i>
            All messages are monitored for child safety
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;
