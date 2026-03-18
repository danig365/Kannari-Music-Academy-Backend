import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import './SchoolDashboard.css';

import Swal from 'sweetalert2';

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const SUBMISSION_TYPES = [
    { value: 'audio', label: 'Audio Recording', icon: 'bi-mic-fill', color: '#8b5cf6' },
    { value: 'video', label: 'Video Recording', icon: 'bi-camera-video-fill', color: '#ec4899' },
    { value: 'file_upload', label: 'File Upload', icon: 'bi-file-earmark-arrow-up-fill', color: '#f59e0b' },
    { value: 'discussion', label: 'Discussion Thread', icon: 'bi-chat-left-text-fill', color: '#06b6d4' },
    { value: 'multiple_choice', label: 'Multiple Choice', icon: 'bi-list-check', color: '#3b82f6' },
];

const STATUS_BADGES = {
    assigned: { label: 'Assigned', bg: '#dbeafe', color: '#1d4ed8', icon: 'bi-clipboard' },
    submitted: { label: 'Submitted', bg: '#dcfce7', color: '#166534', icon: 'bi-check-circle' },
    late: { label: 'Late', bg: '#fee2e2', color: '#991b1b', icon: 'bi-clock-history' },
    graded: { label: 'Graded', bg: '#f3e8ff', color: '#7c3aed', icon: 'bi-award' },
};

const getTypeInfo = (type) => SUBMISSION_TYPES.find(t => t.value === type) || SUBMISSION_TYPES[0];

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
    const [filter, setFilter] = useState({ status: '', submission_type: '' });
    const [mcQuestions, setMcQuestions] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignment_type: 'individual',
        submission_type: 'audio',
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
        if (!courseId) { setModules([]); setLessons([]); return; }
        try {
            const res = await axios.get(`${baseUrl}/course-chapters/${courseId}`);
            setModules(res.data);
            setLessons([]);
        } catch (error) { console.error('Error fetching modules:', error); }
    };

    const handleModuleChange = async (moduleId) => {
        if (!moduleId) { setLessons([]); return; }
        try {
            const res = await axios.get(`${baseUrl}/admin/module/${moduleId}/lessons/`);
            setLessons(res.data);
        } catch (error) { console.error('Error fetching lessons:', error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate MC questions if MC type selected
        if (formData.submission_type === 'multiple_choice') {
            if (mcQuestions.length === 0) {
                Swal.fire({ icon: 'warning', text: 'Please add at least one multiple-choice question.' });
                return;
            }
            for (let i = 0; i < mcQuestions.length; i++) {
                const q = mcQuestions[i];
                if (!q.question_text?.trim()) {
                    Swal.fire({ icon: 'warning', text: `Question ${i + 1}: question text is required.` }); return;
                }
                if (!q.option_a?.trim() || !q.option_b?.trim()) {
                    Swal.fire({ icon: 'warning', text: `Question ${i + 1}: options A and B are required.` }); return;
                }
            }
        }

        try {
            const data = { ...formData, school: schoolId };
            if (formData.assignment_type === 'individual') {
                delete data.group_class;
            } else {
                delete data.student;
            }
            if (formData.submission_type !== 'audio') {
                data.audio_required = false;
            }
            if (formData.submission_type === 'multiple_choice') {
                data.mc_questions = mcQuestions.map((q, idx) => ({
                    question_text: q.question_text,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c || '',
                    option_d: q.option_d || '',
                    correct_option: q.correct_option,
                    points: q.points || 1,
                }));
            }
            await axios.post(`${baseUrl}/school/lesson-assignments/${schoolId}/`, data);
            setMessage('Assignment created successfully!');
            setShowForm(false);
            setFormData({ title: '', description: '', assignment_type: 'individual', submission_type: 'audio', student: '', group_class: '', lesson: '', due_date: '', audio_required: true, max_points: 100, notes: '' });
            setMcQuestions([]);
            setSelectedCourse('');
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error creating assignment: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this assignment?')) return;
        try {
            await axios.delete(`${baseUrl}/school/lesson-assignment/${id}/`);
            fetchData();
        } catch (error) { console.error('Error:', error); }
    };

    const getComputedStatus = (a) => {
        if (a.computed_status) return a.computed_status;
        if (a.status) return a.status;
        return 'assigned';
    };

    const filteredAssignments = assignments.filter(a => {
        if (filter.status && getComputedStatus(a) !== filter.status) return false;
        if (filter.submission_type && a.submission_type !== filter.submission_type) return false;
        return true;
    });

    // Stats
    const statusCounts = { assigned: 0, submitted: 0, late: 0, graded: 0 };
    assignments.forEach(a => {
        const s = getComputedStatus(a);
        if (statusCounts[s] !== undefined) statusCounts[s]++;
    });

    if (loading) {
        return (
            <div className="school-loading-wrapper">
                <LoadingSpinner size="lg" text="Loading assignments..." />
            </div>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h2 className="school-dashboard-header mb-0">
                    <i className="bi bi-journal-bookmark me-2"></i>
                    Lesson Assignments
                </h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>
                    {showForm ? 'Cancel' : 'Create Assignment'}
                </button>
            </div>

            {message && <div className="alert alert-info alert-dismissible fade show">{message}<button type="button" className="btn-close" onClick={() => setMessage('')}></button></div>}

            {/* Status summary cards */}
            <div className="row g-3 mb-4">
                {Object.entries(STATUS_BADGES).map(([key, badge]) => (
                    <div className="col-6 col-md-3" key={key}>
                        <div
                            className="card h-100 border-0 shadow-sm"
                            style={{ cursor: 'pointer', backgroundColor: filter.status === key ? badge.bg : '#fff', transition: 'all 0.2s' }}
                            onClick={() => setFilter(f => ({ ...f, status: f.status === key ? '' : key }))}
                        >
                            <div className="card-body text-center py-3">
                                <i className={`bi ${badge.icon}`} style={{ fontSize: '20px', color: badge.color }}></i>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: badge.color }}>{statusCounts[key]}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{badge.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="card school-page-card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0"><i className="bi bi-plus-circle me-2"></i>Create Assignment</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                {/* Title */}
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Title</label>
                                    <input type="text" className="form-control" value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Assignment title (or uses lesson title)" />
                                </div>

                                {/* Submission Type Selector */}
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Submission Type *</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {SUBMISSION_TYPES.map(t => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                className="btn btn-sm"
                                                onClick={() => setFormData({ ...formData, submission_type: t.value, audio_required: t.value === 'audio' })}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    border: formData.submission_type === t.value ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                                                    backgroundColor: formData.submission_type === t.value ? `${t.color}15` : '#fff',
                                                    color: formData.submission_type === t.value ? t.color : '#64748b',
                                                    fontWeight: formData.submission_type === t.value ? '600' : '400',
                                                    fontSize: '12px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <i className={`bi ${t.icon} me-1`}></i>{t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assignment Type */}
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Assignment Type</label>
                                    <select className="form-select" value={formData.assignment_type}
                                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value, student: '', group_class: '' })}>
                                        <option value="individual">Individual Student</option>
                                        <option value="group">Group Class</option>
                                    </select>
                                </div>

                                {/* Target */}
                                <div className="col-md-4">
                                    {formData.assignment_type === 'individual' ? (
                                        <>
                                            <label className="form-label fw-semibold">Student *</label>
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
                                            <label className="form-label fw-semibold">Group Class *</label>
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

                                {/* Due Date */}
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Due Date</label>
                                    <input type="date" className="form-control" value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                                </div>

                                {/* Course -> Module -> Lesson */}
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Course</label>
                                    <select className="form-select" value={selectedCourse}
                                        onChange={(e) => handleCourseChange(e.target.value)}>
                                        <option value="">Select Course</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.course?.id || c.id}>{c.course?.title || 'Course'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Module</label>
                                    <select className="form-select" onChange={(e) => handleModuleChange(e.target.value)}
                                        disabled={modules.length === 0}>
                                        <option value="">Select Module</option>
                                        {modules.map(m => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Lesson</label>
                                    <select className="form-select" value={formData.lesson}
                                        onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                                        disabled={lessons.length === 0}>
                                        <option value="">Select Lesson</option>
                                        {lessons.map(l => (
                                            <option key={l.id} value={l.id}>{l.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Max Points */}
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Max Points</label>
                                    <input type="number" min="1" className="form-control" value={formData.max_points}
                                        onChange={(e) => setFormData({ ...formData, max_points: e.target.value })} />
                                </div>

                                {/* Description */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Description / Instructions</label>
                                    <textarea className="form-control" rows="3" value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe what students should do..." />
                                </div>

                                {/* Notes */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Internal Notes</label>
                                    <textarea className="form-control" rows="2" value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Internal notes (not shown to students)" />
                                </div>
                            </div>

                            {/* ========== MC Questions Builder ========== */}
                            {formData.submission_type === 'multiple_choice' && (
                                <div style={{ marginTop: '20px', padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="mb-0 fw-bold"><i className="bi bi-list-check me-2" style={{ color: '#3b82f6' }}></i>Multiple Choice Questions ({mcQuestions.length})</h6>
                                        <button type="button" className="btn btn-sm btn-primary"
                                            onClick={() => setMcQuestions(prev => [...prev, { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', points: 1 }])}>
                                            <i className="bi bi-plus me-1"></i>Add Question
                                        </button>
                                    </div>
                                    {mcQuestions.length === 0 && (
                                        <p className="text-muted text-center" style={{ fontSize: '13px' }}>No questions yet. Click "Add Question" to build your quiz.</p>
                                    )}
                                    {mcQuestions.map((q, qIdx) => (
                                        <div key={qIdx} className="card mb-3">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="fw-bold" style={{ fontSize: '14px' }}>Question {qIdx + 1}</span>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <label style={{ fontSize: '12px', color: '#64748b' }}>Pts:</label>
                                                        <input type="number" min="1" style={{ width: '60px' }} className="form-control form-control-sm"
                                                            value={q.points} onChange={(e) => setMcQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, points: parseInt(e.target.value) || 1 } : item))} />
                                                        <button type="button" className="btn btn-sm btn-outline-danger"
                                                            onClick={() => setMcQuestions(prev => prev.filter((_, i) => i !== qIdx))}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <input type="text" className="form-control mb-2" placeholder="Enter question text..."
                                                    value={q.question_text} onChange={(e) => setMcQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, question_text: e.target.value } : item))} />
                                                {['a', 'b', 'c', 'd'].map((letter) => (
                                                    <div key={letter} className="d-flex align-items-center gap-2 mb-2">
                                                        <button type="button"
                                                            onClick={() => setMcQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, correct_option: letter } : item))}
                                                            className={`btn btn-sm rounded-circle ${q.correct_option === letter ? 'btn-success' : 'btn-outline-secondary'}`}
                                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                                            title={q.correct_option === letter ? 'Correct answer' : 'Set as correct'}>
                                                            {q.correct_option === letter ? <i className="bi bi-check-lg"></i> : letter.toUpperCase()}
                                                        </button>
                                                        <input type="text" className="form-control form-control-sm"
                                                            placeholder={`Option ${letter.toUpperCase()}${letter <= 'b' ? ' (required)' : ' (optional)'}`}
                                                            value={q[`option_${letter}`]}
                                                            onChange={(e) => setMcQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, [`option_${letter}`]: e.target.value } : item))} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary me-2">
                                    <i className="bi bi-check-lg me-1"></i>Create Assignment
                                </button>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Filter:</span>
                <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: '13px' }}
                    value={filter.submission_type} onChange={e => setFilter(f => ({ ...f, submission_type: e.target.value }))}>
                    <option value="">All Types</option>
                    {SUBMISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {(filter.status || filter.submission_type) && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setFilter({ status: '', submission_type: '' })}>
                        <i className="bi bi-x-circle me-1"></i>Clear
                    </button>
                )}
            </div>

            {/* Assignments Table */}
            <div className="card school-content-card">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-list me-2"></i>
                        All Assignments ({filteredAssignments.length})
                    </h5>
                </div>
                <div className="card-body">
                    {filteredAssignments.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Title / Lesson</th>
                                        <th>Submission Type</th>
                                        <th>Target</th>
                                        <th>Status</th>
                                        <th>Due Date</th>
                                        <th>Points</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssignments.map((a, index) => {
                                        const typeInfo = getTypeInfo(a.submission_type);
                                        const status = getComputedStatus(a);
                                        const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.assigned;
                                        return (
                                            <tr key={a.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <strong>{a.display_title || a.title || a.lesson_title || 'Untitled'}</strong>
                                                    {a.description && <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</div>}
                                                </td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
                                                        <i className={`bi ${typeInfo.icon}`} style={{ fontSize: '11px' }}></i>
                                                        {typeInfo.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${a.assignment_type === 'group' ? 'bg-warning text-dark' : 'bg-info'}`}>
                                                        {a.assignment_type === 'group' ? 'Group' : 'Individual'}
                                                    </span>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>{a.student_name || a.group_name || 'N/A'}</div>
                                                </td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                                                        <i className={`bi ${statusBadge.icon}`} style={{ fontSize: '10px' }}></i>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '13px' }}>{a.due_date || '—'}</td>
                                                <td style={{ fontSize: '13px' }}>{a.max_points || 100}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a.id)} title="Delete">
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center school-empty-state">
                            {assignments.length > 0 ? 'No assignments match your filters.' : 'No lesson assignments yet. Click "Create Assignment" to get started.'}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default SchoolLessonAssignments;
