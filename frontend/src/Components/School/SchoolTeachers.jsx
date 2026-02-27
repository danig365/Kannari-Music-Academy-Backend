import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolTeachers = () => {
    const schoolId = localStorage.getItem('schoolId');
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [assignMsg, setAssignMsg] = useState('');

    useEffect(() => {
        document.title = 'Teachers | School Portal';
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [teacherRes, studentRes] = await Promise.all([
                axios.get(`${baseUrl}/school/teachers/${schoolId}/`),
                axios.get(`${baseUrl}/school/students/${schoolId}/`),
            ]);
            setTeachers(teacherRes.data);
            setStudents(studentRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeacher = async (e) => {
        e.preventDefault();
        if (!selectedTeacher || !selectedStudent) return;

        const formData = new FormData();
        formData.append('teacher_id', selectedTeacher);
        formData.append('student_id', selectedStudent);

        try {
            const response = await axios.post(`${baseUrl}/school/assign-teacher-to-student/${schoolId}/`, formData);
            if (response.data.bool) {
                setAssignMsg(response.data.message);
                setSelectedTeacher('');
                setSelectedStudent('');
                setTimeout(() => setAssignMsg(''), 3000);
            } else {
                setAssignMsg(response.data.message || 'Failed to assign');
            }
        } catch (error) {
            setAssignMsg('Error assigning teacher');
        }
    };

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading teachers..." />
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="school-dashboard-header mb-0">
                    <i className="bi bi-person-check me-2"></i>
                    Teachers
                </h2>
                <button className="btn btn-primary" onClick={() => setShowAssignModal(!showAssignModal)}>
                    <i className="bi bi-link-45deg me-1"></i>
                    Assign Teacher to Student
                </button>
            </div>

            {/* Assign Teacher to Student */}
            {showAssignModal && (
                <div className="card school-page-card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0"><i className="bi bi-link-45deg me-2"></i>Assign Teacher to Student</h5>
                    </div>
                    <div className="card-body">
                        {assignMsg && <div className="alert alert-info">{assignMsg}</div>}
                        <form onSubmit={handleAssignTeacher}>
                            <div className="row g-3">
                                <div className="col-md-5">
                                    <label className="form-label">Teacher</label>
                                    <select className="form-select" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required>
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.teacher?.id || t.id}>
                                                {t.teacher?.full_name || 'Teacher'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label">Student</label>
                                    <select className="form-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
                                        <option value="">Select Student</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.student?.id || s.id}>
                                                {s.student?.fullname || 'Student'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button type="submit" className="btn btn-primary w-100">Assign</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Teachers List */}
            <div className="card school-content-card">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-list me-2"></i>
                        School Teachers ({teachers.length})
                    </h5>
                </div>
                <div className="card-body">
                    {teachers.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Qualification</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map((t, index) => (
                                        <tr key={t.id}>
                                            <td>{index + 1}</td>
                                            <td><strong>{t.teacher?.full_name || 'N/A'}</strong></td>
                                            <td>{t.teacher?.email || 'N/A'}</td>
                                            <td>{t.teacher?.qualification || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${t.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                    {t.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td><small>{t.joined_at ? new Date(t.joined_at).toLocaleDateString() : 'N/A'}</small></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center school-empty-state">
                            No teachers assigned to this school yet. Contact your administrator.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default SchoolTeachers;
