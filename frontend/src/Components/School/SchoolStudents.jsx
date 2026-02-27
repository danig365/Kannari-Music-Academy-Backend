import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolStudents = () => {
    const schoolId = localStorage.getItem('schoolId');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'Students | School Portal';
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${baseUrl}/school/students/${schoolId}/`);
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading students..." />
            </div>
        );
    }

    return (
        <>
            <h2 className="mb-4 school-dashboard-header">
                <i className="bi bi-people me-2"></i>
                Students
            </h2>

            <div className="card school-content-card">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-list me-2"></i>
                        School Students ({students.length})
                    </h5>
                </div>
                <div className="card-body">
                    {students.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Username</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, index) => (
                                        <tr key={s.id}>
                                            <td>{index + 1}</td>
                                            <td><strong>{s.student?.fullname || 'N/A'}</strong></td>
                                            <td>{s.student?.email || 'N/A'}</td>
                                            <td>{s.student?.username || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${s.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                    {s.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td><small>{s.joined_at ? new Date(s.joined_at).toLocaleDateString() : 'N/A'}</small></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center school-empty-state">
                            No students enrolled in this school yet. Contact your administrator.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default SchoolStudents;
