import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];

/**
 * Admin-controlled student placement modal (Phase 3).
 * Lets an admin assign a student to a teacher + level + specific course(s),
 * view current assignments, and remove them.
 */
const StudentAssignmentModal = ({ student, adminId, onClose, onChanged }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assignments, setAssignments] = useState(null);
    const [teachers, setTeachers] = useState([]);

    const [teacherId, setTeacherId] = useState('');
    const [level, setLevel] = useState('beginner');
    const [teacherCourses, setTeacherCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);

    const loadAssignments = useCallback(async () => {
        try {
            const res = await axios.get(
                `${baseUrl}/admin/student-assignments/${student.id}/`,
                { params: { requester_admin_id: adminId } }
            );
            setAssignments(res.data);
        } catch (err) {
            setAssignments(null);
        }
    }, [student.id, adminId]);

    // Initial load: current assignments + teachers list
    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const [, teachersRes] = await Promise.all([
                    loadAssignments(),
                    axios.get(`${baseUrl}/teacher/`),
                ]);
                if (!active) return;
                const list = teachersRes.data.results || teachersRes.data || [];
                setTeachers(list);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [loadAssignments]);

    // When a teacher is picked, load that teacher's courses (with enrolled flags)
    useEffect(() => {
        if (!teacherId) { setTeacherCourses([]); setSelectedCourseIds([]); return; }
        let active = true;
        setCoursesLoading(true);
        axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${student.id}/`)
            .then(res => {
                if (!active) return;
                setTeacherCourses(res.data.courses || []);
                setSelectedCourseIds([]);
            })
            .catch(() => { if (active) setTeacherCourses([]); })
            .finally(() => { if (active) setCoursesLoading(false); });
        return () => { active = false; };
    }, [teacherId, student.id]);

    const toggleCourse = (id) => {
        setSelectedCourseIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleAssign = async () => {
        if (!teacherId) { Swal.fire('Pick a teacher', 'Please select a teacher first.', 'info'); return; }
        if (selectedCourseIds.length === 0) { Swal.fire('Pick course(s)', 'Select at least one course to assign.', 'info'); return; }
        setSaving(true);
        try {
            const res = await axios.post(`${baseUrl}/admin/assign-student/`, {
                requester_admin_id: adminId,
                student_id: student.id,
                teacher_id: parseInt(teacherId),
                level,
                course_ids: selectedCourseIds,
            });
            await loadAssignments();
            setSelectedCourseIds([]);
            // Refresh the teacher's course list so enrolled flags update
            const refreshed = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${student.id}/`);
            setTeacherCourses(refreshed.data.courses || []);
            if (onChanged) onChanged();
            Swal.fire({ icon: 'success', title: 'Assigned', text: res.data.message, timer: 2500, showConfirmButton: false });
        } catch (err) {
            const msg = err.response?.data?.error || 'Could not assign the student. Please try again.';
            Swal.fire('Assignment failed', msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUnassign = async (courseId, title) => {
        const confirm = await Swal.fire({
            icon: 'warning', title: 'Remove assignment?',
            text: `Remove "${title}" from ${student.fullname}?`,
            showCancelButton: true, confirmButtonText: 'Remove', confirmButtonColor: '#D85C4A',
        });
        if (!confirm.isConfirmed) return;
        try {
            await axios.post(`${baseUrl}/admin/unassign-student/`, {
                requester_admin_id: adminId,
                student_id: student.id,
                course_id: courseId,
            });
            await loadAssignments();
            if (teacherId) {
                const refreshed = await axios.get(`${baseUrl}/teacher/courses-for-student/${teacherId}/${student.id}/`);
                setTeacherCourses(refreshed.data.courses || []);
            }
            if (onChanged) onChanged();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Could not remove the assignment.', 'error');
        }
    };

    return (
        <div style={overlay} onClick={onClose}>
            <div style={modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={header}>
                    <div>
                        <h5 style={{ margin: 0, fontWeight: 700 }}>Assign Classes</h5>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>
                            {student.fullname} &middot; {student.email}
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtn} aria-label="Close">&times;</button>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading…</div>
                ) : (
                    <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
                        {/* Subscription guard notice */}
                        {assignments && !assignments.has_subscription && (
                            <div style={warnBox}>
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                This student has no subscription. They must subscribe before being assigned to classes.
                            </div>
                        )}

                        {/* Current assignments */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={sectionTitle}>Current Assignments</div>
                            {assignments && (assignments.assigned_teacher || assignments.level) && (
                                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                                    {assignments.assigned_teacher && (
                                        <span style={pill}>Teacher: {assignments.assigned_teacher.name}</span>
                                    )}
                                    {assignments.level && (
                                        <span style={pill}>Level: {assignments.level}</span>
                                    )}
                                </div>
                            )}
                            {assignments && assignments.courses.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                                    No courses assigned yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {assignments && assignments.courses.map(c => (
                                        <div key={c.enrollment_id} style={assignedRow}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                                                <div style={{ fontSize: 12, color: '#6b7280' }}>{c.teacher_name}</div>
                                            </div>
                                            <button onClick={() => handleUnassign(c.course_id, c.title)} style={removeBtn}>
                                                <i className="bi bi-x-lg"></i> Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />

                        {/* New assignment */}
                        <div style={sectionTitle}>Assign New</div>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 180 }}>
                                <label style={lbl}>Teacher</label>
                                <select style={input} value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                                    <option value="">Select a teacher…</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ width: 160 }}>
                                <label style={lbl}>Level</label>
                                <select style={input} value={level} onChange={e => setLevel(e.target.value)}>
                                    {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Course picker */}
                        {teacherId && (
                            <div style={{ marginBottom: 12 }}>
                                <label style={lbl}>Courses</label>
                                {coursesLoading ? (
                                    <div style={{ fontSize: 13, color: '#6b7280', padding: 8 }}>Loading courses…</div>
                                ) : teacherCourses.length === 0 ? (
                                    <div style={{ fontSize: 13, color: '#9ca3af', padding: 8 }}>This teacher has no courses.</div>
                                ) : (
                                    <div style={courseList}>
                                        {teacherCourses.map(c => (
                                            <label key={c.id} style={{
                                                ...courseItem,
                                                opacity: c.is_enrolled ? 0.55 : 1,
                                                cursor: c.is_enrolled ? 'not-allowed' : 'pointer',
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    disabled={c.is_enrolled}
                                                    checked={c.is_enrolled || selectedCourseIds.includes(c.id)}
                                                    onChange={() => toggleCourse(c.id)}
                                                />
                                                <span style={{ fontSize: 13 }}>{c.title}</span>
                                                {c.is_enrolled && (
                                                    <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto' }}>
                                                        Already assigned
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                            <button onClick={onClose} style={btnSecondary}>Close</button>
                            <button onClick={handleAssign} disabled={saving} style={btnPrimary}>
                                {saving ? 'Assigning…' : 'Assign Selected'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---- inline styles (matches the codebase's inline-style convention) ----
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, padding: 16 };
const modal = { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' };
const closeBtn = { background: 'none', border: 'none', fontSize: 26, lineHeight: 1, cursor: 'pointer', color: '#6b7280' };
const sectionTitle = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: '#6b7280', marginBottom: 8 };
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 };
const input = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const courseList = { border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 200, overflowY: 'auto' };
const courseItem = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid #f3f4f6' };
const assignedRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F7F3EA', border: '1px solid #e5e7eb', borderRadius: 8 };
const removeBtn = { background: '#fee2e2', color: '#D85C4A', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' };
const pill = { display: 'inline-block', background: '#F1F5F9', color: '#3730a3', borderRadius: 999, padding: '2px 10px', fontSize: 12, marginRight: 6 };
const warnBox = { background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 16 };
const btnPrimary = { background: '#101C2C', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer' };

export default StudentAssignmentModal;
