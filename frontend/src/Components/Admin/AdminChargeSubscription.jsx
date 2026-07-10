import React, { useState } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SUGuu5660mVKr4oXfErDtBTL6gARjogpSlaC7hPrDdXlKTu7oFU9NYhVFjAynfAScVH6LzHwlgxVGjeFE4v9iXi00VVc57kSv';
const stripePromise = loadStripe(stripePublicKey);

/**
 * #8 — Admin takes a client's card to create a real Stripe subscription.
 * Reuses the same backend as the student flow (create-payment-intent +
 * confirmCardSetup), so the card is saved and billed on the 1st automatically.
 */
const ChargeForm = ({ students, plans, onClose, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [studentId, setStudentId] = useState('');
    const [planId, setPlanId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    const student = students.find(s => String(s.id) === String(studentId));
    const plan = plans.find(p => String(p.id) === String(planId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!stripe || !elements) return;
        if (!studentId) { setError('Please select a student.'); return; }
        if (!planId) { setError('Please select a plan.'); return; }

        setLoading(true);
        try {
            const name = student?.fullname || '';
            const email = student?.email || '';
            const resp = await axios.post(`${baseUrl}/subscription/create-payment-intent/`, {
                plan_id: parseInt(planId),
                student_id: parseInt(studentId),
                email,
                name,
            });

            const { clientSecret, setupClientSecret, isTrialing } = resp.data;
            const cardElement = elements.getElement(CardElement);

            if (isTrialing) {
                // Free until the 1st — save the card now so the first charge succeeds.
                if (!setupClientSecret) {
                    setError('Could not set up the card. Please try again.');
                    setLoading(false);
                    return;
                }
                const { error: setupErr, setupIntent } = await stripe.confirmCardSetup(setupClientSecret, {
                    payment_method: { card: cardElement, billing_details: { name, email } },
                });
                if (setupErr) { setError(setupErr.message || 'Could not save the card.'); setLoading(false); return; }
                if (setupIntent?.status !== 'succeeded') { setError('Card setup was not completed.'); setLoading(false); return; }
            } else if (clientSecret) {
                // Immediate charge required.
                const { error: payErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: { card: cardElement, billing_details: { name, email } },
                });
                if (payErr) { setError(payErr.message || 'Payment failed.'); setLoading(false); return; }
                if (!['succeeded', 'processing'].includes(paymentIntent?.status)) {
                    setError('Payment was not completed.'); setLoading(false); return;
                }
            }

            setDone(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 44, color: '#16a34a' }}><i className="bi bi-check-circle-fill"></i></div>
                <h5 style={{ fontWeight: 700 }}>Subscription created</h5>
                <p style={{ color: '#6b7280', fontSize: 14 }}>
                    {student?.fullname}'s card is saved. The first month is free; billing starts on the 1st.
                </p>
                <button className="btn btn-primary" onClick={onClose}>Done</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div className="alert alert-danger d-flex align-items-center">
                    <i className="bi bi-exclamation-circle me-2"></i>{error}
                </div>
            )}
            <div className="mb-3">
                <label className="form-label">Student</label>
                <select className="form-control" value={studentId} onChange={e => setStudentId(e.target.value)} required>
                    <option value="">Select student…</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullname} ({s.email})</option>)}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Plan</label>
                <select className="form-control" value={planId} onChange={e => setPlanId(e.target.value)} required>
                    <option value="">Select plan…</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.final_price}</option>)}
                </select>
            </div>

            <div className="alert alert-info py-2" style={{ fontSize: 13 }}>
                <i className="bi bi-shield-check me-2"></i>
                No charge today. The card is saved and billed automatically on the 1st{plan ? `, then $${plan.final_price}/period` : ''}.
            </div>

            <div className="mb-3">
                <label className="form-label">Client's Card</label>
                <div style={{ border: '1px solid #ced4da', borderRadius: 6, padding: '12px' }}>
                    <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '16px', color: '#212529' } } }} />
                </div>
                <small className="text-muted">Enter the client's card with their authorization.</small>
            </div>

            <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={!stripe || loading}>
                    {loading ? 'Processing…' : 'Save Card & Subscribe'}
                </button>
            </div>
        </form>
    );
};

const AdminChargeSubscription = ({ students, plans, onClose, onSuccess }) => (
    <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={header}>
                <h5 style={{ margin: 0, fontWeight: 700 }}>
                    <i className="bi bi-credit-card me-2"></i>Charge Card &amp; Subscribe
                </h5>
                <button onClick={onClose} style={closeBtn} aria-label="Close">&times;</button>
            </div>
            <div style={{ padding: '18px 20px' }}>
                <Elements stripe={stripePromise}>
                    <ChargeForm students={students} plans={plans} onClose={onClose} onSuccess={onSuccess} />
                </Elements>
            </div>
        </div>
    </div>
);

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, padding: 16 };
const modal = { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' };
const closeBtn = { background: 'none', border: 'none', fontSize: 26, lineHeight: 1, cursor: 'pointer', color: '#6b7280' };

export default AdminChargeSubscription;
