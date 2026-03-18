import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';

const baseUrl = API_BASE_URL;

const STATUS_BADGES = {
  assigned:  { label: 'Assigned',  bg: '#dbeafe', color: '#1d4ed8', icon: 'bi-clipboard' },
  submitted: { label: 'Submitted', bg: '#fef3c7', color: '#92400e', icon: 'bi-check-circle' },
  late:      { label: 'Late',      bg: '#fee2e2', color: '#991b1b', icon: 'bi-clock-history' },
  graded:    { label: 'Graded',    bg: '#dcfce7', color: '#166534', icon: 'bi-award' },
};

const TYPE_META = {
  audio:           { label: 'Audio',           icon: 'bi-mic-fill',                  color: '#8b5cf6' },
  video:           { label: 'Video',           icon: 'bi-camera-video-fill',         color: '#ec4899' },
  file_upload:     { label: 'File Upload',     icon: 'bi-file-earmark-arrow-up-fill',color: '#f59e0b' },
  discussion:      { label: 'Discussion',      icon: 'bi-chat-left-text-fill',       color: '#06b6d4' },
  multiple_choice: { label: 'Multiple Choice', icon: 'bi-list-check',                color: '#3b82f6' },
};

const getTypeMeta = (t) => TYPE_META[t] || TYPE_META.audio;

const MC_OPTIONS = [
  { key: 'option_a', letter: 'a', label: 'A' },
  { key: 'option_b', letter: 'b', label: 'B' },
  { key: 'option_c', letter: 'c', label: 'C' },
  { key: 'option_d', letter: 'd', label: 'D' },
];

const StudentAssignments = () => {
  const studentId = localStorage.getItem('studentId');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [forms, setForms] = useState({});
  const [mcAnswers, setMcAnswers] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.title = 'My Assignments | Kannari Music Academy';
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/student/${studentId}/lesson-assignments/`);
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setMessage('Failed to load assignments.');
    }
    setLoading(false);
  };

  const handleInputChange = (assignmentId, field, value) => {
    setForms(prev => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [field]: value }
    }));
  };

  const handleMcAnswer = (assignmentId, questionId, letter) => {
    setMcAnswers(prev => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [questionId]: letter }
    }));
  };

  const submitAssignment = async (assignment) => {
    const form = forms[assignment.id] || {};
    const subType = assignment.submission_type || 'audio';

    // MC submit uses a different endpoint
    if (subType === 'multiple_choice') {
      const answers = mcAnswers[assignment.id] || {};
      const questions = assignment.mc_questions || [];
      if (questions.length > 0 && Object.keys(answers).length < questions.length) {
        setMessage('Please answer all questions.'); return;
      }
      setSubmittingId(assignment.id);
      try {
        const answerList = Object.entries(answers).map(([qId, letter]) => ({
          question_id: parseInt(qId),
          selected_option: letter
        }));
        const res = await axios.post(
          `${baseUrl}/assignment/${assignment.id}/mc-submit/${studentId}/`,
          { answers: answerList },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const data = res.data;
        Swal.fire({
          icon: 'success',
          title: 'Submitted!',
          html: `Score: <strong>${data.earned_points || 0}/${data.total_points || 0}</strong>`,
          timer: 3000
        });
        setForms(prev => ({ ...prev, [assignment.id]: {} }));
        setMcAnswers(prev => ({ ...prev, [assignment.id]: {} }));
        await fetchAssignments();
      } catch (error) {
        setMessage(error?.response?.data?.error || 'Failed to submit answers.');
      }
      setSubmittingId(null);
      return;
    }

    // File-based / text submission
    const payload = new FormData();
    payload.append('submission_notes', form.submission_notes || '');

    if (subType === 'audio') {
      if (!form.audio_file) { setMessage('Please choose an audio file.'); return; }
      payload.append('audio_file', form.audio_file);
    } else if (subType === 'video') {
      if (!form.video_file) { setMessage('Please choose a video file.'); return; }
      payload.append('video_file', form.video_file);
    } else if (subType === 'file_upload') {
      if (!form.file) { setMessage('Please choose a file to upload.'); return; }
      payload.append('file', form.file);
    } else if (subType === 'discussion') {
      if (!form.text_content?.trim()) { setMessage('Please enter your response.'); return; }
      payload.append('text_content', form.text_content);
    }

    setSubmittingId(assignment.id);
    try {
      await axios.post(
        `${baseUrl}/student/${studentId}/lesson-assignment/${assignment.id}/submit/`,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      Swal.fire({ icon: 'success', title: 'Submitted!', text: 'Your assignment has been submitted.', timer: 2000 });
      setForms(prev => ({ ...prev, [assignment.id]: {} }));
      await fetchAssignments();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to submit assignment.');
    }
    setSubmittingId(null);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'No due date';

  /* ---------- MC Question rendering (option_a / b / c / d format) ---------- */
  const renderMcQuiz = (assignment) => {
    const questions = assignment.mc_questions || [];
    const answers = mcAnswers[assignment.id] || {};
    const hasStudentAnswers = questions.some(q => q.student_answer);

    if (questions.length === 0) return <p style={{ color: '#64748b', fontSize: '13px' }}>No questions available yet.</p>;

    return (
      <div style={{ marginTop: '12px' }}>
        {questions.map((q, idx) => {
          const studentAnswer = q.student_answer;
          const alreadyAnswered = !!studentAnswer;
          return (
            <div key={q.id} style={{ marginBottom: '16px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', marginBottom: '10px' }}>
                Q{idx + 1}. {q.question_text}
                {q.points > 1 && <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>({q.points} pts)</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {MC_OPTIONS.map(opt => {
                  const text = q[opt.key];
                  if (!text) return null;
                  const isSelected = alreadyAnswered ? studentAnswer?.selected_option === opt.letter : answers[q.id] === opt.letter;
                  const isCorrect = alreadyAnswered && studentAnswer?.is_correct !== undefined && q.correct_option === opt.letter;
                  const wasWrong = alreadyAnswered && studentAnswer?.selected_option === opt.letter && !studentAnswer?.is_correct;

                  let borderColor = '#e2e8f0';
                  let bgColor = '#fff';
                  if (alreadyAnswered) {
                    if (isCorrect) { borderColor = '#22c55e'; bgColor = '#f0fdf4'; }
                    else if (wasWrong) { borderColor = '#ef4444'; bgColor = '#fef2f2'; }
                  } else if (isSelected) {
                    borderColor = '#3b82f6'; bgColor = '#eff6ff';
                  }

                  return (
                    <label key={opt.letter} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: `2px solid ${borderColor}`, backgroundColor: bgColor, cursor: alreadyAnswered ? 'default' : 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
                      <input
                        type="radio"
                        name={`q_${assignment.id}_${q.id}`}
                        checked={isSelected}
                        onChange={() => !alreadyAnswered && handleMcAnswer(assignment.id, q.id, opt.letter)}
                        disabled={alreadyAnswered}
                        style={{ accentColor: '#3b82f6' }}
                      />
                      <span style={{ fontWeight: '600', color: '#94a3b8', marginRight: '4px' }}>{opt.label}.</span>
                      {text}
                      {alreadyAnswered && isCorrect && <i className="bi bi-check-circle-fill ms-auto" style={{ color: '#22c55e' }}></i>}
                      {wasWrong && <i className="bi bi-x-circle-fill ms-auto" style={{ color: '#ef4444' }}></i>}
                    </label>
                  );
                })}
              </div>
              {alreadyAnswered && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: studentAnswer.is_correct ? '#166534' : '#991b1b' }}>
                  {studentAnswer.is_correct ? 'Correct!' : 'Incorrect'}
                </div>
              )}
            </div>
          );
        })}

        {!hasStudentAnswers && (
          <div className="d-grid" style={{ maxWidth: '200px' }}>
            <button type="button" className="btn btn-primary" disabled={submittingId === assignment.id} onClick={() => submitAssignment(assignment)}>
              {submittingId === assignment.id ? 'Saving...' : 'Submit Answers'}
            </button>
          </div>
        )}

        {hasStudentAnswers && (
          <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>
            <i className="bi bi-check-circle me-1"></i>Answers submitted and auto-graded.
          </div>
        )}
      </div>
    );
  };

  /* ---------- Non-MC submission form ---------- */
  const renderSubmissionForm = (assignment) => {
    const form = forms[assignment.id] || {};
    const subType = assignment.submission_type || 'audio';

    return (
      <div className="row g-2" style={{ marginTop: '8px' }}>
        <div className="col-md-5">
          {subType === 'audio' && <input type="file" accept="audio/*" className="form-control" onChange={(e) => handleInputChange(assignment.id, 'audio_file', e.target.files?.[0])} />}
          {subType === 'video' && <input type="file" accept="video/*" className="form-control" onChange={(e) => handleInputChange(assignment.id, 'video_file', e.target.files?.[0])} />}
          {subType === 'file_upload' && <input type="file" className="form-control" onChange={(e) => handleInputChange(assignment.id, 'file', e.target.files?.[0])} />}
          {subType === 'discussion' && (
            <textarea className="form-control" placeholder="Share your thoughts..." rows={3} value={form.text_content || ''} onChange={(e) => handleInputChange(assignment.id, 'text_content', e.target.value)} />
          )}
        </div>
        <div className="col-md-5">
          <input type="text" className="form-control" placeholder="Submission notes (optional)" value={form.submission_notes || ''} onChange={(e) => handleInputChange(assignment.id, 'submission_notes', e.target.value)} />
        </div>
        <div className="col-md-2 d-grid">
          <button type="button" className="btn btn-primary" disabled={submittingId === assignment.id} onClick={() => submitAssignment(assignment)}>
            {submittingId === assignment.id ? 'Saving...' : assignment.submission ? 'Resubmit' : 'Submit'}
          </button>
        </div>
      </div>
    );
  };

  /* ---------- Previous submission preview ---------- */
  const renderSubmissionPreview = (submission, assignment) => {
    const subType = assignment.submission_type || 'audio';
    const isGraded = submission.points_awarded !== null && submission.points_awarded !== undefined;

    return (
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
          Submitted: {new Date(submission.submitted_at).toLocaleString()}
        </div>

        {subType === 'audio' && submission.audio_file && (
          <audio controls src={submission.audio_file} style={{ width: '100%', height: '36px', marginBottom: '8px' }} />
        )}
        {subType === 'video' && submission.video_file && (
          <video controls src={submission.video_file} style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '8px' }} />
        )}
        {subType === 'file_upload' && submission.file && (
          <a href={submission.file} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#2563eb', fontSize: '13px', textDecoration: 'none', marginBottom: '8px' }}>
            <i className="bi bi-file-earmark-arrow-down"></i> Download submitted file
          </a>
        )}
        {subType === 'discussion' && submission.text_content && (
          <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
            {submission.text_content}
          </div>
        )}

        {isGraded && (
          <div style={{ marginTop: '6px' }}>
            <div style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
              <i className="bi bi-award me-1"></i>Score: {submission.points_awarded} / {assignment.max_points}
            </div>
            {submission.teacher_feedback && (
              <div style={{ fontSize: '13px', color: '#334155', padding: '8px 10px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <i className="bi bi-chat-left-quote me-1"></i>{submission.teacher_feedback}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ---------- Status badge component ---------- */
  const StatusBadge = ({ assignment }) => {
    const status = assignment.computed_status || (assignment.submission ? (assignment.submission.points_awarded != null ? 'graded' : 'submitted') : 'assigned');
    const badge = STATUS_BADGES[status] || STATUS_BADGES.assigned;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}>
        <i className={`bi ${badge.icon}`} style={{ fontSize: '10px' }}></i>
        {badge.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      {isMobile && sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', display: isMobile ? 'block' : 'none' }}>
            <i className="bi bi-list"></i>
          </button>
          <span style={{ fontWeight: '600', color: '#1e293b', marginLeft: '8px' }}>Kannari Music Academy</span>
        </div>

        <div style={{ padding: '32px', maxWidth: '980px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>My Assignments</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Submit assignments in multiple formats and view teacher scores.</p>
          </div>

          {message && (
            <div className="alert alert-info alert-dismissible fade show" role="alert">
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
              <i className="bi bi-journal-text" style={{ fontSize: '40px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
              No assignments yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {assignments.map(assignment => {
                const submission = assignment.submission;
                const subType = assignment.submission_type || 'audio';
                const meta = getTypeMeta(subType);
                const isExpanded = expandedId === assignment.id;

                return (
                  <div key={assignment.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', borderLeft: `4px solid ${meta.color}` }}>
                    {/* Header - always visible */}
                    <div
                      style={{ padding: '16px 18px', cursor: 'pointer' }}
                      onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className={`bi ${meta.icon}`} style={{ color: meta.color }}></i>
                            {assignment.display_title || assignment.lesson_title}
                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '12px', color: '#94a3b8' }}></i>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {assignment.teacher_name && <span>{assignment.teacher_name} &bull; </span>}
                            {assignment.school_name && <span>{assignment.school_name} &bull; </span>}
                            Due: {formatDate(assignment.due_date)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: meta.color + '15', color: meta.color, border: `1px solid ${meta.color}30` }}>
                            {meta.label}
                          </span>
                          <StatusBadge assignment={assignment} />
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569' }}>
                            Max {assignment.max_points}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
                        {/* Description */}
                        {(assignment.description || assignment.notes) && (
                          <div style={{ fontSize: '13px', color: '#475569', margin: '12px 0', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            {assignment.description || assignment.notes}
                          </div>
                        )}

                        {/* Existing submission */}
                        {submission && subType !== 'multiple_choice' && renderSubmissionPreview(submission, assignment)}

                        {/* Submission form */}
                        {subType === 'multiple_choice' ? renderMcQuiz(assignment) : renderSubmissionForm(assignment)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
