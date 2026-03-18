import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = API_BASE_URL;

// ==================== TEXT MESSAGING ====================

export const getConversation = (parentLinkId) =>
  axios.get(`${api}/messages/conversation/${parentLinkId}/`);

export const getDirectConversation = (teacherStudentId) =>
  axios.get(`${api}/messages/direct-conversation/${teacherStudentId}/`);

export const sendMessage = (payload) =>
  axios.post(`${api}/messages/send/`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

export const markMessagesRead = (parentLinkId, readerType, readerId) =>
  axios.post(`${api}/messages/mark-read/${parentLinkId}/`, 
    JSON.stringify({ reader_type: readerType, reader_id: readerId }),
    { headers: { 'Content-Type': 'application/json' } }
  );

export const markDirectMessagesRead = (teacherStudentId, readerType, readerId) =>
  axios.post(`${api}/messages/mark-read-direct/${teacherStudentId}/`,
    JSON.stringify({ reader_type: readerType, reader_id: readerId }),
    { headers: { 'Content-Type': 'application/json' } }
  );

export const getUnreadMessageCount = (userType, userId) =>
  axios.get(`${api}/messages/unread-count/?user_type=${userType}&user_id=${userId}`);

export const getStudentTeacherConversations = (studentId) =>
  axios.get(`${api}/student/${studentId}/teacher-conversations/`);

// ==================== CHAT LOCK / UNLOCK ====================

export const getChatLockStatus = (parentLinkId) =>
  axios.get(`${api}/chat-lock-status/${parentLinkId}/`);

export const adminToggleChatLock = (parentLinkId, payload) =>
  axios.post(`${api}/admin/chat-lock/${parentLinkId}/toggle/`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

export const getChatLockPolicies = (params = '') =>
  axios.get(`${api}/chat-lock-policies/${params}`);

// ==================== TEACHER OFFICE HOURS ====================

export const getTeacherOfficeHours = (teacherId) =>
  axios.get(`${api}/teacher/${teacherId}/office-hours/`);

export const createTeacherOfficeHours = (teacherId, data) =>
  axios.post(`${api}/teacher/${teacherId}/office-hours/`, data);

export const updateTeacherOfficeHours = (id, data) =>
  axios.put(`${api}/office-hours/${id}/`, data);

export const deleteTeacherOfficeHours = (id) =>
  axios.delete(`${api}/office-hours/${id}/`);

// ==================== GROUP MESSAGES ====================

export const getGroupMessages = (groupId) =>
  axios.get(`${api}/group/${groupId}/messages/`);

export const sendGroupMessage = (groupId, data) =>
  axios.post(`${api}/group/${groupId}/messages/`, data);

export const toggleGroupMessagePin = (messageId) =>
  axios.post(`${api}/group-message/${messageId}/toggle-pin/`);

export const hideGroupMessage = (messageId) =>
  axios.post(`${api}/group-message/${messageId}/hide/`);

// ==================== GROUP ANNOUNCEMENTS ====================

export const getGroupAnnouncements = (groupId) =>
  axios.get(`${api}/group/${groupId}/announcements/`);

export const createGroupAnnouncement = (groupId, data) =>
  axios.post(`${api}/group/${groupId}/announcements/`, data);

export const updateGroupAnnouncement = (id, data) =>
  axios.put(`${api}/group-announcement/${id}/`, data);

export const deleteGroupAnnouncement = (id) =>
  axios.delete(`${api}/group-announcement/${id}/`);

// ==================== GROUP RESOURCES ====================

export const getGroupResources = (groupId) =>
  axios.get(`${api}/group/${groupId}/resources/`);

export const uploadGroupResource = (groupId, formData) =>
  axios.post(`${api}/group/${groupId}/resources/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteGroupResource = (id) =>
  axios.delete(`${api}/group-resource/${id}/`);

export const downloadGroupResource = (resourceId) =>
  axios.post(`${api}/group-resource/${resourceId}/download/`);

// ==================== GROUP SESSIONS ====================

export const getGroupSessions = (groupId, status = '') =>
  axios.get(`${api}/group/${groupId}/sessions/${status ? `?status=${status}` : ''}`);

export const createGroupSession = (groupId, data) =>
  axios.post(`${api}/group/${groupId}/sessions/`, data);

export const updateGroupSession = (id, data) =>
  axios.put(`${api}/group-session/${id}/`, data);

export const deleteGroupSession = (id) =>
  axios.delete(`${api}/group-session/${id}/`);

export const groupSessionGoLive = (sessionId) =>
  axios.post(`${api}/group-session/${sessionId}/go-live/`);

export const groupSessionEnd = (sessionId) =>
  axios.post(`${api}/group-session/${sessionId}/end/`);

export const groupSessionJoin = (sessionId, studentId) =>
  axios.post(`${api}/group-session/${sessionId}/join/${studentId}/`);

export const groupSessionLeave = (sessionId, logId) =>
  axios.post(`${api}/group-session/${sessionId}/leave/${logId}/`);

export const getGroupSessionParticipants = (sessionId) =>
  axios.get(`${api}/group-session/${sessionId}/participants/`);

// ==================== DISCUSSION THREADS ====================

export const getDiscussionThreads = (assignmentId) =>
  axios.get(`${api}/assignment/${assignmentId}/discussions/`);

export const createDiscussionPost = (assignmentId, data) =>
  axios.post(`${api}/assignment/${assignmentId}/discussions/`, data);

export const updateDiscussionPost = (id, data) =>
  axios.put(`${api}/discussion/${id}/`, data);

export const deleteDiscussionPost = (id) =>
  axios.delete(`${api}/discussion/${id}/`);

// ==================== MULTIPLE CHOICE ====================

export const getMCQuestions = (assignmentId) =>
  axios.get(`${api}/assignment/${assignmentId}/mc-questions/`);

export const createMCQuestion = (assignmentId, data) =>
  axios.post(`${api}/assignment/${assignmentId}/mc-questions/`, data);

export const updateMCQuestion = (id, data) =>
  axios.put(`${api}/mc-question/${id}/`, data);

export const deleteMCQuestion = (id) =>
  axios.delete(`${api}/mc-question/${id}/`);

export const submitMCAnswers = (assignmentId, studentId, answers) =>
  axios.post(`${api}/assignment/${assignmentId}/mc-submit/${studentId}/`, 
    JSON.stringify({ answers }),
    { headers: { 'Content-Type': 'application/json' } }
  );

// ==================== TEACHER ASSIGNMENTS ====================

export const getTeacherAssignments = (teacherId) =>
  axios.get(`${api}/teacher/${teacherId}/assignments/`);

export const createTeacherAssignment = (teacherId, data) =>
  axios.post(`${api}/teacher/${teacherId}/assignments/`, data);

// ==================== PARENT POLICY ====================

export const getParentPolicyStatus = (parentId) =>
  axios.get(`${api}/parent/${parentId}/policy-status/`);

export const acceptParentPolicy = (parentId, data) =>
  axios.post(`${api}/parent/${parentId}/policy-acceptances/`, data);
