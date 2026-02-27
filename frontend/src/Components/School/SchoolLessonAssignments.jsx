import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SchoolLessonAssignments = () => {
    const schoolId = localStorage.getItem('schoolId');
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        assignment_type: 'individual',
        student: '',
        group_class: '',
        lesson: '',
        due_date: '',
        audio_required: true,
        max_points: 100,
        notes: '',
    });
    const [selectedCourse, setSelectedCourse] = useState('');

    useEffect(() => {
        document.title = 'Lesson Assignments | School Portal';
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assignRes, studentRes, groupRes, courseRes] = await Promise.all([
                axios.get(`${baseUrl}/school/lesson-assignments/${schoolId}/`),
                axios.get(`${baseUrl}/school/students/${schoolId}/`),
                axios.get(`${baseUrl}/school/groups/${schoolId}/`),
                axios.get(`${baseUrl}/school/courses/${schoolId}/`),
            ]);
            setAssignments(assignRes.data);
            setStudents(studentRes.data);
            setGroups(groupRes.data);
            setCourses(courseRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseChange = async (courseId) => {
        setSelectedCourse(courseId);
        if (!courseId) {
            setModules([]);
            setLessons([]);
            return;
        }
        try {
            // Fetch modules for this course
            const actualCourseId = courseId;
            const res = await axios.get(`${baseUrl}/course-chapters/${actualCourseId}`);
            setModules(res.data);
            setLessons([]);
        } catch (error) {
            console.error('Error fetching modules:', error);
        }
    };

    const handleModuleChange = async (moduleId) => {
        if (!moduleId) {
            setLessons([]);
            return;
        }
        try {
            const res = await axios.get(`${baseUrl}/admin/module/${moduleId}/lessons/`);
            setLessons(res.data);
        } catch (error) {
            console.error('Error fetching lessons:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, school: schoolId };
            if (formData.assignment_type === 'individual') {
                delete data.group_class;
            } else {
                delete data.student;
            }
            await axios.post(`${baseUrl}/school/lesson-assignments/${schoolId}/`, data);
            setMessage('Lesson assigned successfully!');
            setShowForm(false);
            setFormData({ assignment_type: 'individual', student: '', group_class: '', lesson: '', due_date: '', audio_required: true, max_points: 100, notes: '' });
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error assigning lesson');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this assignment?')) return;
        try {
            await axios.delete(`${baseUrl}/school/lesson-assignment/${id}/`);
            fetchData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading assignments..." />
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="school-dashboard-header mb-0">
                    <i className="bi bi-journal-bookmark me-2"></i>
                    Lesson Assignments
                </h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <i className="bi bi-plus-lg me-1"></i>
                    Assign Lesson
                </button>
            </div>

            {message && <div className="alert alert-info">{message}</div>}

            {/* Assign Form */}
            {showForm && (
                <div className="card school-page-card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0"><i className="bi bi-plus-circle me-2"></i>Assign Lesson</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Assignment Type</label>
                                    <select className="form-select" value={formData.assignment_type}
                                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value, student: '', group_class: '' })}>
                                        <option value="individual">Individual Student</option>
                                        <option value="group">Group Class</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    {formData.assignment_type === 'individual' ? (
                                        <>
                                            <label className="form-label">Student *</label>
                                            <select className="form-select" value={formData.student}
                                                onChange={(e) => setFormData({ ...formData, student: e.target.value })} required>
                                                <option value="">Select Student</option>
                                                {students.map(s => (
                                                    <option key={s.id} value={s.student?.id}>{s.student?.fullname}</option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            <label className="form-label">Group Class *</label>
                                            <select className="form-select" value={formData.group_class}
                                                onChange={(e) => setFormData({ ...formData, group_class: e.target.value })} required>
                                                <option value="">Select Group</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Due Date</label>
                                    <input type="date" className="form-control" value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                                </div>

                                {/* Course -> Module -> Lesson drill-down */}
                                <div className="col-md-4">
                                    <label className="form-label">Course</label>
                                    <select className="form-select" value={selectedCourse}
                                        onChange={(e) => handleCourseChange(e.target.value)}>
                                        <option value="">Select Course</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.course?.id || c.id}>{c.course?.title || 'Course'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Module</label>
                                    <select className="form-select" onChange={(e) => handleModuleChange(e.target.value)}
                                        disabled={modules.length === 0}>
                                        <option value="">Select Module</option>
                                        {modules.map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Lesson *</label>
                                    <select className="form-select" value={formData.lesson}
                                        onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                                        disabled={lessons.length === 0} required>
                                        <option value="">Select Lesson</option>
                                        {lessons.map(l => (
                                            <option key={l.id} value={l.id}>{l.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Max Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control"
                                                value={formData.max_points}
                                                onChange={(e) => setFormData({ ...formData, max_points: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4 d-flex align-items-end">
                                            <div className="form-check mb-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={!!formData.audio_required}
                                                    id="audioRequired"
                                                    onChange={(e) => setFormData({ ...formData, audio_required: e.target.checked })}
                                                />
                                                <label className="form-check-label" htmlFor="audioRequired">
                                                    Audio submission required
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-control" rows="2" value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-primary me-2">
                                        <i className="bi bi-check-lg me-1"></i>Assign
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignments List */}
            <div className="card school-content-card">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-list me-2"></i>
                        All Assignments ({assignments.length})
                    </h5>
                </div>
                <div className="card-body">
                    {assignments.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Lesson</th>
                                        <th>Type</th>
                                        <th>Assigned To</th>
                                        <th>Due Date</th>
                                        <th>Max Points</th>
                                        <th>Assigned</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a, index) => (
                                        <tr key={a.id}>
                                            <td>{index + 1}</td>
                                            <td><strong>{a.lesson_title || a.lesson?.title || 'N/A'}</strong></td>
                                            <td>
                                                <span className={`badge ${a.assignment_type === 'group' ? 'bg-warning text-dark' : 'bg-info'}`}>
                                                    {a.assignment_type}
                                                </span>
                                            </td>
                                            <td>{a.student_name || a.group_name || 'N/A'}</td>
                                            <td>{a.due_date || '—'}</td>
                                            <td>{a.max_points || 100}</td>
                                            <td><small>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : 'N/A'}</small></td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a.id)}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center school-empty-state">
                            No lesson assignments yet. Click "Assign Lesson" to get started.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default SchoolLessonAssignments;
