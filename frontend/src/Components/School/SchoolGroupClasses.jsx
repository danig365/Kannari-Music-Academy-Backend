import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolGroupClasses = () => {
    const schoolId = localStorage.getItem('schoolId');
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', schedule: '', max_students: 20 });
    const [message, setMessage] = useState('');
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState({ teachers: [], students: [] });
    const [assignTeacher, setAssignTeacher] = useState('');
    const [assignStudent, setAssignStudent] = useState('');

    useEffect(() => {
        document.title = 'Group Classes | School Portal';
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [groupsRes, teachersRes, studentsRes] = await Promise.all([
                axios.get(`${baseUrl}/school/groups/${schoolId}/`),
                axios.get(`${baseUrl}/school/teachers/${schoolId}/`),
                axios.get(`${baseUrl}/school/students/${schoolId}/`),
            ]);
            setGroups(groupsRes.data);
            setTeachers(teachersRes.data);
            setStudents(studentsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, school: schoolId };
            await axios.post(`${baseUrl}/school/groups/${schoolId}/`, data);
            setMessage('Group class created successfully!');
            setShowCreateForm(false);
            setFormData({ name: '', description: '', schedule: '', max_students: 20 });
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error creating group class');
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Are you sure you want to delete this group class?')) return;
        try {
            await axios.delete(`${baseUrl}/school/group/${groupId}/`);
            setMessage('Group class deleted');
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error deleting group');
        }
    };

    const toggleGroupDetails = async (groupId) => {
        if (expandedGroup === groupId) {
            setExpandedGroup(null);
            return;
        }
        setExpandedGroup(groupId);
        try {
            const [teacherRes, studentRes] = await Promise.all([
                axios.get(`${baseUrl}/school/group/${groupId}/teachers/`),
                axios.get(`${baseUrl}/school/group/${groupId}/students/`),
            ]);
            setGroupMembers({ teachers: teacherRes.data, students: studentRes.data });
        } catch (error) {
            console.error('Error fetching group members:', error);
        }
    };

    const handleAssignTeacherToGroup = async (groupId) => {
        if (!assignTeacher) return;
        const fd = new FormData();
        fd.append('teacher_id', assignTeacher);
        try {
            await axios.post(`${baseUrl}/school/group/${groupId}/assign-teacher/`, fd);
            setAssignTeacher('');
            toggleGroupDetails(groupId);
            fetchData();
        } catch (error) {
            console.error('Error assigning teacher:', error);
        }
    };

    const handleAssignStudentToGroup = async (groupId) => {
        if (!assignStudent) return;
        const fd = new FormData();
        fd.append('student_id', assignStudent);
        try {
            await axios.post(`${baseUrl}/school/group/${groupId}/assign-student/`, fd);
            setAssignStudent('');
            toggleGroupDetails(groupId);
            fetchData();
        } catch (error) {
            console.error('Error assigning student:', error);
        }
    };

    const handleRemoveTeacher = async (groupId, teacherId) => {
        try {
            await axios.delete(`${baseUrl}/school/group/${groupId}/remove-teacher/${teacherId}/`);
            toggleGroupDetails(groupId);
            fetchData();
        } catch (error) {
            console.error('Error removing teacher:', error);
        }
    };

    const handleRemoveStudent = async (groupId, studentId) => {
        try {
            await axios.delete(`${baseUrl}/school/group/${groupId}/remove-student/${studentId}/`);
            toggleGroupDetails(groupId);
            fetchData();
        } catch (error) {
            console.error('Error removing student:', error);
        }
    };

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading groups..." />
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="school-dashboard-header mb-0">
                    <i className="bi bi-diagram-3 me-2"></i>
                    Group Classes
                </h2>
                <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                    <i className="bi bi-plus-lg me-1"></i>
                    Create Group
                </button>
            </div>

            {message && <div className="alert alert-info">{message}</div>}

            {/* Create Form */}
            {showCreateForm && (
                <div className="card school-page-card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0"><i className="bi bi-plus-circle me-2"></i>Create New Group Class</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreateGroup}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Group Name *</label>
                                    <input type="text" className="form-control" value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Schedule</label>
                                    <input type="text" className="form-control" value={formData.schedule}
                                        placeholder="e.g. Mon/Wed 4:00 PM"
                                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} />
                                </div>
                                <div className="col-md-9">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" rows="2" value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Max Students</label>
                                    <input type="number" className="form-control" value={formData.max_students}
                                        onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })} />
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-primary me-2">
                                        <i className="bi bi-check-lg me-1"></i>Create
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Groups List */}
            {groups.length > 0 ? (
                groups.map((group) => (
                    <div key={group.id} className="card school-content-card mb-3">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 d-inline me-3">{group.name}</h5>
                                <span className={`badge ${group.is_active ? 'bg-success' : 'bg-secondary'} me-2`}>
                                    {group.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <small className="text-muted">
                                    <i className="bi bi-person-check me-1"></i>{group.total_teachers} teachers &middot;
                                    <i className="bi bi-people ms-2 me-1"></i>{group.total_students} {group.total_students === 1 ? 'student' : 'students'}
                                </small>
                            </div>
                            <div>
                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => toggleGroupDetails(group.id)}>
                                    <i className={`bi ${expandedGroup === group.id ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteGroup(group.id)}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        {group.description && (
                            <div className="card-body py-2 px-4">
                                <small className="text-muted">{group.description}</small>
                                {group.schedule && <small className="text-muted ms-3"><i className="bi bi-clock me-1"></i>{group.schedule}</small>}
                            </div>
                        )}

                        {/* Expanded Details */}
                        {expandedGroup === group.id && (
                            <div className="card-body border-top">
                                <div className="row g-3">
                                    {/* Teachers in group */}
                                    <div className="col-md-6">
                                        <h6><i className="bi bi-person-check me-1"></i>Teachers</h6>
                                        {groupMembers.teachers.length > 0 ? (
                                            <ul className="list-group list-group-flush mb-2">
                                                {groupMembers.teachers.map(gt => (
                                                    <li key={gt.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                        <span>{gt.teacher?.full_name || 'Teacher'}</span>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveTeacher(group.id, gt.teacher?.id)}>
                                                            <i className="bi bi-x-lg"></i>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-muted small">No teachers assigned</p>}
                                        <div className="input-group input-group-sm">
                                            <select className="form-select" value={assignTeacher} onChange={(e) => setAssignTeacher(e.target.value)}>
                                                <option value="">Add teacher...</option>
                                                {teachers.map(t => (
                                                    <option key={t.id} value={t.teacher?.id}>{t.teacher?.full_name}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-primary" onClick={() => handleAssignTeacherToGroup(group.id)}>
                                                <i className="bi bi-plus"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Students in group */}
                                    <div className="col-md-6">
                                        <h6><i className="bi bi-people me-1"></i>Students</h6>
                                        {groupMembers.students.length > 0 ? (
                                            <ul className="list-group list-group-flush mb-2">
                                                {groupMembers.students.map(gs => (
                                                    <li key={gs.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                        <span>{gs.student?.fullname || 'Student'}</span>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveStudent(group.id, gs.student?.id)}>
                                                            <i className="bi bi-x-lg"></i>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-muted small">No students assigned</p>}
                                        <div className="input-group input-group-sm">
                                            <select className="form-select" value={assignStudent} onChange={(e) => setAssignStudent(e.target.value)}>
                                                <option value="">Add student...</option>
                                                {students.map(s => (
                                                    <option key={s.id} value={s.student?.id}>{s.student?.fullname}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-primary" onClick={() => handleAssignStudentToGroup(group.id)}>
                                                <i className="bi bi-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <div className="card school-content-card">
                    <div className="card-body">
                        <p className="text-muted text-center school-empty-state">
                            No group classes yet. Click "Create Group" to get started.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default SchoolGroupClasses;
