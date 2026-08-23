import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MONTH_COLOR = [
    '#101C2C', '#0ea5e9', '#10b981', '#C9A66B',
    '#D85C4A', '#7C9BB8', '#D85C4A', '#7C9BB8',
];

const emptyForm = {
    title: '',
    subtitle: '',
    description: '',
    duration_months: 6,
    is_active: false,
    created_by_admin: '',
};

const AdminLearningPaths = () => {
    const adminId = localStorage.getItem('adminId');

    // ── state ──────────────────────────────────────────────────────────────────
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);        // all available courses for picker
    const [selectedPath, setSelectedPath] = useState(null);  // path currently being edited
    const [view, setView] = useState('list');          // 'list' | 'detail'

    // path form
    const [showPathForm, setShowPathForm] = useState(false);
    const [editingPath, setEditingPath] = useState(null);
    const [pathForm, setPathForm] = useState({ ...emptyForm });
    const [savingPath, setSavingPath] = useState(false);

    // add-course form
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [addCourseForm, setAddCourseForm] = useState({ course: '', month_number: 1, order: 0, title_override: '' });
    const [addingCourse, setAddingCourse] = useState(false);

    // ── loaders ────────────────────────────────────────────────────────────────
    const fetchPaths = useCallback(async () => {
        try {
            const res = await axios.get(`${baseUrl}/learning-paths/?admin=1`);
            setPaths(res.data);
        } catch (e) {
            console.error('Failed to fetch paths', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await axios.get(`${baseUrl}/admin/courses/`);
            setCourses(res.data);
        } catch (e) {
            console.error('Failed to fetch courses', e);
        }
    }, []);

    useEffect(() => {
        fetchPaths();
        fetchCourses();
    }, [fetchPaths, fetchCourses]);

    // refresh selected path detail after mutations
    const refreshSelectedPath = useCallback(async (pathId) => {
        try {
            const res = await axios.get(`${baseUrl}/learning-path/${pathId}/`);
            setSelectedPath(res.data);
            setPaths(prev => prev.map(p => p.id === pathId ? res.data : p));
        } catch (e) {
            console.error('Failed to refresh path', e);
        }
    }, []);

    // ── path CRUD ──────────────────────────────────────────────────────────────
    const openCreateForm = () => {
        setEditingPath(null);
        setPathForm({ ...emptyForm, created_by_admin: adminId || '' });
        setShowPathForm(true);
    };

    const openEditForm = (path) => {
        setEditingPath(path);
        setPathForm({
            title: path.title,
            subtitle: path.subtitle || '',
            description: path.description || '',
            duration_months: path.duration_months,
            is_active: path.is_active,
            created_by_admin: adminId || '',
        });
        setShowPathForm(true);
    };

    const savePath = async () => {
        if (!pathForm.title.trim()) {
            Swal.fire({ icon: 'warning', title: 'Title required', text: 'Please enter a path title.', timer: 2000, showConfirmButton: false });
            return;
        }
        setSavingPath(true);
        try {
            const payload = { ...pathForm };
            if (!payload.created_by_admin) delete payload.created_by_admin;

            if (editingPath) {
                await axios.put(`${baseUrl}/learning-path/${editingPath.id}/`, payload);
                Swal.fire({ icon: 'success', title: 'Path updated', timer: 1500, showConfirmButton: false });
                if (selectedPath?.id === editingPath.id) {
                    await refreshSelectedPath(editingPath.id);
                }
            } else {
                const res = await axios.post(`${baseUrl}/learning-paths/`, payload);
                setPaths(prev => [res.data, ...prev]);
                Swal.fire({ icon: 'success', title: 'Path created', timer: 1500, showConfirmButton: false });
            }
            await fetchPaths();
            setShowPathForm(false);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Save failed', text: e.response?.data?.detail || 'Please try again.' });
        } finally {
            setSavingPath(false);
        }
    };

    const toggleActive = async (path) => {
        try {
            await axios.put(`${baseUrl}/learning-path/${path.id}/`, { is_active: !path.is_active });
            fetchPaths();
            if (selectedPath?.id === path.id) await refreshSelectedPath(path.id);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Update failed', text: 'Could not toggle path status.' });
        }
    };

    const deletePath = async (path) => {
        const result = await Swal.fire({
            title: 'Delete this path?',
            text: `"${path.title}" and all its course entries will be removed. Enrollments will also be deleted.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#D85C4A',
            confirmButtonText: 'Yes, delete',
        });
        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${baseUrl}/learning-path/${path.id}/`);
            setPaths(prev => prev.filter(p => p.id !== path.id));
            if (selectedPath?.id === path.id) { setSelectedPath(null); setView('list'); }
            Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false });
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Delete failed' });
        }
    };

    // ── open path detail ───────────────────────────────────────────────────────
    const openPathDetail = async (path) => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/learning-path/${path.id}/`);
            setSelectedPath(res.data);
            setView('detail');
            // pre-set add-course order to next position
            setAddCourseForm({ course: '', month_number: 1, order: (res.data.courses?.length || 0), title_override: '' });
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Could not load path details' });
        } finally {
            setLoading(false);
        }
    };

    // ── course management in a path ────────────────────────────────────────────
    const addCourseToPAth = async () => {
        if (!addCourseForm.course) {
            Swal.fire({ icon: 'warning', title: 'Select a course', timer: 2000, showConfirmButton: false });
            return;
        }
        setAddingCourse(true);
        try {
            await axios.post(`${baseUrl}/learning-path/${selectedPath.id}/add-course/`, {
                course: addCourseForm.course,
                month_number: addCourseForm.month_number,
                order: addCourseForm.order,
                title_override: addCourseForm.title_override,
            });
            await refreshSelectedPath(selectedPath.id);
            setAddCourseForm(prev => ({ ...prev, course: '', title_override: '', order: (selectedPath.courses?.length || 0) + 1 }));
            setShowAddCourse(false);
        } catch (e) {
            const msg = e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Could not add course.';
            Swal.fire({ icon: 'error', title: 'Add failed', text: msg });
        } finally {
            setAddingCourse(false);
        }
    };

    const removeCourseFromPath = async (lpcId, courseTitle) => {
        const result = await Swal.fire({
            title: 'Remove course?',
            text: `Remove "${courseTitle}" from this path?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#D85C4A',
            confirmButtonText: 'Remove',
        });
        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${baseUrl}/learning-path-course/${lpcId}/`);
            await refreshSelectedPath(selectedPath.id);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Remove failed' });
        }
    };

    const moveCoursEntry = async (courses, index, direction) => {
        const newList = [...courses];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= newList.length) return;
        [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
        const newOrder = newList.map(c => c.id);
        try {
            await axios.post(`${baseUrl}/learning-path/${selectedPath.id}/reorder-courses/`, { order: newOrder });
            await refreshSelectedPath(selectedPath.id);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Reorder failed' });
        }
    };

    // ── available courses for picker (exclude already-added ones) ──────────────
    const availableCourses = courses.filter(c =>
        !(selectedPath?.courses || []).some(lpc => lpc.course === c.id)
    );

    // ── render ─────────────────────────────────────────────────────────────────
    if (loading && paths.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    return (
        <div style={{ background: '#0f1624', minHeight: '100vh', padding: '28px 24px', color: '#e2e8f0' }}>

            {/* ── Header ── */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                    {view === 'detail' && (
                        <button
                            onClick={() => { setView('list'); setSelectedPath(null); }}
                            className="btn btn-sm"
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: 'none', borderRadius: '8px' }}
                        >
                            <i className="bi bi-arrow-left me-1" />Back
                        </button>
                    )}
                    <div>
                        <h4 className="mb-0 fw-bold text-white d-flex align-items-center gap-2">
                            <i className="bi bi-map" style={{ color: '#101C2C' }} />
                            {view === 'list' ? 'Learning Paths' : selectedPath?.title}
                        </h4>
                        <p className="mb-0 mt-1" style={{ fontSize: '13px', color: '#64748b' }}>
                            {view === 'list'
                                ? `${paths.length} path${paths.length !== 1 ? 's' : ''} configured`
                                : `${selectedPath?.courses?.length || 0} course${(selectedPath?.courses?.length || 0) !== 1 ? 's' : ''} · ${selectedPath?.duration_months}-month path`}
                        </p>
                    </div>
                </div>
                {view === 'list' ? (
                    <button
                        onClick={openCreateForm}
                        className="btn d-flex align-items-center gap-2"
                        style={{ background: '#101C2C', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: 600 }}
                    >
                        <i className="bi bi-plus-lg" /> New Learning Path
                    </button>
                ) : (
                    <div className="d-flex gap-2">
                        <button
                            onClick={() => openEditForm(selectedPath)}
                            className="btn btn-sm"
                            style={{ background: 'rgba(66,133,244,0.15)', color: '#101C2C', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '8px' }}
                        >
                            <i className="bi bi-pencil me-1" />Edit Info
                        </button>
                        <button
                            onClick={() => toggleActive(selectedPath)}
                            className="btn btn-sm"
                            style={{
                                background: selectedPath?.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                color: selectedPath?.is_active ? '#D85C4A' : '#10b981',
                                border: `1px solid ${selectedPath?.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                borderRadius: '8px',
                            }}
                        >
                            <i className={`bi ${selectedPath?.is_active ? 'bi-eye-slash' : 'bi-eye'} me-1`} />
                            {selectedPath?.is_active ? 'Unpublish' : 'Publish'}
                        </button>
                    </div>
                )}
            </div>

            {/* ═══════════════════ LIST VIEW ═══════════════════ */}
            {view === 'list' && (
                <>
                    {paths.length === 0 ? (
                        <div className="text-center py-5" style={{ color: '#475569' }}>
                            <i className="bi bi-map" style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }} />
                            <p className="mb-1 fw-medium" style={{ fontSize: '16px', color: '#64748b' }}>No learning paths yet</p>
                            <p style={{ fontSize: '13px' }}>Create a structured 6-month journey for your students.</p>
                            <button
                                onClick={openCreateForm}
                                className="btn mt-2"
                                style={{ background: '#101C2C', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 20px' }}
                            >
                                <i className="bi bi-plus-lg me-2" />Create First Path
                            </button>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {paths.map(path => (
                                <div key={path.id} className="col-12 col-md-6 col-xl-4">
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '14px',
                                            padding: '20px',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onClick={() => openPathDetail(path)}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(66,133,244,0.4)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    >
                                        {/* status badge */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div
                                                className="rounded-2 d-flex align-items-center justify-content-center"
                                                style={{ width: 40, height: 40, background: 'rgba(66,133,244,0.15)' }}
                                            >
                                                <i className="bi bi-map" style={{ color: '#101C2C', fontSize: '18px' }} />
                                            </div>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: path.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.2)',
                                                    color: path.is_active ? '#10b981' : '#64748b',
                                                    border: `1px solid ${path.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`,
                                                    fontSize: '11px', fontWeight: 600, padding: '4px 8px',
                                                }}
                                            >
                                                {path.is_active ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                        <h6 className="fw-bold text-white mb-1" style={{ fontSize: '15px' }}>{path.title}</h6>
                                        {path.subtitle && <p className="mb-2" style={{ fontSize: '12px', color: '#94a3b8' }}>{path.subtitle}</p>}
                                        <div className="d-flex gap-3 mt-3" style={{ fontSize: '12px', color: '#64748b' }}>
                                            <span><i className="bi bi-calendar3 me-1" />{path.duration_months} months</span>
                                            <span><i className="bi bi-collection me-1" />{path.total_courses} courses</span>
                                            <span><i className="bi bi-people me-1" />{path.total_enrollments} enrolled</span>
                                        </div>
                                        {/* action row */}
                                        <div className="d-flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => toggleActive(path)}
                                                className="btn btn-sm flex-fill"
                                                style={{
                                                    fontSize: '12px',
                                                    background: path.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                    color: path.is_active ? '#D85C4A' : '#10b981',
                                                    border: 'none', borderRadius: '7px',
                                                }}
                                            >
                                                {path.is_active ? 'Unpublish' : 'Publish'}
                                            </button>
                                            <button
                                                onClick={() => deletePath(path)}
                                                className="btn btn-sm"
                                                style={{ fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#D85C4A', border: 'none', borderRadius: '7px' }}
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════ DETAIL VIEW ═══════════════════ */}
            {view === 'detail' && selectedPath && (
                <div>
                    {/* path meta */}
                    <div
                        className="mb-4 p-4 rounded-3"
                        style={{ background: 'rgba(66,133,244,0.07)', border: '1px solid rgba(66,133,244,0.2)' }}
                    >
                        <div className="row g-3">
                            <div className="col-12 col-md-8">
                                {selectedPath.subtitle && (
                                    <p className="mb-1" style={{ fontSize: '13px', color: '#94a3b8' }}>{selectedPath.subtitle}</p>
                                )}
                                {selectedPath.description && (
                                    <p className="mb-0" style={{ fontSize: '13px', color: '#64748b' }}>{selectedPath.description}</p>
                                )}
                            </div>
                            <div className="col-12 col-md-4">
                                <div className="d-flex flex-column gap-1" style={{ fontSize: '13px', color: '#94a3b8' }}>
                                    <span><i className="bi bi-calendar3 me-2" />{selectedPath.duration_months}-month path</span>
                                    <span><i className="bi bi-collection me-2" />{selectedPath.total_courses} courses</span>
                                    <span><i className="bi bi-people me-2" />{selectedPath.total_enrollments} active enrollments</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* month-by-month timeline */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-white mb-0">
                            <i className="bi bi-list-ol me-2" style={{ color: '#101C2C' }} />Course Sequence
                        </h6>
                        <button
                            onClick={() => setShowAddCourse(true)}
                            className="btn btn-sm"
                            style={{ background: 'rgba(66,133,244,0.15)', color: '#101C2C', border: '1px solid rgba(66,133,244,0.3)', borderRadius: '8px', fontSize: '13px' }}
                        >
                            <i className="bi bi-plus-lg me-1" />Add Course
                        </button>
                    </div>

                    {(!selectedPath.courses || selectedPath.courses.length === 0) ? (
                        <div
                            className="text-center py-5 rounded-3"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)' }}
                        >
                            <i className="bi bi-collection" style={{ fontSize: '36px', color: '#334155', display: 'block', marginBottom: '12px' }} />
                            <p style={{ color: '#475569', fontSize: '14px', marginBottom: 0 }}>
                                No courses added yet. Click <strong style={{ color: '#101C2C' }}>Add Course</strong> to build the path.
                            </p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {selectedPath.courses.map((lpc, idx) => {
                                const monthColor = MONTH_COLOR[(lpc.month_number - 1) % MONTH_COLOR.length];
                                return (
                                    <div
                                        key={lpc.id}
                                        className="d-flex align-items-center gap-3 p-3 rounded-3"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                    >
                                        {/* month badge */}
                                        <div
                                            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: 44, height: 44, background: `${monthColor}20`, border: `2px solid ${monthColor}40` }}
                                        >
                                            <span style={{ color: monthColor, fontWeight: 700, fontSize: '12px', lineHeight: 1 }}>
                                                M{lpc.month_number}
                                            </span>
                                        </div>

                                        {/* course info */}
                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                            <div className="fw-semibold text-white" style={{ fontSize: '14px' }}>
                                                {lpc.title_override || lpc.course_title}
                                            </div>
                                            {lpc.title_override && (
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    Course: {lpc.course_title}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                Position {idx + 1}
                                            </div>
                                        </div>

                                        {/* reorder + remove */}
                                        <div className="d-flex gap-1 flex-shrink-0">
                                            <button
                                                disabled={idx === 0}
                                                onClick={() => moveCoursEntry(selectedPath.courses, idx, 'up')}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', borderRadius: '6px', padding: '4px 8px', opacity: idx === 0 ? 0.3 : 1 }}
                                                title="Move up"
                                            >
                                                <i className="bi bi-chevron-up" />
                                            </button>
                                            <button
                                                disabled={idx === selectedPath.courses.length - 1}
                                                onClick={() => moveCoursEntry(selectedPath.courses, idx, 'down')}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', borderRadius: '6px', padding: '4px 8px', opacity: idx === selectedPath.courses.length - 1 ? 0.3 : 1 }}
                                                title="Move down"
                                            >
                                                <i className="bi bi-chevron-down" />
                                            </button>
                                            <button
                                                onClick={() => removeCourseFromPath(lpc.id, lpc.course_title)}
                                                className="btn btn-sm"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#D85C4A', border: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                                title="Remove"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════ CREATE / EDIT PATH MODAL ═══════════════════ */}
            {showPathForm && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}
                    onClick={() => setShowPathForm(false)}
                >
                    <div
                        className="rounded-4 p-4"
                        style={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '520px', margin: '0 16px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold text-white mb-0">
                                {editingPath ? 'Edit Learning Path' : 'New Learning Path'}
                            </h5>
                            <button
                                onClick={() => setShowPathForm(false)}
                                className="btn btn-sm"
                                style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: 'none', borderRadius: '8px' }}
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            <div>
                                <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    Path Title <span style={{ color: '#D85C4A' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. 6-Month Guitar Journey"
                                    value={pathForm.title}
                                    onChange={e => setPathForm(p => ({ ...p, title: e.target.value }))}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    Subtitle
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. From complete beginner to confident player"
                                    value={pathForm.subtitle}
                                    onChange={e => setPathForm(p => ({ ...p, subtitle: e.target.value }))}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    className="form-control"
                                    placeholder="Describe what students will achieve..."
                                    value={pathForm.description}
                                    onChange={e => setPathForm(p => ({ ...p, description: e.target.value }))}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px', resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    Duration (months)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={24}
                                    className="form-control"
                                    value={pathForm.duration_months}
                                    onChange={e => setPathForm(p => ({ ...p, duration_months: parseInt(e.target.value) || 6 }))}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px', maxWidth: '120px' }}
                                />
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <div
                                    className="rounded-2 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: 40, height: 22, cursor: 'pointer',
                                        background: pathForm.is_active ? '#101C2C' : 'rgba(255,255,255,0.1)',
                                        transition: 'background 0.2s',
                                        position: 'relative',
                                    }}
                                    onClick={() => setPathForm(p => ({ ...p, is_active: !p.is_active }))}
                                >
                                    <div style={{
                                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                                        position: 'absolute',
                                        left: pathForm.is_active ? '22px' : '2px',
                                        transition: 'left 0.2s',
                                    }} />
                                </div>
                                <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                                    {pathForm.is_active ? 'Published (visible to students)' : 'Draft (hidden from students)'}
                                </span>
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button
                                onClick={() => setShowPathForm(false)}
                                className="btn flex-fill"
                                style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: 'none', borderRadius: '10px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePath}
                                disabled={savingPath}
                                className="btn flex-fill fw-semibold"
                                style={{ background: '#101C2C', color: '#fff', border: 'none', borderRadius: '10px' }}
                            >
                                {savingPath ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                {editingPath ? 'Save Changes' : 'Create Path'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════ ADD COURSE MODAL ═══════════════════ */}
            {showAddCourse && selectedPath && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}
                    onClick={() => setShowAddCourse(false)}
                >
                    <div
                        className="rounded-4 p-4"
                        style={{ background: '#1a2234', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '480px', margin: '0 16px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold text-white mb-0">Add Course to Path</h5>
                            <button
                                onClick={() => setShowAddCourse(false)}
                                className="btn btn-sm"
                                style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: 'none', borderRadius: '8px' }}
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            <div>
                                <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    Course <span style={{ color: '#D85C4A' }}>*</span>
                                </label>
                                <select
                                    className="form-select"
                                    value={addCourseForm.course}
                                    onChange={e => setAddCourseForm(p => ({ ...p, course: e.target.value }))}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px' }}
                                >
                                    <option value="">— Select a course —</option>
                                    {availableCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                                {availableCourses.length === 0 && (
                                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>All courses have been added to this path.</p>
                                )}
                            </div>

                            <div className="row g-3">
                                <div className="col-6">
                                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Month Number</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={selectedPath.duration_months}
                                        className="form-control"
                                        value={addCourseForm.month_number}
                                        onChange={e => setAddCourseForm(p => ({ ...p, month_number: parseInt(e.target.value) || 1 }))}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px' }}
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>Order</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="form-control"
                                        value={addCourseForm.order}
                                        onChange={e => setAddCourseForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                                    Custom Title in Path <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Leave blank to use course title"
                                    value={addCourseForm.title_override}
                                    onChange={e => setAddCourseForm(p => ({ ...p, title_override: e.target.value }))}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '10px' }}
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button
                                onClick={() => setShowAddCourse(false)}
                                className="btn flex-fill"
                                style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: 'none', borderRadius: '10px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCourseToPAth}
                                disabled={addingCourse || !addCourseForm.course}
                                className="btn flex-fill fw-semibold"
                                style={{ background: '#101C2C', color: '#fff', border: 'none', borderRadius: '10px' }}
                            >
                                {addingCourse ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                Add to Path
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLearningPaths;
