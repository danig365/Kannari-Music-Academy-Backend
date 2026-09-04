import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Payments are handled entirely on an external payment page — no card details are
// collected in the app. This route is kept so any old links land on a clear message.
const UpdatePaymentMethod = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Payments | Kannari Music Academy';
        if (localStorage.getItem('studentLoginStatus') !== 'true') {
            navigate('/student/login');
        }
    }, [navigate]);

    return (
        <div style={{ minHeight: '100vh', background: '#F7F3EA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: 460, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 46, color: '#101C2C', marginBottom: 10 }}>
                    <i className="bi bi-shield-check"></i>
                </div>
                <h4 style={{ fontWeight: 800, marginBottom: 8, color: '#101C2C' }}>Payments are handled securely off-app</h4>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                    We don't collect or store card details inside the app. To start or manage a
                    subscription, open the plan and use its payment link, or contact us and we'll
                    activate your access.
                </p>
                <Link
                    to="/student/subscriptions"
                    style={{ display: 'inline-block', background: '#101C2C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                    View Subscription Plans
                </Link>
            </div>
        </div>
    );
};

export default UpdatePaymentMethod;
