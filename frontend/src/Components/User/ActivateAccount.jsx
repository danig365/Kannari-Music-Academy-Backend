import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import kannariLogo from '../../assets/brand/kannari-logo-gold.png';

const baseUrl = API_BASE_URL;

const ActivateAccount = () => {
    const navigate = useNavigate();
    const studentId = localStorage.getItem('studentId');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = 'Activate Account | Kannari Music Academy';
        if (localStorage.getItem('studentLoginStatus') !== 'true') {
            navigate('/student/login');
            return;
        }
        if (localStorage.getItem('studentActivated') === 'true') {
            navigate('/student/dashboard');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) { setError('Please enter your activation code.'); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${baseUrl}/student/${studentId}/redeem-code/`, { code: code.trim() });
            if (res.data.bool) {
                localStorage.setItem('studentActivated', 'true');
                window.location.href = '/student/dashboard';
            } else {
                setError(res.data.message || 'Could not activate. Please check your code.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not activate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('studentLoginStatus');
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentActivated');
        navigate('/student/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F7F3EA 0%, #e8ecf1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: 440, padding: 36, textAlign: 'center' }}>
                <img src={kannariLogo} alt="Kannari Music Academy" style={{ height: 56, width: 'auto', margin: '0 auto 20px', display: 'block' }} />
                <div style={{ fontSize: 42, color: '#C9A66B', marginBottom: 8 }}>
                    <i className="bi bi-key-fill"></i>
                </div>
                <h3 style={{ fontWeight: 800, color: '#101C2C', marginBottom: 6 }}>Activate your account</h3>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                    Your account is pending. Enter the activation code you received to unlock your access.
                </p>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>
                        <i className="bi bi-exclamation-circle me-2"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX"
                        autoFocus
                        style={{
                            width: '100%', textAlign: 'center', letterSpacing: '3px', fontWeight: 700,
                            fontSize: 20, fontFamily: 'monospace', color: '#101C2C',
                            border: '1px solid #d1d5db', borderRadius: 10, padding: '14px', marginBottom: 16, textTransform: 'uppercase',
                        }}
                    />
                    <button type="submit" disabled={loading}
                        style={{ width: '100%', background: '#101C2C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Activating…' : 'Activate Account'}
                    </button>
                </form>

                <p style={{ color: '#6b7280', fontSize: 13, marginTop: 20 }}>
                    Don't have a code? Contact us to get one.
                </p>
                <button onClick={logout} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
                    <i className="bi bi-box-arrow-left me-1"></i> Log out
                </button>
            </div>
        </div>
    );
};

export default ActivateAccount;
