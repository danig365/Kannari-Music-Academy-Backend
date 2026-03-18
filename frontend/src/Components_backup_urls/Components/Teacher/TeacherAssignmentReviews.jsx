import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const STATUS_BADGES = {
  assigned:  { label: 'Assigned',  bg: '#dbeafe', color: '#1d4ed8', icon: 'bi-clipboard' },
  submitted: { label: 'Submitted', bg: '#fef3c7', color: '#92400e', icon: 'bi-check-circle' },
  late:      { label: 'Late',      bg: '#fee2e2', color: '#991b1b', icon: 'bi-clock-history' },
  graded:    { label: 'Graded',    bg: '#dcfce7', color: '#166534', icon: 'bi-award' },
  pending:   { label: 'Pending',   bg: '#fef3c7', color: '#92400e', icon: 'bi-hourglass-split' },
};

const TYPE_META = {
  audio:           { label: 'Audio',           icon: 'bi-mic-fill',                  color: '#8b5cf6' },
  video:           { label: 'Video',           icon: 'bi-camera-video-fill',         color: '#ec4899' },
  file_upload:     { label: 'File Upload',     icon: 'bi-file-earmark-arrow-up-fill',color: '#f59e0b' },
  discussion:      { label: 'Discussion',      icon: 'bi-chat-left-text-fill',       color: '#06b6d4' },
  multiple_choice: { label: 'Multiple Choice', icon: 'bi-list-check',                color: '#3b82f6' },
};

const getTypeMeta = (t) => TYPE_META[t] || TYPE_META.audio;

const TeacherAssignmentReviews = () => {
  const teacherId = localStorage.getItem('teacherId') || localStorage.getItem('teacher_id');

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [grades, setGrades] = useState({});
  const [filter, setFilter] = useState('all'); // all | pending | graded
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    document.title = 'Assignment Reviews | Kannari Music Academy';
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/teacher/${teacherId}/lesson-assignment-submissions/`);
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setMessage('Failed to load submissions.');
    }
    setLoading(false);
  };

  const updateGradeInput = (submissionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: { ...(prev[submissionId] || {}), [field]: value }
    }));
  };

  const saveGrade = async (submission) => {
    const gradeData = grades[submission.id] || {};
    if (gradeData.points_awarded === undefined || gradeData.points_awarded === '') {
      setMessage('Please enter points before saving.');
      return;
    }

    setSavingId(submission.id);
    try {
      await axios.patch(
        `${baseUrl}/teacher/${teacherId}/lesson-assignment-submission/${submission.id}/grade/`,
        { points_awarded: Number(gradeData.points_awarded), teacher_feedback: gradeData.teacher_feedback || '' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage('Grade saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      await fetchSubmissions();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to save grade.');
    }
    setSavingId(null);
  };

  const getStatus = (s) => {
    if (s.points_awarded !== null && s.points_awarded !== undefined) return 'graded';
    return 'submitted';
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'pending') return s.points_awarded === null || s.points_awarded === undefined;
    if (filter === 'graded') return s.points_awarded !== null && s.points_awarded !== undefined;
    return true;
  });

  // Stats
  const pendingCount = submissions.filter(s => s.points_awarded === null || s.points_awarded === undefined).length;
  const gradedCount = submissions.filter(s => s.points_awarded !== null && s.points_awarded !== undefined).length;

  /* ---------- Render submission content by type ---------- */
  const renderSubmissionContent = (submission) => {
    const subType = submission.assignment_submission_type || 'audio';

    return (
      <div style={{ marginBottom: '12px' }}>
        {/* Audio */}
        {subType === 'audio' && submission.audio_file && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}><i className="bi bi-mic me-1"></i>Audio Recording</div>
            <audio controls src={submission.audio_file} style={{ width: '100%', height: '40px' }} />
          </div>
        )}

        {/* Video */}
        {subType === 'video' && submission.video_file && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}><i className="bi bi-camera-video me-1"></i>Video Recording</div>
            <video controls src={submission.video_file} style={{ width: '100%', maxHeight: '300px', borderRadius: '8px', backgroundColor: '#000' }} />
          </div>
        )}

        {/* File upload */}
        {subType === 'file_upload' && submission.file && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}><i className="bi bi-file-earmark me-1"></i>Uploaded File</div>
            <a href={submission.file} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#2563eb', fontWeight: '600', fontSize: '13px', textDecoration: 'none', border: '1px solid #bfdbfe' }}>
              <i className="bi bi-file-earmark-arrow-down" style={{ fontSize: '18px' }}></i>
              Download Submission
            </a>
          </div>
        )}

        {/* Discussion / Text */}
        {subType === 'discussion' && submission.text_content && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}><i className="bi bi-chat-left-text me-1"></i>Discussion Response</div>
            <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {submission.text_content}
            </div>
          </div>
        )}

        {/* Multiple Choice - Auto-graded summary */}
        {subType === 'multiple_choice' && (
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}><i className="bi bi-list-check me-1"></i>Multiple Choice (Auto-Graded)</div>
            {submission.text_content && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                <i className="bi bi-check-circle-fill"></i>
                {submission.text_content}
              </div>
            )}
          </div>
        )}

        {/* Fallback: if no content matches specific type */}
        {!submission.audio_file && !submission.video_file && !submission.file && !submission.text_content && subType !== 'multiple_choice' && (
          <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
            <i className="bi bi-exclamation-triangle me-1"></i>No submission content found.
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>
          <i className="bi bi-journal-check me-2"></i>Assignment Reviews
        </h2>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Review all submission types, grade with points and feedback.</p>
      </div>

      {message && (
        <div className="alert alert-info alert-dismissible fade show">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Filter tabs + stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all', label: `All (${submissions.length})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'graded', label: `Graded (${gradedCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              border: filter === tab.key ? '2px solid #6366f1' : '1px solid #e2e8f0',
              backgroundColor: filter === tab.key ? '#eef2ff' : '#fff',
              color: filter === tab.key ? '#4f46e5' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>Loading submissions...</div>
      ) : filteredSubmissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
          <i className="bi bi-inbox" style={{ fontSize: '40px', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}></i>
          {submissions.length > 0 ? 'No submissions match your filter.' : 'No student submissions yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {filteredSubmissions.map(submission => {
            const maxPoints = submission.assignment_max_points || 100;
            const status = getStatus(submission);
            const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.submitted;
            const subType = submission.assignment_submission_type || 'audio';
            const typeMeta = getTypeMeta(subType);
            const isExpanded = expandedId === submission.id;

            const initialPoints = grades[submission.id]?.points_awarded !== undefined
              ? grades[submission.id].points_awarded
              : (submission.points_awarded ?? '');
            const initialFeedback = grades[submission.id]?.teacher_feedback !== undefined
              ? grades[submission.id].teacher_feedback
              : (submission.teacher_feedback || '');

            return (
              <div key={submission.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', borderLeft: `4px solid ${typeMeta.color}` }}>
                {/* Header */}
                <div
                  style={{ padding: '16px 18px', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`bi ${typeMeta.icon}`} style={{ color: typeMeta.color }}></i>
                        {submission.assignment_title || submission.assignment_lesson_title || 'Assignment'}
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '12px', color: '#94a3b8' }}></i>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        <i className="bi bi-person me-1"></i>{submission.student_name}
                        &nbsp;&bull;&nbsp;{new Date(submission.submitted_at).toLocaleString()}
                        {submission.graded_at && <span> &bull; Graded: {new Date(submission.graded_at).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: `${typeMeta.color}15`, color: typeMeta.color }}>
                        <i className={`bi ${typeMeta.icon}`} style={{ fontSize: '10px' }}></i>
                        {typeMeta.label}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                        <i className={`bi ${statusBadge.icon}`} style={{ fontSize: '10px' }}></i>
                        {statusBadge.label}
                      </span>
                      {status === 'graded' && (
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: '#f0fdf4', color: '#166534' }}>
                          {submission.points_awarded}/{maxPoints}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ marginTop: '14px' }}>
                      {/* Submission content (audio / video / file / text / MC) */}
                      {renderSubmissionContent(submission)}

                      {/* Submission notes */}
                      {submission.submission_notes && submission.submission_notes !== 'Auto-graded multiple choice' && (
                        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                          <i className="bi bi-sticky me-1"></i>{submission.submission_notes}
                        </div>
                      )}

                      {/* Already graded info */}
                      {status === 'graded' && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
                          <div style={{ fontWeight: '600', color: '#166534', fontSize: '15px', marginBottom: '4px' }}>
                            <i className="bi bi-award me-1"></i>Score: {submission.points_awarded} / {maxPoints}
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
                              ({Math.round((submission.points_awarded / maxPoints) * 100)}%)
                            </span>
                          </div>
                          {submission.teacher_feedback && (
                            <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
                              <i className="bi bi-chat-left-quote me-1"></i>{submission.teacher_feedback}
                            </div>
                          )}
                          {submission.graded_by_name && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              Graded by {submission.graded_by_name}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grade form */}
                      <div style={{ padding: '14px', backgroundColor: '#fafafa', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                          {status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                        </div>
                        <div className="row g-2 align-items-center">
                          <div className="col-md-2">
                            <input
                              type="number" min="0" max={maxPoints}
                              className="form-control" placeholder="Points"
                              value={initialPoints}
                              onChange={(e) => updateGradeInput(submission.id, 'points_awarded', e.target.value)}
                            />
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>/ {maxPoints}</div>
                          </div>
                          <div className="col-md-8">
                            <input
                              type="text" className="form-control" placeholder="Feedback for student..."
                              value={initialFeedback}
                              onChange={(e) => updateGradeInput(submission.id, 'teacher_feedback', e.target.value)}
                            />
                          </div>
                          <div className="col-md-2 d-grid">
                            <button
                              type="button" className="btn btn-primary"
                              disabled={savingId === submission.id}
                              onClick={() => saveGrade(submission)}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              {savingId === submission.id ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentReviews;
