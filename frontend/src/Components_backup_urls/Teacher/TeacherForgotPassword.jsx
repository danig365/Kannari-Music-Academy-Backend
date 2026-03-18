import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../config';

const TeacherForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'LMS | Teacher Forgot Password';
    window.scrollTo(0, 0);
  }, []);

  const requestReset = async () => {
    if (!email) {
      Swal.fire({ icon: 'warning', title: 'Please enter your email', toast: true, timer: 2000, position: 'top', showConfirmButton: false });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);

    try {
      await axios.post(`${API_BASE_URL}/password-reset/request/teacher/`, formData);
      Swal.fire({ icon: 'success', title: 'If your email exists, reset link sent', toast: true, timer: 2500, position: 'top', showConfirmButton: false });
      setEmail('');
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Unable to send reset email', toast: true, timer: 2500, position: 'top', showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Please fill all fields', toast: true, timer: 2000, position: 'top', showConfirmButton: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Passwords do not match', toast: true, timer: 2000, position: 'top', showConfirmButton: false });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('token', token);
    formData.append('new_password', newPassword);

    try {
      const res = await axios.post(`${API_BASE_URL}/password-reset/confirm/teacher/`, formData);
      if (res.data.bool) {
        Swal.fire({ icon: 'success', title: 'Password reset successful', toast: true, timer: 2000, position: 'top', showConfirmButton: false });
        setTimeout(() => {
          window.location.href = '/teacher-login';
        }, 1800);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: error?.response?.data?.message || 'Invalid or expired reset link', toast: true, timer: 3000, position: 'top', showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
        <Link to="/teacher-login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Back to login</Link>
        <h2 style={{ marginTop: '16px', marginBottom: '8px', color: '#1a1a1a' }}>{token ? 'Set New Password' : 'Forgot Password'}</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          {token ? 'Enter your new password below.' : 'Enter your registered email to receive a password reset link.'}
        </p>

        {!token ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@kannari.com"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}
            />
            <button
              type="button"
              onClick={requestReset}
              disabled={loading}
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: '#667eea', color: 'white', fontWeight: '600', cursor: 'pointer' }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </>
        ) : (
          <>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}
            />
            <button
              type="button"
              onClick={submitNewPassword}
              disabled={loading}
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: '#667eea', color: 'white', fontWeight: '600', cursor: 'pointer' }}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherForgotPassword;
