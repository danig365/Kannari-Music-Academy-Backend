import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from './Sidebar';
import LoadingSpinner from '../LoadingSpinner';
import './StudentSubscriptions.css';
import { API_BASE_URL, SITE_URL } from '../../config';
import { getStudentSubscription, getSubscriptionUsage, getAssignedTeacher, getPlanTeachers, formatAccessLevel, getAccessLevelColor, clearSubscriptionCache } from '../../services/subscriptionService';

const baseUrl = API_BASE_URL;
const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SUGuu5660mVKr4oXfErDtBTL6gARjogpSlaC7hPrDdXlKTu7oFU9NYhVFjAynfAScVH6LzHwlgxVGjeFE4v9iXi00VVc57kSv';
const stripePromise = loadStripe(stripePublicKey);

// Payment Form Component
const PaymentForm = ({ plan, studentId, hasCardOnFile, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || (!hasCardOnFile && !elements)) return;

        setLoading(true);
        setError(null);

        try {
            if (!hasCardOnFile) {
                if (!name.trim()) { setError('Please enter your full name'); setLoading(false); return; }
                if (!email.trim()) { setError('Please enter your email address'); setLoading(false); return; }
            }
            if (!studentId) { setError('Student ID not found. Please log in again.'); setLoading(false); return; }
            if (!plan || !plan.id || !plan.final_price) { setError('Invalid plan information. Please try again.'); setLoading(false); return; }

            const paymentData = {
                plan_id: parseInt(plan.id),
                student_id: parseInt(studentId),
                email: hasCardOnFile ? '' : email.trim(),
                name: hasCardOnFile ? '' : name.trim(),
            };

            // Create Stripe Subscription on backend
            const response = await axios.post(`${baseUrl}/subscription/create-payment-intent/`, paymentData);

            const { clientSecret, setupClientSecret, isTrialing } = response.data;

            // Trial: $0 today, but we MUST save a card now so the first real
            // charge (on the 1st) succeeds. Confirm the SetupIntent to attach it.
            if (isTrialing) {
                if (hasCardOnFile) {
                    // Customer already has a saved default payment method.
                    onSuccess();
                    return;
                }
                if (setupClientSecret) {
                    const cardElement = elements.getElement(CardElement);
                    const { error: setupErr, setupIntent } = await stripe.confirmCardSetup(setupClientSecret, {
                        payment_method: { card: cardElement, billing_details: { name, email } }
                    });
                    if (setupErr) { setError(setupErr.message || 'Could not save your card. Please try again.'); }
                    else if (setupIntent?.status === 'succeeded') { onSuccess(); }
                    else { setError('Card could not be saved. Please try again.'); }
                    return;
                }
                // No setup secret returned (unexpected) — fail loudly rather than
                // silently creating a subscription with no payment method.
                setError('We could not set up your card for future billing. Please try again or contact support.');
                return;
            }

            // Non-trial path: an immediate payment is required.
            if (!clientSecret) {
                onSuccess();
                return;
            }

            if (hasCardOnFile) {
                // Use the customer's saved default payment method — no card element needed
                const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
                if (stripeErr) { setError(stripeErr.message || 'Payment failed'); }
                else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') { onSuccess(); }
                else { setError('Payment was not completed. Please try again.'); }
            } else {
                const cardElement = elements.getElement(CardElement);
                const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: { card: cardElement, billing_details: { name, email } }
                });
                if (stripeErr) { setError(stripeErr.message || 'Payment failed'); }
                else if (paymentIntent?.status === 'succeeded') { onSuccess(); }
                else if (paymentIntent?.status === 'processing') { setError('Payment is being processed. Please wait...'); }
                else { setError('Payment was not completed. Please try again.'); }
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            {error && (
                <div className="alert alert-danger d-flex align-items-center">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            {/* No-charge notice */}
            <div style={{
                padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start',
                marginBottom: '12px',
            }}>
                <i className="bi bi-shield-check" style={{ color: '#16a34a', fontSize: '16px', marginTop: '1px' }}></i>
                <div>
                    <strong style={{ color: '#15803d', fontSize: '13px' }}>No charge today.</strong>
                    <span style={{ color: '#166534', fontSize: '13px' }}> Billing starts on the 1st of next month. The rest of this month is free.</span>
                </div>
            </div>

            {hasCardOnFile ? (
                /* Card-on-file indicator */
                <div style={{
                    padding: '14px 16px', background: '#F7F3EA', border: '1px solid #e2e8f0',
                    borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px',
                    marginBottom: '4px',
                }}>
                    <i className="bi bi-credit-card-2-front-fill" style={{ fontSize: '22px', color: '#64748b' }}></i>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Card on file</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Your saved card will be used for future billing.</div>
                    </div>
                    <i className="bi bi-check-circle-fill ms-auto" style={{ color: '#10b981', fontSize: '18px' }}></i>
                </div>
            ) : (
                <>
                    <div className="form-group">
                        <label htmlFor="fullName">
                            <i className="bi bi-person me-2"></i>Full Name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            className="form-control"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">
                            <i className="bi bi-envelope me-2"></i>Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-control"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="cardElement">
                            <i className="bi bi-credit-card me-2"></i>Card Information
                        </label>
                        <CardElement 
                            id="cardElement"
                            className="form-control card-element" 
                            options={{
                                hidePostalCode: true,
                                style: {
                                    base: {
                                        fontSize: '1rem',
                                        color: '#495057',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                        '::placeholder': { color: '#adb5bd' }
                                    },
                                    invalid: { color: '#D85C4A' }
                                }
                            }}
                        />
                    </div>
                </>
            )}

            <div className="d-flex gap-2 mt-4">
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="btn btn-success flex-grow-1"
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-lock me-2"></i>
                            Confirm Subscription — ${parseFloat(plan.final_price).toFixed(2)}/mo
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-secondary"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

// Main Component
const StudentSubscriptions = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);  // full student record (for stripe_customer_id)
    const [activeTab, setActiveTab] = useState('plans');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const studentLoginStatus = localStorage.getItem('studentLoginStatus');

    // Handle window resize for responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (studentLoginStatus !== 'true') {
            navigate('/student/login');
        } else {
            document.title = 'Subscribe to Plans | Kannari Music Academy';
            getStudentId();
        }
    }, [studentLoginStatus, navigate]);

    const getStudentId = async () => {
        try {
            // Get student ID from localStorage or session
            const storedId = localStorage.getItem('studentId');
            console.log('Retrieved studentId from localStorage:', storedId);
            
            if (storedId) {
                setStudentId(storedId);
                fetchData(storedId);
            } else {
                // If no student ID in localStorage, try to fetch from API
                try {
                    const response = await axios.get(`${baseUrl}/student/`);
                    if (response.data && response.data.id) {
                        console.log('Retrieved studentId from API:', response.data.id);
                        setStudentId(response.data.id);
                        fetchData(response.data.id);
                    } else {
                        console.warn('Student data not found in API response');
                        setLoading(false);
                    }
                } catch (apiError) {
                    console.warn('Student ID not found. Please log in.');
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error('Error getting student ID:', error);
            setLoading(false);
        }
    };

    const fetchData = async (id) => {
        try {
            setLoading(true);
            const [plansRes, subsRes, studentRes] = await Promise.all([
                axios.get(`${baseUrl}/subscription-plans/`),
                axios.get(`${baseUrl}/subscriptions/?student_id=${id}`),
                axios.get(`${baseUrl}/student/${id}/`),
            ]);

            setPlans(plansRes.data.results || plansRes.data);
            setUserSubscriptions(subsRes.data.results || subsRes.data || []);
            setStudentInfo(studentRes.data || null);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const isSubscribedToPlan = (planId) => {
        return userSubscriptions.some(
            sub => sub.plan === planId && (sub.status === 'active' || sub.status === 'pending')
        );
    };

    const handleRequestPlan = async (plan) => {
        const result = await Swal.fire({
            icon: 'question',
            title: `Request ${plan.name}?`,
            html: `<p style="font-size:14px;color:#374151">Submit a request for this plan. An admin will review and activate your access, and arrange payment with you directly.</p>`,
            showCancelButton: true,
            confirmButtonText: 'Send Request',
            confirmButtonColor: '#101C2C',
        });
        if (!result.isConfirmed) return;
        try {
            const res = await axios.post(`${baseUrl}/subscription/request/`, {
                student_id: parseInt(studentId),
                plan_id: parseInt(plan.id),
            });
            Swal.fire({
                icon: res.data.bool ? 'success' : 'info',
                title: res.data.bool ? 'Request sent' : 'Notice',
                text: res.data.message || 'Your request was submitted.',
            });
            if (studentId) fetchData(studentId);
        } catch (err) {
            Swal.fire('Could not send request', err.response?.data?.error || err.response?.data?.message || 'Please try again.', 'error');
        }
    };

    const handleSubscriptionSuccess = () => {
        Swal.fire({
            icon: 'success',
            title: '🎉 Subscription Successful!',
            html: '<div style="text-align:center"><p style="font-size:16px;margin-bottom:10px">Thank you for subscribing!</p><div style="font-size:32px;margin:15px 0">✓</div><p style="color:#6b7280;font-size:14px">Your subscription is now active. You will be charged automatically each billing period.</p></div>',
            timer: 4000,
            showConfirmButton: true,
            confirmButtonText: 'Got it!',
            allowOutsideClick: false,
            background: '#ffffff',
            color: '#101C2C'
        }).then(() => {
            setSelectedPlan(null);
            if (studentId) {
                fetchData(studentId);
            }
        });
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
                <div className="dashboard-content">
                    <div className="mobile-header">
                        <button 
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <i className="bi bi-list"></i>
                        </button>
                    </div>
                    <div className="dashboard-main">
                        <LoadingSpinner size="lg" text="Loading subscriptions..." />
                    </div>
                </div>
            </div>
        );
    }

    if (!studentId) {
        return (
            <div className="dashboard-container">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
                <div className="dashboard-content">
                    <div className="mobile-header">
                        <button 
                            className="sidebar-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <i className="bi bi-list"></i>
                        </button>
                    </div>
                    <div className="container mt-5">
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Please log in to subscribe to plans.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
            <div className="dashboard-content">
                <div className="mobile-header">
                    <button 
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <i className="bi bi-list"></i>
                    </button>
                </div>
                <div className="content-wrapper">
                    <div className="student-subscriptions">
            <h2 className="mb-4 subscription-header">
                <i className="bi bi-music-note-list me-2" aria-hidden="true"></i>
                Subscribe to Plans
            </h2>

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plans')}
                    >
                        <i className="bi bi-music-note-beamed me-2" aria-hidden="true"></i>Available Plans
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'my-subscriptions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-subscriptions')}
                    >
                        <i className="bi bi-check-circle-fill me-2" aria-hidden="true"></i>My Subscriptions
                    </button>
                </li>
            </ul>

            {/* Available Plans Tab */}
            {activeTab === 'plans' && (
                <div>
                    <div className="plans-grid">
                        {plans.map(plan => {
                            const accessLevel = plan.access_level || 0;
                            const levelColor = getAccessLevelColor(accessLevel);
                            
                            return (
                            <div key={plan.id} className="plan-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                {/* Access Level Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: '6px',
                                    zIndex: 2
                                }}>
                                    <span style={{
                                        background: levelColor,
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        <i className="bi bi-award me-1"></i>
                                        {formatAccessLevel(accessLevel)}
                                    </span>
                                    {isSubscribedToPlan(plan.id) && (
                                        <span style={{
                                            background: '#10b981',
                                            color: 'white',
                                            padding: '4px 10px',
                                            borderRadius: '16px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <i className="bi bi-check-circle me-1"></i>SUBSCRIBED
                                        </span>
                                    )}
                                </div>

                                <div className="plan-header">
                                    <h5>{plan.name}</h5>
                                </div>
                                <p className="plan-description">{plan.description}</p>
                                
                                <div className="plan-price">
                                    <div className="price-main">${plan.final_price}</div>
                                    <div className="price-duration">/ {plan.duration}</div>
                                    {plan.discount_price && (
                                        <div className="price-discount">
                                            Was ${plan.price}
                                        </div>
                                    )}
                                </div>

                                <ul className="plan-features">
                                    <li className="feature">
                                        <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true"></i>
                                        Max {plan.max_courses} Courses
                                    </li>
                                    <li className="feature">
                                        <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true"></i>
                                        Max {plan.max_lessons} Lessons
                                    </li>
                                    {plan.lessons_per_week && (
                                        <li className="feature">
                                            <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true"></i>
                                            {plan.lessons_per_week} Lessons/Week
                                        </li>
                                    )}
                                    {plan.allowed_teachers && plan.allowed_teachers.length > 0 && (
                                        <li className="feature">
                                            <i className="bi bi-person-check-fill text-info me-2" aria-hidden="true"></i>
                                            <div style={{ marginLeft: '-0.5rem' }}>
                                                <div style={{ fontWeight: 500, marginBottom: '6px' }}>Instructors: <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.9em' }}>({plan.allowed_teachers.length})</span></div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {plan.allowed_teachers.map((teacher, idx) => (
                                                        <span key={idx} style={{
                                                            background: '#e0f2fe',
                                                            color: '#0369a1',
                                                            padding: '3px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 500,
                                                            whiteSpace: 'nowrap',
                                                            display: 'inline-block'
                                                        }}>
                                                            {teacher.full_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </li>
                                    )}
                                    {/* Access Control Features */}
                                    {(plan.access_level === 'premium' || plan.access_level === 'unlimited') && (
                                        <li className="feature">
                                            <i className="bi bi-star-fill text-warning me-2" aria-hidden="true"></i>
                                            Premium Course Access
                                        </li>
                                    )}
                                    {plan.can_download && (
                                        <li className="feature">
                                            <i className="bi bi-download text-primary me-2" aria-hidden="true"></i>
                                            Download Content
                                        </li>
                                    )}
                                    {plan.can_access_live_sessions && (
                                        <li className="feature">
                                            <i className="bi bi-camera-video-fill text-danger me-2" aria-hidden="true"></i>
                                            Live Sessions {plan.max_live_sessions_per_month > 0 ? `(${plan.max_live_sessions_per_month}/mo)` : ''}
                                        </li>
                                    )}
                                    {plan.max_audio_messages_per_month > 0 && (
                                        <li className="feature">
                                            <i className="bi bi-mic-fill text-purple me-2" aria-hidden="true" style={{ color: '#7C9BB8' }}></i>
                                            Audio Messages ({plan.max_audio_messages_per_month}/mo)
                                        </li>
                                    )}
                                    {plan.priority_support && (
                                        <li className="feature">
                                            <i className="bi bi-headset text-info me-2" aria-hidden="true"></i>
                                            Priority Support
                                        </li>
                                    )}
                                    {plan.features_list && plan.features_list.map((feature, idx) => (
                                        <li key={idx} className="feature">
                                            <i className="bi bi-check-circle-fill text-success me-2" aria-hidden="true"></i>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        console.log('Subscribe button clicked for plan:', plan);
                                        setSelectedPlan(plan);
                                    }}
                                    disabled={isSubscribedToPlan(plan.id)}
                                    className={`btn w-100 ${
                                        isSubscribedToPlan(plan.id)
                                            ? 'btn-secondary'
                                            : 'btn-primary'
                                    }`}
                                >
                                    {isSubscribedToPlan(plan.id) ? (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Already Subscribed
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-cart-plus me-2"></i>
                                            Subscribe Now
                                        </>
                                    )}
                                </button>
                                {!isSubscribedToPlan(plan.id) && (
                                    <button
                                        onClick={() => handleRequestPlan(plan)}
                                        className="btn btn-outline-primary w-100 mt-2"
                                    >
                                        <i className="bi bi-hand-index me-2"></i>
                                        Request Plan (pay outside app)
                                    </button>
                                )}
                            </div>
                        )})}
                    </div>
                </div>
            )}

            {/* My Subscriptions Tab */}
            {activeTab === 'my-subscriptions' && (
                <div>
                    {userSubscriptions.length === 0 ? (
                        <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            You don't have any active subscriptions yet. Browse our plans and subscribe to get started!
                        </div>
                    ) : (
                        <div className="row">
                            {userSubscriptions.map(sub => {
                                const accessLevel = sub.plan_details?.access_level || 0;
                                const levelColor = getAccessLevelColor(accessLevel);
                                const isExpiringSoon = sub.days_remaining && sub.days_remaining <= 7;
                                
                                return (
                                <div key={sub.id} className="col-lg-6 mb-4">
                                    <div className="card h-100 subscription-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                        {/* Header with Access Level */}
                                        <div style={{ 
                                            background: `linear-gradient(135deg, ${levelColor} 0%, ${levelColor}dd 100%)`,
                                            padding: '20px',
                                            color: 'white'
                                        }}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <span style={{ 
                                                        display: 'inline-block',
                                                        background: 'rgba(255,255,255,0.2)',
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        marginBottom: '8px'
                                                    }}>
                                                        <i className="bi bi-award me-1"></i>
                                                        {formatAccessLevel(accessLevel)} Access
                                                    </span>
                                                    <h4 style={{ margin: 0, fontWeight: 700 }}>
                                                        {sub.plan_details?.name || 'Plan'}
                                                    </h4>
                                                </div>
                                                <span className={`badge bg-${
                                                    sub.status === 'active' ? 'light text-success' :
                                                    sub.status === 'pending' ? 'warning' :
                                                    'danger'
                                                }`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                                                    {sub.status === 'active' && <i className="bi bi-check-circle me-1" aria-hidden="true"></i>}
                                                    {sub.cancel_at_period_end ? 'Cancels at period end' : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="card-body">
                                            {/* Days Remaining Alert */}
                                            {isExpiringSoon && sub.status === 'active' && (
                                                <div style={{
                                                    background: '#fef3c7',
                                                    border: '1px solid #fcd34d',
                                                    borderRadius: '10px',
                                                    padding: '12px',
                                                    marginBottom: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <i className="bi bi-exclamation-triangle-fill" style={{ color: '#C9A66B' }}></i>
                                                    <span style={{ color: '#92400e', fontSize: '14px' }}>
                                                        Expiring in {sub.days_remaining} days - Renew now to avoid interruption
                                                    </span>
                                                </div>
                                            )}

                                            {/* Assigned Teacher */}
                                            {sub.assigned_teacher_details && (
                                                <div style={{
                                                    background: '#f0f9ff',
                                                    borderRadius: '12px',
                                                    padding: '14px',
                                                    marginBottom: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        background: '#101C2C',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '20px',
                                                        overflow: 'hidden',
                                                        flexShrink: 0
                                                    }}>
                                                        {sub.assigned_teacher_details.profile_img ? (
                                                            <img 
                                                                src={sub.assigned_teacher_details.profile_img.startsWith('http') 
                                                                    ? sub.assigned_teacher_details.profile_img 
                                                                    : `${SITE_URL}${sub.assigned_teacher_details.profile_img}`}
                                                                alt="Teacher"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <i className="bi bi-person-fill"></i>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Your Assigned Teacher
                                                        </div>
                                                        <div style={{ fontWeight: 600, color: '#101C2C' }}>
                                                            {sub.assigned_teacher_details.full_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Allowed Teachers */}
                                            {sub.plan_details?.allowed_teachers && sub.plan_details.allowed_teachers.length > 0 && (
                                                <div style={{
                                                    background: '#f5f3ff',
                                                    borderRadius: '12px',
                                                    padding: '14px',
                                                    marginBottom: '16px',
                                                    borderLeft: '4px solid #a78bfa'
                                                }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>
                                                        <i className="bi bi-people-fill me-2"></i>Allowed Instructors
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {sub.plan_details.allowed_teachers.map((teacher, idx) => (
                                                            <span key={idx} style={{
                                                                background: '#ede9fe',
                                                                color: '#6b21a8',
                                                                padding: '4px 12px',
                                                                borderRadius: '20px',
                                                                fontSize: '13px',
                                                                fontWeight: 500
                                                            }}>
                                                                {teacher.full_name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Usage Stats */}
                                            {sub.usage_summary && (
                                                <div style={{ marginBottom: '16px' }}>
                                                    <h6 style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
                                                        <i className="bi bi-bar-chart me-2"></i>Usage This Period
                                                    </h6>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div style={{ background: '#F7F3EA', padding: '12px', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#101C2C' }}>
                                                                {sub.usage_summary.courses_used || 0}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                                / {sub.usage_summary.courses_limit || '∞'} courses
                                                            </div>
                                                        </div>
                                                        <div style={{ background: '#F7F3EA', padding: '12px', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#101C2C' }}>
                                                                {sub.usage_summary.lessons_used || 0}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                                / {sub.usage_summary.lessons_limit || '∞'} lessons
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {sub.usage_summary.lessons_per_week && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                                                <span style={{ color: '#64748b' }}>Weekly Lessons</span>
                                                                <span style={{ fontWeight: 600 }}>
                                                                    {sub.usage_summary.lessons_this_week || 0} / {sub.usage_summary.lessons_per_week}
                                                                </span>
                                                            </div>
                                                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    height: '100%',
                                                                    width: `${Math.min(((sub.usage_summary.lessons_this_week || 0) / sub.usage_summary.lessons_per_week) * 100, 100)}%`,
                                                                    background: '#7C9BB8',
                                                                    borderRadius: '4px'
                                                                }}></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Subscription Details */}
                                            <ul className="subscription-details" style={{ marginBottom: 0 }}>
                                                <li>
                                                    <strong><i className="bi bi-cash-coin me-2"></i>Price Paid</strong>
                                                    <span className="fw-600">${sub.price_paid}</span>
                                                </li>
                                                <li>
                                                    <strong><i className="bi bi-calendar-event me-2"></i>Start Date</strong>
                                                    <span>{new Date(sub.start_date).toLocaleDateString()}</span>
                                                </li>
                                                <li>
                                                    <strong><i className="bi bi-calendar-x me-2"></i>Billing</strong>
                                                    <span>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Ongoing monthly'}</span>
                                                </li>
                                                {sub.status === 'active' && sub.days_remaining != null && (
                                                    <li className={isExpiringSoon ? 'text-warning' : 'text-success'}>
                                                        <strong><i className="bi bi-hourglass-split me-2"></i>Days Left</strong>
                                                        <span className="fw-700">{sub.days_remaining} days</span>
                                                    </li>
                                                )}
                                            </ul>

                                            {/* Plan Features */}
                                            {sub.plan_details?.features_list && sub.plan_details.features_list.length > 0 && (
                                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                                    <h6 style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                                                        <i className="bi bi-check2-square me-2"></i>Plan Features
                                                    </h6>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {sub.plan_details.features_list.slice(0, 4).map((feature, idx) => (
                                                            <span key={idx} style={{
                                                                background: '#f0fdf4',
                                                                color: '#16a34a',
                                                                padding: '4px 10px',
                                                                borderRadius: '16px',
                                                                fontSize: '12px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <i className="bi bi-check"></i>
                                                                {feature}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cancellation notice — no self-cancel */}
                                            {sub.status === 'active' && (
                                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                                    <div style={{
                                                        padding: '12px 14px', background: '#fafafa',
                                                        border: '1px solid #e5e7eb', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                    }}>
                                                        <i className="bi bi-info-circle" style={{ color: '#6b7280', fontSize: '16px', flexShrink: 0 }}></i>
                                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                                                            To cancel your subscription, please <strong>contact support</strong>. Your access continues until the end of the current billing period.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            )}

            {/* Payment Modal */}
            {selectedPlan && (
                <div className="modal d-block show" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="modal-title mb-1">
                                        Complete Your Purchase
                                    </h5>
                                    <p style={{fontSize: '0.85rem', margin: 0, opacity: 0.9}}>
                                        {selectedPlan.name} Plan
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedPlan(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Plan Summary */}
                                <div className="plan-summary">
                                    <div style={{marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #e9ecef'}}>
                                        <h6 style={{color: '#6c757d', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0}}>
                                            Order Summary
                                        </h6>
                                    </div>
                                    
                                    <div className="summary-item">
                                        <span>{selectedPlan.name} Plan</span>
                                        <span>${parseFloat(selectedPlan.price).toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="summary-item">
                                        <span>Duration</span>
                                        <span style={{textTransform: 'capitalize'}}>{selectedPlan.duration.replace('_', ' ')}</span>
                                    </div>
                                    
                                    {selectedPlan.discount_price && (
                                        <div className="summary-item discount">
                                            <span><i className="bi bi-tag-fill me-2"></i>Special Offer</span>
                                            <span>-${(parseFloat(selectedPlan.price) - parseFloat(selectedPlan.discount_price)).toFixed(2)}</span>
                                        </div>
                                    )}
                                    
                                    <div className="summary-item total">
                                        <span>You Pay</span>
                                        <span>${parseFloat(selectedPlan.final_price).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Payment Form */}
                                <Elements stripe={stripePromise}>
                                    <PaymentForm
                                        plan={selectedPlan}
                                        studentId={studentId}
                                        hasCardOnFile={!!(studentInfo?.stripe_customer_id)}
                                        onSuccess={handleSubscriptionSuccess}
                                        onCancel={() => setSelectedPlan(null)}
                                    />
                                </Elements>
                                
                                {/* Security Info */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    color: '#6c757d'
                                }}>
                                    <i className="bi bi-shield-check" style={{color: '#28a745', marginRight: '0.5rem'}}></i>
                                    Secure payment powered by <strong>Stripe</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSubscriptions;
