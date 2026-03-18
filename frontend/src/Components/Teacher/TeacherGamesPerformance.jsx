import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  getTeacherStudentsGamePerformance,
  exportTeacherGamePerformanceCSV,
} from '../../services/gameService';
import './TeacherGamesPerformance.css';

/* ─── helpers ─── */
const accuracyColor = (v) => (v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444');
const initials = (name) =>
  (name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const SORT_FIELDS = [
  { key: 'student_name', label: 'Student' },
  { key: 'game_title', label: 'Game' },
  { key: 'total_attempts', label: 'Attempts' },
  { key: 'accuracy_percent', label: 'Accuracy' },
  { key: 'best_score', label: 'Best Score' },
  { key: 'best_streak', label: 'Streak' },
  { key: 'highest_level_unlocked', label: 'Level' },
  { key: 'sonara_coins', label: 'Coins' },
];

const TeacherGamesPerformance = () => {
  const teacherId = localStorage.getItem('teacherId');

  /* ─── state ─── */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('student_name');
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // table | cards

  /* ─── fetch ─── */
  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await getTeacherStudentsGamePerformance(teacherId, {
        game_type: gameFilter,
        search,
        sort: sortBy,
        dir: sortDir,
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load game performance', err);
    }
    setLoading(false);
  }, [teacherId, gameFilter, search, sortBy, sortDir]);

  useEffect(() => {
    document.title = 'LMS | Student Game Performance';
    fetchData();
  }, [fetchData]);

  /* ─── derived ─── */
  const rows = useMemo(() => data?.flat_rows || [], [data]);
  const grouped = useMemo(() => data?.results || [], [data]);
  const games = useMemo(() => data?.available_games || [], [data]);

  const summaryStats = useMemo(() => {
    if (!rows.length) return null;
    const totalAttempts = rows.reduce((s, r) => s + r.total_attempts, 0);
    const totalCoins = rows.reduce((s, r) => s + r.sonara_coins, 0);
    const avgAccuracy =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.accuracy_percent, 0) / rows.length)
        : 0;
    const bestScore = Math.max(...rows.map((r) => r.best_score), 0);
    return {
      totalStudents: data?.total_students || 0,
      totalAttempts,
      avgAccuracy,
      totalCoins,
      bestScore,
    };
  }, [rows, data]);

  /* ─── sort toggle ─── */
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'student_name' || key === 'game_title' ? 'asc' : 'desc');
    }
  };

  const sortArrow = (key) => {
    if (sortBy !== key) return <span className="sort-arrow">↕</span>;
    return <span className="sort-arrow active">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  /* ─── CSV export ─── */
  const handleExport = () => {
    const url = exportTeacherGamePerformanceCSV(teacherId, {
      game_type: gameFilter,
      search,
      sort: sortBy,
      dir: sortDir,
    });
    window.open(url, '_blank');
  };

  /* ═══════════  RENDER  ═══════════ */
  if (loading) {
    return (
      <div className="tgp-container">
        <div className="tgp-loading">
          <div className="tgp-spinner" />
          <span style={{ color: '#6b7280' }}>Loading game performance…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tgp-container">
      {/* ── Header ── */}
      <div className="tgp-header">
        <div>
          <h2>
            🎮 Student <span>Game Performance</span>
          </h2>
          <div className="tgp-header-subtitle">
            Monitor your students' progress across all Sonara games
          </div>
        </div>
        <button className="tgp-export-btn" onClick={handleExport} title="Export as CSV">
          <i className="bi bi-download" /> Export CSV
        </button>
      </div>

      {/* ── Summary Cards ── */}
      {summaryStats && (
        <div className="tgp-summary-row">
          <div className="tgp-summary-card">
            <div className="tgp-summary-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              👥
            </div>
            <div className="value">{summaryStats.totalStudents}</div>
            <div className="label">Students</div>
          </div>
          <div className="tgp-summary-card">
            <div className="tgp-summary-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              🎯
            </div>
            <div className="value">{summaryStats.totalAttempts}</div>
            <div className="label">Total Attempts</div>
          </div>
          <div className="tgp-summary-card">
            <div className="tgp-summary-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              📊
            </div>
            <div className="value">{summaryStats.avgAccuracy}%</div>
            <div className="label">Avg Accuracy</div>
          </div>
          <div className="tgp-summary-card">
            <div className="tgp-summary-icon" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>
              🏆
            </div>
            <div className="value">{summaryStats.bestScore}</div>
            <div className="label">Top Score</div>
          </div>
          <div className="tgp-summary-card">
            <div className="tgp-summary-icon" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
              💰
            </div>
            <div className="value">{summaryStats.totalCoins}</div>
            <div className="label">Coins Earned</div>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="tgp-controls">
        <div className="tgp-search-box">
          <i className="bi bi-search search-icon" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="tgp-filter-select"
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
        >
          <option value="">All Games</option>
          {games.map((g) => (
            <option key={g.game_type} value={g.game_type}>
              {g.title}
            </option>
          ))}
        </select>

        <div className="tgp-view-toggle">
          <button
            className={`tgp-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <i className="bi bi-table me-1" /> Table
          </button>
          <button
            className={`tgp-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <i className="bi bi-grid me-1" /> Cards
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {rows.length === 0 && (
        <div className="tgp-table-wrap">
          <div className="tgp-empty">
            <div className="tgp-empty-icon">🎵</div>
            <h5>No game data yet</h5>
            <p>Your students haven't played any Sonara games yet. Once they start playing, their stats will appear here.</p>
          </div>
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {rows.length > 0 && viewMode === 'table' && (
        <div className="tgp-table-wrap">
          <div className="tgp-table-header">
            <h5>Performance Details</h5>
            <span className="tgp-table-count">{rows.length} records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tgp-table">
              <thead>
                <tr>
                  {SORT_FIELDS.map((f) => (
                    <th key={f.key} onClick={() => toggleSort(f.key)}>
                      {f.label} {sortArrow(f.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.student_id}-${r.game_type}-${i}`}>
                    <td>
                      <span className="tgp-student-name">{r.student_name}</span>
                    </td>
                    <td>
                      <span className={`tgp-game-badge ${r.game_type}`}>{r.game_title}</span>
                    </td>
                    <td>{r.total_attempts}</td>
                    <td>
                      <div className="tgp-accuracy-bar">
                        <div className="tgp-accuracy-track">
                          <div
                            className="tgp-accuracy-fill"
                            style={{
                              width: `${Math.min(r.accuracy_percent, 100)}%`,
                              background: accuracyColor(r.accuracy_percent),
                            }}
                          />
                        </div>
                        <span className="tgp-accuracy-text" style={{ color: accuracyColor(r.accuracy_percent) }}>
                          {r.accuracy_percent}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.best_score}</td>
                    <td>{r.best_streak} 🔥</td>
                    <td>{r.highest_level_unlocked}</td>
                    <td>💰 {r.sonara_coins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {rows.length > 0 && viewMode === 'cards' && (
        <div className="tgp-cards-grid">
          {grouped.map((student) => (
            <div className="tgp-student-card" key={student.student_id}>
              <div className="tgp-student-card-header">
                <div className="tgp-student-avatar">{initials(student.student_name)}</div>
                <div>
                  <div className="name">{student.student_name}</div>
                  <div className="meta">
                    {student.games.length} game{student.games.length !== 1 ? 's' : ''} · 💰{' '}
                    {student.total_coins} coins
                  </div>
                </div>
              </div>
              <div className="tgp-student-card-body">
                {student.games.map((g) => (
                  <div className="tgp-mini-game-row" key={g.game_type}>
                    <span className={`tgp-game-badge ${g.game_type}`}>{g.game_title}</span>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span className="tgp-mini-stat">
                        🎯 <span className="val">{g.accuracy_percent}%</span>
                      </span>
                      <span className="tgp-mini-stat">
                        ⭐ <span className="val">{g.best_score}</span>
                      </span>
                      <span className="tgp-mini-stat">
                        🔥 <span className="val">{g.best_streak}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherGamesPerformance;
