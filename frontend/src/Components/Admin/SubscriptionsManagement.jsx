import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SubscriptionsManagement.css';
import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;

// Access level utilities
const formatAccessLevel = (level) => {
    const levels = { 0: 'Free', 1: 'Basic', 2: 'Standard', 3: 'Premium', 4: 'Unlimited' };
    return levels[level] || 'Unknown';
};

const getAccessLevelColor = (level) => {
    const colors = { 0: '#6b7280', 1: '#3b82f6', 2: '#8b5cf6', 3: '#f59e0b', 4: '#10b981' };
    return colors[level] || '#6b7280';
};

// Map numeric access levels to backend string values
const mapAccessLevelToString = (level) => {
    const map = {
        0: 'free',
        1: 'basic',
        2: 'standard',
        3: 'premium',
        4: 'unlimited'
    };
    // If it's already a string, return it
    if (typeof level === 'string') {
        return level;
    }
    return map[parseInt(level)] || 'basic';
};

const SubscriptionsManagement = () => {
    const [activeTab, setActiveTab] = useState('subscriptions'); // subscriptions, plans, history
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [assigningTeacher, setAssigningTeacher] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');

    // Form states
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        student: '',
        plan: '',
        start_date: '',
        end_date: '',
        price_paid: '',
        is_paid: false,
        assigned_teacher: ''
    });
    const [planFormData, setPlanFormData] = useState({
        name: '',
        description: '',
        duration: 'monthly',
        price: '',
        discount_price: '',
        max_courses: 10,
        max_lessons: 100,
        lessons_per_week: '',
        features: '',
        access_level: 'basic',
        can_download: false,
        can_access_live_sessions: false,
        priority_support: false,
        max_live_sessions_per_month: 0,
        max_audio_messages_per_month: 0,
        allowed_teachers: []
    });

    useEffect(() => {
        document.title = 'Subscriptions Management | Kannari Music Academy';
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            
            // Fetch subscriptions
            let subscriptions = [];
            try {
                const subsRes = await axios.get(`${baseUrl}/subscriptions/`);
                subscriptions = subsRes.data.results || subsRes.data || [];
            } catch (err) {
                console.error('Error fetching subscriptions:', err);
            }
            
            // Fetch plans
            let plans = [];
            try {
                const plansRes = await axios.get(`${baseUrl}/subscription-plans/`);
                plans = plansRes.data.results || plansRes.data || [];
            } catch (err) {
                console.error('Error fetching plans:', err);
            }
            
            // Fetch stats
            let stats = {};
            try {
                const statsRes = await axios.get(`${baseUrl}/admin/subscription-stats/`);
                stats = statsRes.data.stats || {};
            } catch (err) {
                console.error('Error fetching stats:', err);
                // Use default empty stats if fetch fails
                stats = {
                    total_subscriptions: 0,
                    active_subscriptions: 0,
                    pending_subscriptions: 0,
                    total_revenue: 0
                };
            }
            
            // Fetch students
            let students = [];
            try {
                const studentsRes = await axios.get(`${baseUrl}/student/`);
                students = studentsRes.data.results || studentsRes.data || [];
            } catch (err) {
                console.error('Error fetching students:', err);
            }

            // Fetch teachers
            let teachers = [];
            try {
                const teachersRes = await axios.get(`${baseUrl}/teacher/`);
                teachers = teachersRes.data.results || teachersRes.data || [];
                console.log('Teachers fetched successfully:', teachers);
            } catch (err) {
                console.error('Error fetching teachers:', err);
            }
            
            setSubscriptions(subscriptions);
            setPlans(plans);
            setStats(stats);
            setStudents(students);
            setTeachers(teachers);
            console.log('Teachers state set to:', teachers);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubscription = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                student: parseInt(formData.student),
                plan: parseInt(formData.plan),
                start_date: formData.start_date,
                end_date: formData.end_date,
                price_paid: parseFloat(formData.price_paid) || 0,
                is_paid: formData.is_paid,
                status: 'pending',
                assigned_teacher: formData.assigned_teacher ? parseInt(formData.assigned_teacher) : null
            };

            const response = await axios.post(`${baseUrl}/subscriptions/`, payload);
            setSubscriptions([response.data, ...subscriptions]);
            setShowSubscriptionForm(false);
            setFormData({
                student: '',
                plan: '',
                start_date: '',
                end_date: '',
                price_paid: '',
                is_paid: false,
                assigned_teacher: ''
            });
            alert('Subscription created successfully!');
        } catch (error) {
            console.error('Error creating subscription:', error.response?.data || error.message);
            alert('Error creating subscription: ' + (error.response?.data?.detail || error.response?.data?.student?.[0] || error.message || 'Please check the form.'));
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: planFormData.name.trim(),
                description: planFormData.description.trim(),
                duration: planFormData.duration,
                price: parseFloat(planFormData.price) || 0,
                discount_price: planFormData.discount_price && planFormData.discount_price.trim() ? parseFloat(planFormData.discount_price) : null,
                max_courses: parseInt(planFormData.max_courses) || 10,
                max_lessons: parseInt(planFormData.max_lessons) || 100,
                lessons_per_week: planFormData.lessons_per_week && planFormData.lessons_per_week.trim() ? parseInt(planFormData.lessons_per_week) : null,
                features: planFormData.features.trim(),
                access_level: mapAccessLevelToString(planFormData.access_level),
                can_download: planFormData.can_download,
                can_access_live_sessions: planFormData.can_access_live_sessions,
                priority_support: planFormData.priority_support,
                max_live_sessions_per_month: parseInt(planFormData.max_live_sessions_per_month) || 0,
                max_audio_messages_per_month: parseInt(planFormData.max_audio_messages_per_month) || 0,
                allowed_teachers: planFormData.allowed_teachers,
                status: 'active'
            };

            console.log('Creating plan with payload:', payload);
            const response = await axios.post(`${baseUrl}/subscription-plans/`, payload);
            setPlans([response.data, ...plans]);
            setShowPlanForm(false);
            setPlanFormData({
                name: '',
                description: '',
                duration: 'monthly',
                price: '',
                discount_price: '',
                max_courses: 10,
                max_lessons: 100,
                lessons_per_week: '',
                features: '',
                access_level: 1,
                can_download: false,
                can_access_live_sessions: false,
                priority_support: false,
                max_live_sessions_per_month: 0,
                max_audio_messages_per_month: 0,
                allowed_teachers: []
            });
            alert('Plan created successfully!');
        } catch (error) {
            console.error('=== PLAN CREATION ERROR ===');
            console.error('Full error:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            console.error('Error message:', error.message);
            
            // Log all validation errors
            if (error.response?.data) {
                Object.entries(error.response.data).forEach(([key, value]) => {
                    console.error(`Field "${key}":`, value);
                });
            }
            
            const errorMsg = error.response?.data?.detail || 
                            Object.entries(error.response?.data || {})
                                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                                .join('; ') ||
                            error.message || 
                            'Please check the form.';
            
            alert('Error creating plan: ' + errorMsg);
        }
    };

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: planFormData.name.trim(),
                description: planFormData.description.trim(),
                duration: planFormData.duration,
                price: parseFloat(planFormData.price) || 0,
                discount_price: planFormData.discount_price && planFormData.discount_price.trim() ? parseFloat(planFormData.discount_price) : null,
                max_courses: parseInt(planFormData.max_courses) || 10,
                max_lessons: parseInt(planFormData.max_lessons) || 100,
                lessons_per_week: planFormData.lessons_per_week && planFormData.lessons_per_week.trim() ? parseInt(planFormData.lessons_per_week) : null,
                features: planFormData.features.trim(),
                access_level: mapAccessLevelToString(planFormData.access_level),
                can_download: planFormData.can_download,
                can_access_live_sessions: planFormData.can_access_live_sessions,
                priority_support: planFormData.priority_support,
                max_live_sessions_per_month: parseInt(planFormData.max_live_sessions_per_month) || 0,
                max_audio_messages_per_month: parseInt(planFormData.max_audio_messages_per_month) || 0,
                allowed_teachers: planFormData.allowed_teachers,
                status: 'active'
            };

            console.log('Updating plan with payload:', payload);
            const response = await axios.put(`${baseUrl}/subscription-plan/${editingPlan.id}/`, payload);
            setPlans(plans.map(p => p.id === editingPlan.id ? response.data : p));
            setShowPlanForm(false);
            setEditingPlan(null);
            setPlanFormData({
                name: '',
                description: '',
                duration: 'monthly',
                price: '',
                discount_price: '',
                max_courses: 10,
                max_lessons: 100,
                lessons_per_week: '',
                features: '',
                access_level: 1,
                can_download: false,
                can_access_live_sessions: false,
                priority_support: false,
                max_live_sessions_per_month: 0,
                max_audio_messages_per_month: 0,
                allowed_teachers: []
            });
            alert('Plan updated successfully!');
        } catch (error) {
            console.error('Error updating plan:', error.response?.data || error.message);
            alert('Error updating plan: ' + (error.response?.data?.detail || error.response?.data?.price?.[0] || error.message || 'Please check the form.'));
        }
    };

    const handleEditPlan = (plan) => {
        setEditingPlan(plan);
        setPlanFormData({
            name: plan.name,
            description: plan.description,
            duration: plan.duration,
            price: plan.price,
            discount_price: plan.discount_price || '',
            max_courses: plan.max_courses,
            max_lessons: plan.max_lessons,
            lessons_per_week: plan.lessons_per_week || '',
            features: plan.features || '',
            access_level: plan.access_level || 1,
            can_download: plan.can_download || false,
            can_access_live_sessions: plan.can_access_live_sessions || false,
            priority_support: plan.priority_support || false,
            max_live_sessions_per_month: plan.max_live_sessions_per_month || 0,
            max_audio_messages_per_month: plan.max_audio_messages_per_month || 0,
            allowed_teachers: plan.allowed_teachers || []
        });
        setShowPlanForm(true);
    };

    const handleDeletePlan = async (planId) => {
        if (window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
            try {
                await axios.delete(`${baseUrl}/subscription-plan/${planId}/`);
                setPlans(plans.filter(p => p.id !== planId));
                alert('Plan deleted successfully!');
            } catch (error) {
                console.error('Error deleting plan:', error);
                alert('Error deleting plan: ' + (error.response?.data?.detail || error.message));
            }
        }
    };

    const handleCancelEditPlan = () => {
        setShowPlanForm(false);
        setEditingPlan(null);
        setPlanFormData({
            name: '',
            description: '',
            duration: 'monthly',
            price: '',
            discount_price: '',
            max_courses: 10,
            max_lessons: 100,
            lessons_per_week: '',
            features: '',
            access_level: 1,
            can_download: false,
            can_access_live_sessions: false,
            priority_support: false,
            max_live_sessions_per_month: 0,
            max_audio_messages_per_month: 0,
            allowed_teachers: []
        });
    };

    const handleActivateSubscription = async (subscriptionId) => {
        try {
            const response = await axios.post(`${baseUrl}/subscription/${subscriptionId}/activate/`);
            if (response.data.bool) {
                setSubscriptions(subscriptions.map(sub =>
                    sub.id === subscriptionId ? { ...sub, status: 'active', activated_at: response.data.subscription.activated_at } : sub
                ));
                alert('Subscription activated successfully!');
            }
        } catch (error) {
            console.error('Error activating subscription:', error);
            alert('Error activating subscription.');
        }
    };

    const handleCancelSubscription = async (subscriptionId) => {
        if (window.confirm('Are you sure you want to cancel this subscription?')) {
            try {
                const response = await axios.post(`${baseUrl}/subscription/${subscriptionId}/cancel/`);
                if (response.data.bool) {
                    setSubscriptions(subscriptions.map(sub =>
                        sub.id === subscriptionId ? { ...sub, status: 'cancelled', cancelled_at: response.data.subscription.cancelled_at } : sub
                    ));
                    alert('Subscription cancelled successfully!');
                }
            } catch (error) {
                console.error('Error cancelling subscription:', error);
                alert('Error cancelling subscription.');
            }
        }
    };

    const handleAssignTeacher = async (subscriptionId) => {
        try {
            const response = await axios.post(`${baseUrl}/access/assign-teacher/`, {
                subscription_id: subscriptionId,
                teacher_id: selectedTeacher || null
            });
            
            if (response.data.success) {
                // Refresh subscriptions to get updated data
                fetchAllData();
                setAssigningTeacher(null);
                setSelectedTeacher('');
                alert('Teacher assigned successfully!');
            }
        } catch (error) {
            console.error('Error assigning teacher:', error);
            alert('Error assigning teacher: ' + (error.response?.data?.error || error.message));
        }
    };

    const viewSubscriptionDetails = (subscription) => {
        const details = `
Subscription Details
--------------------
Student: ${subscription.student_details?.fullname || 'N/A'}
Email: ${subscription.student_details?.email || 'N/A'}
Plan: ${subscription.plan_details?.name || 'N/A'}
Access Level: ${formatAccessLevel(subscription.plan_details?.access_level || 0)}
Status: ${subscription.status}
Start Date: ${subscription.start_date}
End Date: ${subscription.end_date}
Days Remaining: ${subscription.days_remaining || 0}
Price Paid: $${subscription.price_paid}
Assigned Teacher: ${subscription.assigned_teacher_details?.fullname || 'None'}

Usage Statistics
----------------
Courses Accessed: ${subscription.courses_accessed || 0} / ${subscription.plan_details?.max_courses || '∞'}
Lessons Accessed: ${subscription.lessons_accessed || 0} / ${subscription.plan_details?.max_lessons || '∞'}
Weekly Lessons: ${subscription.current_week_lessons || 0} / ${subscription.plan_details?.lessons_per_week || '∞'}
        `.trim();
        
        alert(details);
    };

    const filterSubscriptions = () => {
        let filtered = subscriptions;
        
        if (filterStatus !== 'all') {
            filtered = filtered.filter(sub => sub.status === filterStatus);
        }
        
        if (searchTerm) {
            filtered = filtered.filter(sub =>
                sub.student_details.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sub.student_details.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (sub.plan_details && sub.plan_details.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        return filtered;
    };

    if (loading) {
        return (
            <div className="admin-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading subscriptions..." />
            </div>
        );
    }

    return (
        <div className="subscriptions-management">
            <h2 className="mb-4 subscription-header">
                <i className="bi bi-credit-card-2-front me-2"></i>
                Subscriptions Management
            </h2>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card stat-card bg-primary text-white h-100">
                        <div className="card-body text-center">
                            <h3>{stats.total_subscriptions || 0}</h3>
                            <p className="mb-0">Total Subscriptions</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card stat-card bg-success text-white h-100">
                        <div className="card-body text-center">
                            <h3>{stats.active_subscriptions || 0}</h3>
                            <p className="mb-0">Active</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card stat-card bg-warning text-white h-100">
                        <div className="card-body text-center">
                            <h3>{stats.pending_subscriptions || 0}</h3>
                            <p className="mb-0">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card stat-card bg-info text-white h-100">
                        <div className="card-body text-center">
                            <h3>${parseFloat(stats.total_revenue || 0).toFixed(2)}</h3>
                            <p className="mb-0">Revenue</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'subscriptions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subscriptions')}
                    >
                        <i className="bi bi-person-check me-2"></i>Subscriptions
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plans')}
                    >
                        <i className="bi bi-box me-2"></i>Plans
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <i className="bi bi-clock-history me-2"></i>History
                    </button>
                </li>
            </ul>

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
                <div>
                    <div className="subscription-header-section d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 fw-700" style={{color: '#2c3e50', fontSize: '1.5rem'}}>
                            <i className="bi bi-person-check me-2"></i>Student Subscriptions
                        </h4>
                        <button
                            className="btn-create-subscription-custom"
                            onClick={() => setShowSubscriptionForm(!showSubscriptionForm)}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            {showSubscriptionForm ? 'Cancel' : 'Create Subscription'}
                        </button>
                    </div>

                    {/* Subscription Form */}
                    {showSubscriptionForm && (
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">Create New Subscription</h5>
                                <form onSubmit={handleCreateSubscription}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Student</label>
                                            <select
                                                className="form-control"
                                                value={formData.student}
                                                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Student</option>
                                                {students.map(student => (
                                                    <option key={student.id} value={student.id}>
                                                        {student.fullname} ({student.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Plan</label>
                                            <select
                                                className="form-control"
                                                value={formData.plan}
                                                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Plan</option>
                                                {plans.map(plan => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name} - ${plan.final_price}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Start Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">End Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Price Paid</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={formData.price_paid}
                                                onChange={(e) => setFormData({ ...formData, price_paid: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <div className="form-check mt-4">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="isPaid"
                                                    checked={formData.is_paid}
                                                    onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                                                />
                                                <label className="form-check-label" htmlFor="isPaid">
                                                    Mark as Paid
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Assigned Teacher (Optional)</label>
                                            <select
                                                className="form-control"
                                                value={formData.assigned_teacher}
                                                onChange={(e) => setFormData({ ...formData, assigned_teacher: e.target.value })}
                                            >
                                                <option value="">No Teacher Assigned</option>
                                                {teachers.map(teacher => (
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.full_name} ({teacher.email})
                                                    </option>
                                                ))}
                                            </select>
                                            <small className="text-muted">Assign a dedicated teacher to this subscription</small>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-success">
                                        Create Subscription
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Search and Filter */}
                    <div className="row mb-3">
                        <div className="col-md-8">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by student name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-control"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </div>

                    {/* Subscriptions Table */}
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Student</th>
                                    <th>Plan</th>
                                    <th>Access Level</th>
                                    <th>Assigned Teacher</th>
                                    <th>Status</th>
                                    <th>Days Left</th>
                                    <th>Usage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filterSubscriptions().length > 0 ? (
                                    filterSubscriptions().map(subscription => (
                                        <React.Fragment key={subscription.id}>
                                        <tr>
                                            <td>
                                                <div>
                                                    <strong>{subscription.student_details?.fullname || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{subscription.student_details?.email || ''}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong>{subscription.plan_details ? subscription.plan_details.name : 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">${subscription.price_paid}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span 
                                                    className="badge"
                                                    style={{ 
                                                        backgroundColor: getAccessLevelColor(subscription.plan_details?.access_level || 0),
                                                        color: 'white'
                                                    }}
                                                >
                                                    {formatAccessLevel(subscription.plan_details?.access_level || 0)}
                                                </span>
                                            </td>
                                            <td>
                                                {subscription.assigned_teacher_details ? (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-person-circle text-primary"></i>
                                                        <span>{subscription.assigned_teacher_details.fullname}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Not Assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge bg-${
                                                    subscription.status === 'active' ? 'success' :
                                                    subscription.status === 'pending' ? 'warning' :
                                                    subscription.status === 'cancelled' ? 'danger' : 'secondary'
                                                }`}>
                                                    {subscription.status}
                                                </span>
                                            </td>
                                            <td>
                                                {subscription.is_active_status ? (
                                                    <span className="text-success fw-bold">{subscription.days_remaining} days</span>
                                                ) : (
                                                    <span className="text-danger">Expired</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="small">
                                                    <div>
                                                        <i className="bi bi-book text-primary me-1"></i>
                                                        {subscription.courses_accessed || 0}/{subscription.plan_details?.max_courses || '∞'}
                                                    </div>
                                                    <div>
                                                        <i className="bi bi-play-circle text-success me-1"></i>
                                                        {subscription.lessons_accessed || 0}/{subscription.plan_details?.max_lessons || '∞'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 flex-wrap">
                                                    {subscription.status === 'pending' && (
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleActivateSubscription(subscription.id)}
                                                            title="Activate"
                                                        >
                                                            <i className="bi bi-check-circle"></i>
                                                        </button>
                                                    )}
                                                    {subscription.status === 'active' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                onClick={() => {
                                                                    setAssigningTeacher(subscription.id);
                                                                    setSelectedTeacher(subscription.assigned_teacher_details?.id || '');
                                                                }}
                                                                title="Assign Teacher"
                                                            >
                                                                <i className="bi bi-person-plus"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleCancelSubscription(subscription.id)}
                                                                title="Cancel"
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => viewSubscriptionDetails(subscription)}
                                                        title="View Details"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Teacher Assignment Row */}
                                        {assigningTeacher === subscription.id && (
                                            <tr className="bg-light">
                                                <td colSpan="8">
                                                    <div className="d-flex align-items-center gap-3 p-2">
                                                        <span className="fw-bold">Assign Teacher:</span>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ width: '250px' }}
                                                            value={selectedTeacher}
                                                            onChange={(e) => setSelectedTeacher(e.target.value)}
                                                        >
                                                            <option value="">No Teacher Assigned</option>
                                                            {teachers.map(teacher => (
                                                                <option key={teacher.id} value={teacher.id}>
                                                                    {teacher.full_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleAssignTeacher(subscription.id)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => {
                                                                setAssigningTeacher(null);
                                                                setSelectedTeacher('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4">
                                            No subscriptions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <div>
                    <div className="plans-header d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 fw-700" style={{color: '#2c3e50', fontSize: '1.5rem'}}>
                            <i className="bi bi-collection me-2"></i>Subscription Plans
                        </h4>
                        <button
                            className="btn-create-plan-custom"
                            onClick={() => {
                                if (editingPlan) {
                                    handleCancelEditPlan();
                                } else {
                                    setShowPlanForm(!showPlanForm);
                                }
                            }}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            {editingPlan ? 'Cancel Edit' : showPlanForm ? 'Cancel' : 'Create Plan'}
                        </button>
                    </div>

                    {/* Plan Form */}
                    {showPlanForm && (
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="card-title">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h5>
                                <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Plan Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={planFormData.name}
                                                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Duration</label>
                                            <select
                                                className="form-control"
                                                value={planFormData.duration}
                                                onChange={(e) => setPlanFormData({ ...planFormData, duration: e.target.value })}
                                            >
                                                <option value="monthly">Monthly</option>
                                                <option value="quarterly">Quarterly</option>
                                                <option value="semi_annual">Semi-Annual</option>
                                                <option value="annual">Annual</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={planFormData.description}
                                            onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Price ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={planFormData.price}
                                                onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Discount Price ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                value={planFormData.discount_price}
                                                onChange={(e) => setPlanFormData({ ...planFormData, discount_price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Courses</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={planFormData.max_courses}
                                                onChange={(e) => setPlanFormData({ ...planFormData, max_courses: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Lessons</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={planFormData.max_lessons}
                                                onChange={(e) => setPlanFormData({ ...planFormData, max_lessons: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Lessons Per Week (Optional)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={planFormData.lessons_per_week}
                                                onChange={(e) => setPlanFormData({ ...planFormData, lessons_per_week: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Access Level</label>
                                            <select
                                                className="form-control"
                                                value={planFormData.access_level}
                                                onChange={(e) => setPlanFormData({ ...planFormData, access_level: e.target.value })}
                                            >
                                                <option value="free">Free (Level 0)</option>
                                                <option value="basic">Basic (Level 1)</option>
                                                <option value="standard">Standard (Level 2)</option>
                                                <option value="premium">Premium (Level 3)</option>
                                                <option value="unlimited">Unlimited (Level 4)</option>
                                            </select>
                                            <small className="text-muted">Higher levels can access more content</small>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12 mb-3">
                                            <label className="form-label">Features (comma-separated)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g., HD Videos, Certificate, Support"
                                                value={planFormData.features}
                                                onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-12">
                                            <label className="form-label fw-bold">Plan Permissions</label>
                                            <div className="d-flex flex-wrap gap-4 mt-2">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="canDownload"
                                                        checked={planFormData.can_download}
                                                        onChange={(e) => setPlanFormData({ ...planFormData, can_download: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="canDownload">
                                                        <i className="bi bi-download text-primary me-1"></i>
                                                        Download Content
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="canAccessLive"
                                                        checked={planFormData.can_access_live_sessions}
                                                        onChange={(e) => setPlanFormData({ ...planFormData, can_access_live_sessions: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="canAccessLive">
                                                        <i className="bi bi-broadcast text-danger me-1"></i>
                                                        Live Sessions
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="prioritySupport"
                                                        checked={planFormData.priority_support}
                                                        onChange={(e) => setPlanFormData({ ...planFormData, priority_support: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="prioritySupport">
                                                        <i className="bi bi-headset text-success me-1"></i>
                                                        Priority Support
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Live Sessions / Month</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={planFormData.max_live_sessions_per_month}
                                                onChange={(e) => setPlanFormData({ ...planFormData, max_live_sessions_per_month: e.target.value })}
                                            />
                                            <small className="text-muted">0 = unlimited (when live sessions enabled)</small>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Max Audio Messages / Month</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="0"
                                                value={planFormData.max_audio_messages_per_month}
                                                onChange={(e) => setPlanFormData({ ...planFormData, max_audio_messages_per_month: e.target.value })}
                                            />
                                            <small className="text-muted">0 = unlimited</small>
                                        </div>
                                    </div>

                                    {/* Allowed Teachers Section */}
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            <i className="bi bi-people-fill text-info me-2"></i>
                                            Allowed Teachers (Leave empty for all teachers)
                                        </label>
                                        <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {teachers.length === 0 ? (
                                                <p className="text-muted mb-0">No teachers available</p>
                                            ) : (
                                                <div className="row">
                                                    {teachers.map(teacher => (
                                                        <div key={teacher.id} className="col-md-6 mb-2">
                                                            <div className="form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id={`planTeacher_${teacher.id}`}
                                                                    checked={planFormData.allowed_teachers.includes(teacher.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setPlanFormData({
                                                                                ...planFormData,
                                                                                allowed_teachers: [...planFormData.allowed_teachers, teacher.id]
                                                                            });
                                                                        } else {
                                                                            setPlanFormData({
                                                                                ...planFormData,
                                                                                allowed_teachers: planFormData.allowed_teachers.filter(id => id !== teacher.id)
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                                <label className="form-check-label" htmlFor={`planTeacher_${teacher.id}`}>
                                                                    {teacher.full_name || `Teacher #${teacher.id}`}
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <small className="text-muted">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Select teachers that students can access with this plan. Empty = all teachers allowed.
                                        </small>
                                    </div>

                                    <button type="submit" className="btn btn-success">
                                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Plans Grid */}
                    <div className="row">
                        {plans.map(plan => (
                            <div key={plan.id} className="col-md-6 col-lg-4 mb-4">
                                <div className="card plan-card h-100">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="card-title mb-0">{plan.name}</h5>
                                            <span 
                                                className="badge"
                                                style={{ 
                                                    backgroundColor: getAccessLevelColor(plan.access_level || 0),
                                                    color: 'white'
                                                }}
                                            >
                                                {formatAccessLevel(plan.access_level || 0)}
                                            </span>
                                        </div>
                                        <p className="card-text text-muted small">{plan.description}</p>
                                        <h4 className="text-primary mb-3">
                                            ${plan.final_price}
                                            <small className="text-muted fs-6">/{plan.duration}</small>
                                        </h4>
                                        {plan.discount_price && (
                                            <p className="text-success mb-3">
                                                <i className="bi bi-tag"></i> Save ${(plan.price - plan.discount_price).toFixed(2)}
                                            </p>
                                        )}
                                        <ul className="list-unstyled mb-3 small">
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle text-success me-2"></i>
                                                Max {plan.max_courses} Courses
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle text-success me-2"></i>
                                                Max {plan.max_lessons} Lessons
                                            </li>
                                            {plan.lessons_per_week && (
                                                <li className="mb-2">
                                                    <i className="bi bi-check-circle text-success me-2"></i>
                                                    {plan.lessons_per_week} Lessons/Week
                                                </li>
                                            )}
                                            {plan.can_download && (
                                                <li className="mb-2">
                                                    <i className="bi bi-download text-primary me-2"></i>
                                                    Download Content
                                                </li>
                                            )}
                                            {plan.can_access_live_sessions && (
                                                <li className="mb-2">
                                                    <i className="bi bi-broadcast text-danger me-2"></i>
                                                    Live Sessions
                                                </li>
                                            )}
                                            {plan.priority_support && (
                                                <li className="mb-2">
                                                    <i className="bi bi-headset text-success me-2"></i>
                                                    Priority Support
                                                </li>
                                            )}
                                            {plan.features_list && plan.features_list.map((feature, idx) => (
                                                <li key={idx} className="mb-2">
                                                    <i className="bi bi-check-circle text-success me-2"></i>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Show allowed teachers */}
                                        {plan.allowed_teachers && plan.allowed_teachers.length > 0 && (
                                            <div className="mb-2">
                                                <small className="text-muted">
                                                    <i className="bi bi-people-fill me-1"></i>
                                                    Allowed Teachers: {
                                                        plan.allowed_teachers.map(tid => {
                                                            const teacher = teachers.find(t => t.id === tid);
                                                            return teacher ? teacher.full_name : `Teacher #${tid}`;
                                                        }).join(', ')
                                                    }
                                                </small>
                                            </div>
                                        )}

                                        <span className={`badge bg-${plan.status === 'active' ? 'success' : 'secondary'}`}>
                                            {plan.status}
                                        </span>
                                        <div className="mt-3 d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-warning"
                                                onClick={() => handleEditPlan(plan)}
                                            >
                                                <i className="bi bi-pencil me-1"></i>Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeletePlan(plan.id)}
                                            >
                                                <i className="bi bi-trash me-1"></i>Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div>
                    <h4 className="mb-3">Subscription History</h4>
                    <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Subscription history is currently being fetched and displayed.
                    </div>
                    <p className="text-muted">History tracking for subscription changes will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionsManagement;
