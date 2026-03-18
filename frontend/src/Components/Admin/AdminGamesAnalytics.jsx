import React, { useEffect, useState, useMemo } from 'react';
import {
  getAdminGamesAnalytics,
  exportAdminGameStatsCSV,
  exportAdminTopStudentsCSV,
} from '../../services/gameService';
import './AdminGamesAnalytics.css';

/* ─── helpers ─── */
const GAME_ICONS = { note_ninja: '🎵', rhythm_rush: '🥁', music_challenge: '⚡' };
const GAME_COLORS = {
  note_ninja: { bg: 'rgba(99,102,241,0.12)', fg: '#6366f1' },
  rhythm_rush: { bg: 'rgba(236,72,153,0.12)', fg: '#ec4899' },
  music_challenge: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b' },
};
const BADGE_ICONS = { note_master: '🎵', rhythm_king: '🥁', theory_champion: '⚡' };
const rankClass = (i) => (i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal');

const AdminGamesAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Admin | Games Analytics';
    (async () => {
      try {
        const res = await getAdminGamesAnalytics();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load games analytics', err);
      }
      setLoading(false);
    })();
  }, []);

  /* derived */
  const totals = useMemo(() => data?.platform_totals || {}, [data]);
  const gameStats = useMemo(() => data?.game_stats || [], [data]);
  const topStudents = useMemo(() => data?.top_students || [], [data]);
  const badgeDist = useMemo(() => data?.badge_distribution || [], [data]);
  const dailySessions = useMemo(() => data?.daily_sessions || [], [data]);
  const maxDaily = useMemo(
    () => Math.max(...dailySessions.map((d) => d.count), 1),
    [dailySessions]
  );

  /* ═══════════  RENDER  ═══════════ */
  if (loading) {
    return (
      <div className="aga-container">
        <div className="aga-loading">
          <div className="aga-spinner" />
          <span style={{ color: '#6b7280' }}>Loading analytics…</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aga-container">
        <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
          Unable to load analytics data.
        </p>
      </div>
    );
  }

  return (
    <div className="aga-container">
      {/* ── Header ── */}
      <div className="aga-header">
        <div>
          <h2>
            📊 Games <span>Analytics</span>
          </h2>
          <div className="aga-header-subtitle">
            Platform-wide game performance, engagement & badge insights
          </div>
        </div>
        <div className="aga-export-group">
          <a
            className="aga-export-btn"
            href={exportAdminGameStatsCSV()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-download" /> Game Stats CSV
          </a>
          <a
            className="aga-export-btn secondary"
            href={exportAdminTopStudentsCSV()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-download" /> Top Students CSV
          </a>
        </div>
      </div>

      {/* ── Platform Totals ── */}
      <div className="aga-totals-row">
        <div className="aga-total-card">
          <div className="aga-total-icon" style={{ background: 'rgba(66,133,244,0.12)', color: '#4285f4' }}>
            👥
          </div>
          <div>
            <div className="value">{totals.total_players || 0}</div>
            <div className="label">Total Players</div>
          </div>
        </div>
        <div className="aga-total-card">
          <div className="aga-total-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            🎮
          </div>
          <div>
            <div className="value">{totals.total_sessions || 0}</div>
            <div className="label">Total Sessions</div>
          </div>
        </div>
        <div className="aga-total-card">
          <div className="aga-total-icon" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>
            💰
          </div>
          <div>
            <div className="value">{totals.total_coins_issued || 0}</div>
            <div className="label">Coins Issued</div>
          </div>
        </div>
        <div className="aga-total-card">
          <div className="aga-total-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            🏅
          </div>
          <div>
            <div className="value">{data.total_badges_awarded || 0}</div>
            <div className="label">Badges Awarded</div>
          </div>
        </div>
      </div>

      {/* ── Per-Game Breakdown ── */}
      <div className="aga-section-title">🎯 Per-Game Breakdown</div>
      <div className="aga-game-cards-row">
        {gameStats.map((g) => {
          const gc = GAME_COLORS[g.game_type] || { bg: '#f3f4f6', fg: '#6b7280' };
          return (
            <div className="aga-game-card" key={g.game_type}>
              <div className={`aga-game-card-stripe ${g.game_type}`} />
              <div className="aga-game-card-body">
                <div className="title">
                  <div className="aga-game-type-icon" style={{ background: gc.bg, color: gc.fg }}>
                    {GAME_ICONS[g.game_type] || '🎮'}
                  </div>
                  {g.title}
                </div>
                <div className="aga-game-stats-grid">
                  <div className="aga-game-stat">
                    <span className="stat-label">Players</span>
                    <span className="stat-value accent-blue">{g.players}</span>
                  </div>
                  <div className="aga-game-stat">
                    <span className="stat-label">Sessions</span>
                    <span className="stat-value">
                      {g.sessions}{' '}
                      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>
                        ({g.completed_sessions} done)
                      </span>
                    </span>
                  </div>
                  <div className="aga-game-stat">
                    <span className="stat-label">Avg Score</span>
                    <span className="stat-value accent-green">{g.avg_score}</span>
                  </div>
                  <div className="aga-game-stat">
                    <span className="stat-label">Avg Accuracy</span>
                    <div className="aga-accuracy-mini">
                      <div
                        className="aga-donut-ring"
                        style={{
                          background: `conic-gradient(${gc.fg} ${g.avg_accuracy_percent * 3.6}deg, #e5e7eb 0deg)`,
                          color: gc.fg,
                        }}
                      >
                        <span
                          style={{
                            background: '#fff',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {Math.round(g.avg_accuracy_percent)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="aga-game-stat">
                    <span className="stat-label">Coins Issued</span>
                    <span className="stat-value accent-amber">💰 {g.coins_issued}</span>
                  </div>
                  <div className="aga-game-stat">
                    <span className="stat-label">Total Time</span>
                    <span className="stat-value" style={{ fontSize: 16 }}>
                      {g.total_time_seconds >= 3600
                        ? `${Math.floor(g.total_time_seconds / 3600)}h ${Math.floor((g.total_time_seconds % 3600) / 60)}m`
                        : g.total_time_seconds >= 60
                        ? `${Math.floor(g.total_time_seconds / 60)}m ${g.total_time_seconds % 60}s`
                        : `${g.total_time_seconds}s`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Engagement Chart ── */}
      {dailySessions.length > 0 && (
        <div className="aga-chart-container">
          <div className="aga-section-title">📈 Daily Sessions (Last 30 Days)</div>
          <div className="aga-chart-panel">
            <div className="aga-chart-bars">
              {dailySessions.map((d) => (
                <div className="aga-chart-bar-col" key={d.day}>
                  <div
                    className="aga-chart-bar"
                    style={{ height: `${(d.count / maxDaily) * 100}%` }}
                    title={`${d.day}: ${d.count} sessions`}
                  >
                    <span className="aga-chart-bar-value">{d.count}</span>
                  </div>
                  <span className="aga-chart-bar-label">
                    {new Date(d.day + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Two-Column: Top Students + Badge Distribution ── */}
      <div className="aga-two-col">
        {/* Top Students */}
        <div className="aga-panel">
          <div className="aga-panel-header">
            <h5>🏆 Top Students</h5>
            <span className="aga-panel-badge" style={{ background: 'rgba(66,133,244,0.1)', color: '#4285f4' }}>
              Top {topStudents.length}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="aga-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Student</th>
                  <th>Coins</th>
                  <th>Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((s, i) => (
                  <tr key={s.student_id}>
                    <td>
                      <span className={`aga-rank ${rankClass(i)}`}>{i + 1}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.student__fullname}</td>
                    <td>💰 {s.total_coins || 0}</td>
                    <td style={{ fontWeight: 700 }}>{s.total_score || 0}</td>
                    <td>{s.total_attempts || 0}</td>
                  </tr>
                ))}
                {topStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: 30 }}>
                      No student data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Badge Distribution */}
        <div className="aga-panel">
          <div className="aga-panel-header">
            <h5>🏅 Badge Distribution</h5>
            <span className="aga-panel-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              {data.total_badges_awarded} total
            </span>
          </div>
          {badgeDist.length === 0 ? (
            <div className="aga-empty-badges">
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏅</div>
              No badges have been awarded yet
            </div>
          ) : (
            <div>
              {badgeDist.map((b) => (
                <div className="aga-badge-row" key={b.badge__badge_key}>
                  <div className="aga-badge-info">
                    <div
                      className="aga-badge-icon-circle"
                      style={{
                        background: 'rgba(139,92,246,0.1)',
                        color: '#8b5cf6',
                      }}
                    >
                      {BADGE_ICONS[b.badge__badge_key] || '🏅'}
                    </div>
                    <span className="aga-badge-name">{b.badge__title}</span>
                  </div>
                  <span className="aga-badge-count">{b.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGamesAnalytics;
