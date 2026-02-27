import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const TeacherAssignmentReviews = () => {
  const teacherId = localStorage.getItem('teacherId');
  const baseUrl = API_BASE_URL;

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [grades, setGrades] = useState({});

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
    setGrades((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [field]: value
      }
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
        {
          points_awarded: Number(gradeData.points_awarded),
          teacher_feedback: gradeData.teacher_feedback || ''
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage('Grade saved.');
      await fetchSubmissions();
    } catch (error) {
      console.error('Failed to save grade:', error);
      setMessage(error?.response?.data?.message || 'Failed to save grade.');
    }
    setSavingId(null);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1050px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Assignment Reviews</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Listen to student audio submissions and grade with points.</p>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
          No student submissions yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {submissions.map((submission) => {
            const maxPoints = submission.assignment_max_points || 100;
            const initialPoints = grades[submission.id]?.points_awarded !== undefined
              ? grades[submission.id].points_awarded
              : (submission.points_awarded ?? '');
            const initialFeedback = grades[submission.id]?.teacher_feedback !== undefined
              ? grades[submission.id].teacher_feedback
              : (submission.teacher_feedback || '');

            return (
              <div key={submission.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{submission.assignment_lesson_title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Student: {submission.student_name} • Submitted: {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`badge ${submission.points_awarded !== null && submission.points_awarded !== undefined ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {submission.points_awarded !== null && submission.points_awarded !== undefined ? 'Graded' : 'Pending'}
                  </span>
                </div>

                <audio controls src={submission.audio_file} style={{ width: '100%', height: '36px', marginBottom: '12px' }} />

                {submission.submission_notes && (
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                    {submission.submission_notes}
                  </div>
                )}

                <div className="row g-2 align-items-center">
                  <div className="col-md-2">
                    <input
                      type="number"
                      min="0"
                      max={maxPoints}
                      className="form-control"
                      placeholder="Points"
                      value={initialPoints}
                      onChange={(e) => updateGradeInput(submission.id, 'points_awarded', e.target.value)}
                    />
                  </div>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Feedback"
                      value={initialFeedback}
                      onChange={(e) => updateGradeInput(submission.id, 'teacher_feedback', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 d-grid">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={savingId === submission.id}
                      onClick={() => saveGrade(submission)}
                    >
                      {savingId === submission.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>Max points: {maxPoints}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentReviews;
