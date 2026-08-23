import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SUGuu5660mVKr4oXfErDtBTL6gARjogpSlaC7hPrDdXlKTu7oFU9NYhVFjAynfAScVH6LzHwlgxVGjeFE4v9iXi00VVc57kSv';
const stripePromise = loadStripe(stripePublicKey);

const CardForm = ({ studentId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Ask the backend for a SetupIntent (no charge).
            const siRes = await axios.post(`${baseUrl}/student/setup-intent/`, {
                student_id: parseInt(studentId),
            });
            const clientSecret = siRes.data.clientSecret;
            if (!clientSecret) {
                setError('Could not start card setup. Please try again or contact support.');
                setLoading(false);
                return;
            }

            // 2. Confirm the card against the SetupIntent (tokenise + save).
            const cardElement = elements.getElement(CardElement);
            const { error: setupErr, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: { card: cardElement },
            });
            if (setupErr) {
                setError(setupErr.message || 'Could not save your card.');
                setLoading(false);
                return;
            }

            // 3. Attach the saved card as the default for billing.
            await axios.post(`${baseUrl}/student/save-payment-method/`, {
                student_id: parseInt(studentId),
                payment_method_id: setupIntent.payment_method,
            });

            setDone(true);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 46, color: '#16a34a', marginBottom: 8 }}>
                    <i className="bi bi-check-circle-fill"></i>
                </div>
                <h5 style={{ fontWeight: 700, marginBottom: 6 }}>Card saved</h5>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                    Your card is on file. Your subscription will be billed automatically on your billing date.
                </p>
                <Link to="/student/subscriptions" style={btnPrimary}>Back to Subscription</Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 }}>
                    <i className="bi bi-exclamation-circle me-2"></i>{error}
                </div>
            )}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#101C2C', marginBottom: 16 }}>
                <i className="bi bi-shield-check me-2"></i>
                No charge today. We're just saving your card so your subscription can renew automatically.
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                <i className="bi bi-credit-card me-2"></i>Card Information
            </label>
            <div style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '12px' }}>
                <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '16px', color: '#101C2C' } } }} />
            </div>

            <button type="submit" disabled={!stripe || loading} style={{ ...btnPrimary, width: '100%', marginTop: 18, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving…' : 'Save Card'}
            </button>
        </form>
    );
};

const UpdatePaymentMethod = () => {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState(null);

    useEffect(() => {
        document.title = 'Update Payment Method | Kannari Music Academy';
        if (localStorage.getItem('studentLoginStatus') !== 'true') {
            navigate('/student/login');
            return;
        }
        setStudentId(localStorage.getItem('studentId'));
    }, [navigate]);

    if (!studentId) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%', maxWidth: 460, padding: 28 }}>
                <h4 style={{ fontWeight: 800, marginBottom: 4 }}>Update Payment Method</h4>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                    Add the card you'd like us to use for your monthly subscription.
                </p>
                <Elements stripe={stripePromise}>
                    <CardForm studentId={studentId} />
                </Elements>
            </div>
        </div>
    );
};

const btnPrimary = { display: 'inline-block', background: '#101C2C', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', marginTop: 16 };

export default UpdatePaymentMethod;
