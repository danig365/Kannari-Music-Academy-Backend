import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import Sidebar from './Sidebar';

const StudentAssignments = () => {
  const studentId = localStorage.getItem('studentId');
  const baseUrl = API_BASE_URL;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [forms, setForms] = useState({});

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
    setForms((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [field]: value
      }
    }));
  };

  const submitAssignment = async (assignmentId) => {
    const form = forms[assignmentId] || {};
    if (!form.audio_file) {
      setMessage('Please choose an audio file before submitting.');
      return;
    }

    const payload = new FormData();
    payload.append('audio_file', form.audio_file);
    payload.append('submission_notes', form.submission_notes || '');

    setSubmittingId(assignmentId);
    try {
      await axios.post(
        `${baseUrl}/student/${studentId}/lesson-assignment/${assignmentId}/submit/`,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setMessage('Assignment submitted successfully.');
      setForms((prev) => ({ ...prev, [assignmentId]: {} }));
      await fetchAssignments();
    } catch (error) {
      console.error('Submission failed:', error);
      setMessage(error?.response?.data?.message || 'Failed to submit assignment.');
    }
    setSubmittingId(null);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'No due date';
    return new Date(dateValue).toLocaleDateString();
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
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Submit your assignment audio and view teacher scores.</p>
          </div>

          {message && (
            <div className="alert alert-info" role="alert">
              {message}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#64748b' }}>
              No assignments yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {assignments.map((assignment) => {
                const submission = assignment.submission;
                const isGraded = submission && submission.points_awarded !== null && submission.points_awarded !== undefined;

                return (
                  <div key={assignment.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{assignment.lesson_title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{assignment.school_name} • Due: {formatDate(assignment.due_date)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${isGraded ? 'bg-success' : submission ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {isGraded ? 'Graded' : submission ? 'Submitted' : 'Pending'}
                        </span>
                        <span className="badge bg-info text-dark">Max {assignment.max_points}</span>
                      </div>
                    </div>

                    {assignment.notes && (
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                        {assignment.notes}
                      </div>
                    )}

                    {submission && (
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </div>
                        <audio controls src={submission.audio_file} style={{ width: '100%', height: '36px', marginBottom: submission.teacher_feedback ? '10px' : 0 }} />
                        {isGraded && (
                          <>
                            <div style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
                              Score: {submission.points_awarded} / {assignment.max_points}
                            </div>
                            {submission.teacher_feedback && (
                              <div style={{ fontSize: '13px', color: '#334155' }}>{submission.teacher_feedback}</div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="row g-2">
                      <div className="col-md-5">
                        <input
                          type="file"
                          accept="audio/*"
                          className="form-control"
                          onChange={(e) => handleInputChange(assignment.id, 'audio_file', e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="col-md-5">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Submission notes (optional)"
                          value={(forms[assignment.id] && forms[assignment.id].submission_notes) || ''}
                          onChange={(e) => handleInputChange(assignment.id, 'submission_notes', e.target.value)}
                        />
                      </div>
                      <div className="col-md-2 d-grid">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={submittingId === assignment.id}
                          onClick={() => submitAssignment(assignment.id)}
                        >
                          {submittingId === assignment.id ? 'Saving...' : submission ? 'Resubmit' : 'Submit'}
                        </button>
                      </div>
                    </div>
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