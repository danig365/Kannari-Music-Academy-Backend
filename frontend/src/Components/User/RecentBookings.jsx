import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import { API_BASE_URL } from '../../config';

const RecentBookings = ({ studentId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, [studentId]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/lesson-bookings/?student_id=${studentId}&status=scheduled`);
            setBookings(response.data.slice(0, 3)); // Show last 3 bookings
        } catch (error) {
            console.log('No bookings found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card border-0 h-100">
                <div className="card-body text-center">
                    <LoadingSpinner size="sm" />
                </div>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-gradient" style={{ background: `linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)` }}>
                <h5 className="mb-0 text-white">
                    <i className="bi bi-calendar3 me-2"></i>
                    Upcoming Lessons
                </h5>
            </div>
            <div className="card-body">
                {bookings.length === 0 ? (
                    <div className="text-center text-muted py-3">
                        <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                        <p className="mt-2 mb-0">No upcoming lessons scheduled</p>
                    </div>
                ) : (
                    <div className="lessons-list">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="lesson-item mb-3 pb-3 border-bottom">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 className="mb-1">
                                            <i className="bi bi-person-circle me-2 text-primary"></i>
                                            {booking.teacher_name}
                                        </h6>
                                        <small className="text-muted">
                                            <i className="bi bi-calendar-event me-1"></i>
                                            {new Date(booking.scheduled_date).toLocaleDateString('en-US', { 
                                                weekday: 'short', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </small>
                                    </div>
                                    <span className={`badge bg-${getStatusColor(booking.status)}`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                </div>
                                <small className="text-muted d-block">
                                    <i className="bi bi-clock me-1"></i>
                                    {booking.scheduled_time} ({booking.duration_minutes} min)
                                </small>
                                {booking.meeting_link && (
                                    <small className="d-block mt-1">
                                        <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary">
                                            <i className="bi bi-link-45deg me-1"></i>
                                            Join Meeting
                                        </a>
                                    </small>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'scheduled': return 'info';
        case 'completed': return 'success';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
};

export default RecentBookings;
