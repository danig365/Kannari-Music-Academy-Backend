import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

const baseUrl = API_BASE_URL;

const SUBMISSION_TYPES = [
  { value: 'audio', label: 'Audio Recording', icon: 'bi-mic-fill', color: '#8b5cf6' },
  { value: 'video', label: 'Video Recording', icon: 'bi-camera-video-fill', color: '#ec4899' },
  { value: 'file_upload', label: 'File Upload', icon: 'bi-file-earmark-arrow-up-fill', color: '#f59e0b' },
  { value: 'discussion', label: 'Discussion', icon: 'bi-chat-left-text-fill', color: '#06b6d4' },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: 'bi-list-check', color: '#3b82f6' },
];

const STATUS_BADGES = {
  assigned:  { label: 'Assigned',  bg: '#dbeafe', color: '#1d4ed8', icon: 'bi-clipboard' },
  submitted: { label: 'Submitted', bg: '#fef3c7', color: '#92400e', icon: 'bi-check-circle' },
  late:      { label: 'Late',      bg: '#fee2e2', color: '#991b1b', icon: 'bi-clock-history' },
  graded:    { label: 'Graded',    bg: '#dcfce7', color: '#166534', icon: 'bi-award' },
};

const getTypeMeta = (val) => SUBMISSION_TYPES.find(t => t.value === val) || SUBMISSION_TYPES[0];

const OPTION_LETTERS = ['a', 'b', 'c', 'd'];

const TeacherAssignmentCreate = () => {
  const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('teacher_id');

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', submission_type: 'audio', max_points: 100,
    due_date: '', course_id: '', lesson_id: '', assignment_type: 'individual',
    student: '', group_class: ''
  });
  // MC builder: each question has question_text, option_a..d, correct_option, points
  const [mcQuestions, setMcQuestions] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
    fetchStudents();
    fetchGroups();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/assignments/`);
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Error:', err); }
    setLoading(false);
  };

  const fetchCourses = async () => {
    if (!teacherId) {
      setCourses([]);
      return;
    }

    try {
      const res = await axios.get(`${baseUrl}/teacher-course/${teacherId}`);
      const courseData = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.results) ? res.data.results : []);
      setCourses(courseData);
    } catch (err) {
      try {
        const fallbackRes = await axios.get(`${baseUrl}/teacher-course/${teacherId}/`);
        const fallbackData = Array.isArray(fallbackRes.data)
          ? fallbackRes.data
          : (Array.isArray(fallbackRes.data?.results) ? fallbackRes.data.results : []);
        setCourses(fallbackData);
      } catch (fallbackErr) {
        console.error('Error fetching teacher courses:', fallbackErr);
        setCourses([]);
      }
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/students/${teacherId}/`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Error:', err); }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/groups/`);
      setGroups(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : []));
    } catch (err) { console.error('Error fetching groups:', err); setGroups([]); }
  };

  const fetchModules = async (courseId) => {
    if (!courseId) { setModules([]); setLessons([]); return; }
    try {
      const res = await axios.get(`${baseUrl}/course-chapters/${courseId}`);
      setModules(Array.isArray(res.data) ? res.data : []);
      setLessons([]);
    } catch (err) { console.error('Error:', err); }
  };

  const fetchLessons = async (moduleId) => {
    if (!moduleId) { setLessons([]); return; }
    try {
      const res = await axios.get(`${baseUrl}/admin/module/${moduleId}/lessons/`);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error('Error:', err); }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'course_id') fetchModules(value);
  };

  // MC question helpers
  const addMcQuestion = () => {
    setMcQuestions(prev => [...prev, {
      question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_option: 'a', points: 1
    }]);
  };

  const updateMcQuestion = (idx, field, value) => {
    setMcQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeMcQuestion = (idx) => {
    setMcQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { Swal.fire({ icon: 'warning', text: 'Title is required' }); return; }

    // Validate target assignment
    if (form.assignment_type === 'individual' && !form.student) {
      Swal.fire({ icon: 'warning', text: 'Please select a student for individual assignments.' }); return;
    }
    if (form.assignment_type === 'group' && !form.group_class) {
      Swal.fire({ icon: 'warning', text: 'Please select a group class for group assignments.' }); return;
    }

    if (form.submission_type === 'multiple_choice') {
      if (mcQuestions.length === 0) {
        Swal.fire({ icon: 'warning', text: 'Please add at least one multiple-choice question.' });
        return;
      }

      for (let i = 0; i < mcQuestions.length; i++) {
        const q = mcQuestions[i];
        if (!q.question_text?.trim()) {
          Swal.fire({ icon: 'warning', text: `Question ${i + 1}: question text is required.` });
          return;
        }
        if (!q.option_a?.trim() || !q.option_b?.trim()) {
          Swal.fire({ icon: 'warning', text: `Question ${i + 1}: options A and B are required.` });
          return;
        }
        if (q.correct_option === 'c' && !q.option_c?.trim()) {
          Swal.fire({ icon: 'warning', text: `Question ${i + 1}: option C is marked correct but empty.` });
          return;
        }
        if (q.correct_option === 'd' && !q.option_d?.trim()) {
          Swal.fire({ icon: 'warning', text: `Question ${i + 1}: option D is marked correct but empty.` });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        submission_type: form.submission_type,
        max_points: parseInt(form.max_points) || 100,
        due_date: form.due_date || null,
        lesson: form.lesson_id || null,
        assignment_type: form.assignment_type,
      };

      if (form.submission_type === 'multiple_choice') {
        payload.mc_questions = mcQuestions.map((q) => ({
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          correct_option: q.correct_option,
          points: q.points || 1,
        }));
      }

      if (form.assignment_type === 'individual' && form.student) {
        payload.student = form.student;
      }
      if (form.assignment_type === 'group' && form.group_class) {
        payload.group_class = form.group_class;
      }

      await axios.post(`${baseUrl}/teacher/${teacherId}/assignments/`, payload);

      Swal.fire({ icon: 'success', title: 'Assignment created!', timer: 2000 });
      setShowForm(false);
      setForm({ title: '', description: '', submission_type: 'audio', max_points: 100, due_date: '', course_id: '', lesson_id: '', assignment_type: 'individual', student: '', group_class: '' });
      setMcQuestions([]);
      setModules([]);
      setLessons([]);
      await fetchAssignments();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || JSON.stringify(err.response?.data) || 'Failed to create assignment' });
    }
    setSaving(false);
  };

  const handleDelete = async (assignmentId) => {
    const result = await Swal.fire({
      title: 'Delete Assignment?',
      text: 'This will permanently delete this assignment and all its submissions.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${baseUrl}/teacher/${teacherId}/assignment/${assignmentId}/`);
      Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500 });
      await fetchAssignments();
    } catch (err) {
      Swal.fire({ icon: 'error', text: 'Failed to delete assignment.' });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>
            <i className="bi bi-journal-bookmark me-2"></i>Assignments
          </h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Create and manage multi-type assignments for your students</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', backgroundColor: showForm ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
          <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>{showForm ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {/* ============== Create Form ============== */}
      {showForm && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h5 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
            <i className="bi bi-plus-circle me-2" style={{ color: '#6366f1' }}></i>Create New Assignment
          </h5>
          <div className="row g-3">
            {/* Title */}
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Title *</label>
              <input type="text" className="form-control" value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} placeholder="Assignment title" />
            </div>

            {/* Max Points */}
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Max Points</label>
              <input type="number" className="form-control" min="1" value={form.max_points} onChange={(e) => handleFormChange('max_points', e.target.value)} />
            </div>

            {/* Due Date */}
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Due Date</label>
              <input type="date" className="form-control" value={form.due_date} onChange={(e) => handleFormChange('due_date', e.target.value)} />
            </div>

            {/* Submission Type Pills */}
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Submission Type *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUBMISSION_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleFormChange('submission_type', t.value)}
                    style={{
                      padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                      border: form.submission_type === t.value ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                      backgroundColor: form.submission_type === t.value ? `${t.color}15` : '#fff',
                      color: form.submission_type === t.value ? t.color : '#64748b',
                      fontWeight: form.submission_type === t.value ? '600' : '400',
                      fontSize: '13px', transition: 'all 0.2s'
                    }}
                  >
                    <i className={`bi ${t.icon} me-1`}></i>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignment Type + Target selector */}
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Assignment Type *</label>
              <select className="form-select" value={form.assignment_type} onChange={(e) => handleFormChange('assignment_type', e.target.value)}>
                <option value="individual">Individual Student</option>
                <option value="group">Group Class</option>
              </select>
            </div>
            <div className="col-md-3">
              {form.assignment_type === 'individual' ? (
                <>
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Student *</label>
                  <select className="form-select" value={form.student} onChange={(e) => handleFormChange('student', e.target.value)}>
                    <option value="">Select student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.student?.id || s.id}>{s.student?.fullname || s.fullname || `Student #${s.id}`}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Group Class *</label>
                  <select className="form-select" value={form.group_class} onChange={(e) => handleFormChange('group_class', e.target.value)}>
                    <option value="">Select group...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name || `Group #${g.id}`}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Course -> Module -> Lesson drill-down */}
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Course (optional)</label>
              <select className="form-select" value={form.course_id} onChange={(e) => handleFormChange('course_id', e.target.value)}>
                <option value="">Select course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            {modules.length > 0 && (
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Module</label>
                <select className="form-select" onChange={(e) => fetchLessons(e.target.value)}>
                  <option value="">Select module...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
            )}
            {lessons.length > 0 && (
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Lesson</label>
                <select className="form-select" value={form.lesson_id} onChange={(e) => handleFormChange('lesson_id', e.target.value)}>
                  <option value="">Select lesson...</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Description / Instructions</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => handleFormChange('description', e.target.value)} placeholder="Instructions for students..." />
            </div>
          </div>

          {/* ============== MC Questions Builder ============== */}
          {form.submission_type === 'multiple_choice' && (
            <div style={{ marginTop: '20px', padding: '18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h6 style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>
                  <i className="bi bi-list-check me-2" style={{ color: '#3b82f6' }}></i>
                  Multiple Choice Questions ({mcQuestions.length})
                </h6>
                <button onClick={addMcQuestion} type="button" style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <i className="bi bi-plus me-1"></i>Add Question
                </button>
              </div>

              {mcQuestions.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: '16px 0' }}>No questions yet. Click "Add Question" to start building your quiz.</p>
              )}

              {mcQuestions.map((q, qIdx) => (
                <div key={qIdx} style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Question {qIdx + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#64748b' }}>Points:</label>
                      <input type="number" min="1" style={{ width: '60px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} value={q.points} onChange={(e) => updateMcQuestion(qIdx, 'points', parseInt(e.target.value) || 1)} />
                      <button onClick={() => removeMcQuestion(qIdx)} type="button" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <input type="text" className="form-control mb-3" placeholder="Enter question text..." value={q.question_text} onChange={(e) => updateMcQuestion(qIdx, 'question_text', e.target.value)} />

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {OPTION_LETTERS.map((letter, i) => {
                      const fieldName = `option_${letter}`;
                      const isCorrect = q.correct_option === letter;
                      return (
                        <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => updateMcQuestion(qIdx, 'correct_option', letter)}
                            style={{
                              width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${isCorrect ? '#22c55e' : '#e2e8f0'}`,
                              backgroundColor: isCorrect ? '#f0fdf4' : '#fff', color: isCorrect ? '#22c55e' : '#94a3b8',
                              fontWeight: '700', fontSize: '13px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title={isCorrect ? 'Correct answer' : 'Click to set as correct'}
                          >
                            {isCorrect ? <i className="bi bi-check-lg"></i> : letter.toUpperCase()}
                          </button>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={`Option ${letter.toUpperCase()}${i < 2 ? ' (required)' : ' (optional)'}`}
                            value={q[fieldName]}
                            onChange={(e) => updateMcQuestion(qIdx, fieldName, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                    <i className="bi bi-info-circle me-1"></i>Click circle to mark the correct answer. Options A & B are required.
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} type="button" className="btn btn-outline-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} type="button" className="btn btn-primary">
              <i className="bi bi-check-lg me-1"></i>{saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </div>
      )}

      {/* ============== Assignment List ============== */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</div>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <i className="bi bi-journal-plus" style={{ fontSize: '40px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
          <p style={{ color: '#64748b', fontSize: '14px' }}>No assignments created yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {assignments.map(a => {
            const meta = getTypeMeta(a.submission_type);
            const status = a.status || 'assigned';
            const badge = STATUS_BADGES[status] || STATUS_BADGES.assigned;
            return (
              <div key={a.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', borderLeft: `4px solid ${meta.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                      <i className={`bi ${meta.icon} me-2`} style={{ color: meta.color }}></i>
                      {a.display_title || a.title || a.lesson_title || 'Untitled'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {a.student_name && <span><i className="bi bi-person me-1"></i>{a.student_name} &bull; </span>}
                      {a.group_name && <span><i className="bi bi-people me-1"></i>{a.group_name} &bull; </span>}
                      Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No date'} &bull; Max: {a.max_points} pts
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: `${meta.color}15`, color: meta.color }}>
                      <i className={`bi ${meta.icon}`} style={{ fontSize: '10px' }}></i>
                      {meta.label}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: badge.bg, color: badge.color }}>
                      <i className={`bi ${badge.icon}`} style={{ fontSize: '10px' }}></i>
                      {badge.label}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {a.submission_count || 0} submissions
                    </span>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '12px', transition: 'all 0.2s' }}
                      title="Delete assignment"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                {a.description && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569' }}>{a.description}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentCreate;
