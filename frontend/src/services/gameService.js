import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = API_BASE_URL;

export const seedPhase1Games = () => axios.post(`${api}/games/seed-phase1/`);

export const getGames = () => axios.get(`${api}/games/`);

export const getStudentGamesOverview = (studentId) =>
  axios.get(`${api}/student/${studentId}/games/overview/`);

export const getStudentSonaraCoins = (studentId) =>
  axios.get(`${api}/student/${studentId}/games/sonara-coins/`);

export const startGameSession = (studentId, gameType, level = 1) =>
  axios.post(`${api}/student/${studentId}/games/${gameType}/start/`, { level });

export const submitGameAttempt = (sessionId, payload) =>
  axios.post(`${api}/games/session/${sessionId}/attempt/`, payload);

export const finishGameSession = (sessionId, payload = {}) =>
  axios.post(`${api}/games/session/${sessionId}/finish/`, payload);

export const getNextQuestion = (sessionId) =>
  axios.get(`${api}/games/session/${sessionId}/next-question/`);

export const getSessionQuestions = (sessionId) =>
  axios.get(`${api}/games/session/${sessionId}/questions/`);

export const getGameLeaderboard = (gameType) =>
  axios.get(`${api}/games/leaderboard/${gameType}/`);

// ── Teacher endpoints ──
export const getTeacherStudentsGamePerformance = (teacherId, params = {}) => {
  const query = new URLSearchParams();
  if (params.game_type) query.append('game_type', params.game_type);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.dir) query.append('dir', params.dir);
  const qs = query.toString();
  return axios.get(`${api}/teacher/${teacherId}/games/students-performance/${qs ? '?' + qs : ''}`);
};

export const exportTeacherGamePerformanceCSV = (teacherId, params = {}) => {
  const query = new URLSearchParams({ export: 'csv' });
  if (params.game_type) query.append('game_type', params.game_type);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.dir) query.append('dir', params.dir);
  return `${api}/teacher/${teacherId}/games/students-performance/?${query.toString()}`;
};

// ── Admin endpoints ──
export const getAdminGamesAnalytics = () =>
  axios.get(`${api}/admin/games/analytics/`);

export const exportAdminGameStatsCSV = () =>
  `${api}/admin/games/analytics/?export=game_stats_csv`;

export const exportAdminTopStudentsCSV = () =>
  `${api}/admin/games/analytics/?export=top_students_csv`;
