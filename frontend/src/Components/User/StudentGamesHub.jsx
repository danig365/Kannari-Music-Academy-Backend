import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getStudentGamesOverview, getGameLeaderboard, seedPhase1Games } from '../../services/gameService';
import './StudentGamesHub.css';

/* ── Game meta ──────────────────────────────────────────────── */
const GAME_META = {
  note_ninja:      { icon: '🎯', color: '#3b82f6', gradient: 'linear-gradient(135deg,#1e40af,#3b82f6)', route: '/student/games/note-ninja' },
  rhythm_rush:     { icon: '🥁', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#6d28d9,#8b5cf6)', route: '/student/games/rhythm-rush' },
  music_challenge: { icon: '⚡', color: '#f59e0b', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', route: '/student/games/music-challenge' },
};

/* ── Badge meta ─────────────────────────────────────────────── */
const BADGE_META = {
  note_master:      { icon: '🎵', color: '#3b82f6', desc: 'Master of note identification' },
  rhythm_king:      { icon: '👑', color: '#8b5cf6', desc: 'King of rhythm patterns' },
  theory_champion:  { icon: '🏆', color: '#f59e0b', desc: 'Champion of music theory' },
};

/* ── Tabs ───────────────────────────────────────────────────── */
const TABS = ['games', 'leaderboard', 'badges'];

const StudentGamesHub = () => {
  const studentId = localStorage.getItem('studentId');
  const [loading, setLoading]         = useState(true);
  const [overview, setOverview]       = useState(null);
  const [activeTab, setActiveTab]     = useState('games');
  const [lbGame, setLbGame]           = useState('note_ninja');
  const [lbData, setLbData]           = useState(null);
  const [lbLoading, setLbLoading]     = useState(false);

  /* ── Load overview ──────────────────────────────────────── */
  const load = useCallback(async () => {
    try { await seedPhase1Games(); } catch (_) {}
    try {
      const res = await getStudentGamesOverview(studentId);
      setOverview(res.data);
    } catch (e) { console.error('Games overview failed', e); }
    setLoading(false);
  }, [studentId]);

  useEffect(() => { document.title = 'LMS | Games Hub'; load(); }, [load]);

  /* ── Load leaderboard when tab or game changes ──────────── */
  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    let cancelled = false;
    const fetchLb = async () => {
      setLbLoading(true);
      try {
        const res = await getGameLeaderboard(lbGame);
        if (!cancelled) setLbData(res.data);
      } catch (_) { if (!cancelled) setLbData(null); }
      if (!cancelled) setLbLoading(false);
    };
    fetchLb();
    return () => { cancelled = true; };
  }, [activeTab, lbGame]);

  /* ── Derived data ───────────────────────────────────────── */
  const coins  = overview?.sonara_coins_total || 0;
  const games  = overview?.games || [];
  const badges = overview?.badges || [];
  const recent = overview?.recent_sessions || [];

  /* ── Time-ago helper ────────────────────────────────────── */
  const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="gh-container">
          <div style={{ padding: '28px' }}>
            <div className="gh-skel-line w60" />
            <div className="gh-skel-line w40" />
            <div style={{ height: 16 }} />
            <div className="gh-skeleton-grid">
              <div className="gh-skel-card" />
              <div className="gh-skel-card" />
              <div className="gh-skel-card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="gh-container">

        {/* ─── Header ───────────────────────────────────────── */}
        <div className="gh-header">
          <div>
            <h1 className="gh-title">🎮 Games Hub</h1>
            <p className="gh-subtitle">Play, learn, and earn rewards</p>
          </div>
          <div className="gh-coins-display">
            <div className="gh-coin-icon">💰</div>
            <div className="gh-coin-info">
              <span className="gh-coin-amount">{coins.toLocaleString()}</span>
              <span className="gh-coin-label">Kannari Coins</span>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─────────────────────────────────────────── */}
        <div className="gh-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`gh-tab ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'games' ? '🎮 Games' : t === 'leaderboard' ? '🏅 Leaderboard' : '🏆 Badges'}
            </button>
          ))}
        </div>

        <div className="gh-body">

          {/* ════════════════════════════════════════════════════
              GAMES TAB
              ════════════════════════════════════════════════════ */}
          {activeTab === 'games' && (
            <>
              {/* Game Cards */}
              <div className="gh-games-grid">
                {games.map(g => {
                  const meta = GAME_META[g.game.game_type] || {};
                  const prof = g.profile || {};
                  const lvl  = prof.highest_level_unlocked || 1;
                  const maxLvl = g.game.max_level || 20;
                  const pct  = (lvl / maxLvl) * 100;
                  return (
                    <div key={g.game.id} className="gh-game-card">
                      <div className="gh-gc-icon" style={{ background: meta.gradient }}>
                        <span>{meta.icon}</span>
                      </div>
                      <div className="gh-gc-body">
                        <h3 className="gh-gc-title">{g.game.title}</h3>
                        <p className="gh-gc-desc">{g.game.description}</p>

                        {/* Stats row */}
                        <div className="gh-gc-stats">
                          <div className="gh-gc-stat">
                            <span className="gh-gc-stat-val">{prof.best_score || 0}</span>
                            <span className="gh-gc-stat-lbl">Best</span>
                          </div>
                          <div className="gh-gc-stat">
                            <span className="gh-gc-stat-val">{prof.accuracy_percent?.toFixed(0) || 0}%</span>
                            <span className="gh-gc-stat-lbl">Accuracy</span>
                          </div>
                          <div className="gh-gc-stat">
                            <span className="gh-gc-stat-val">{prof.best_streak || 0}</span>
                            <span className="gh-gc-stat-lbl">Streak</span>
                          </div>
                          <div className="gh-gc-stat">
                            <span className="gh-gc-stat-val">{prof.sonara_coins || 0}</span>
                            <span className="gh-gc-stat-lbl">Coins</span>
                          </div>
                        </div>

                        {/* Level progress bar */}
                        <div className="gh-gc-level-row">
                          <span className="gh-gc-level-label">Level {lvl}/{maxLvl}</span>
                          <div className="gh-gc-progress">
                            <div className="gh-gc-progress-fill" style={{ width: `${pct}%`, background: meta.gradient }} />
                          </div>
                        </div>

                        {/* Play button */}
                        {g.access.allowed ? (
                          <Link to={meta.route} className="gh-gc-play-btn" style={{ background: meta.gradient }}>
                            ▶ Play Now
                          </Link>
                        ) : !g.access.has_subscription ? (
                          <Link to="/student/subscriptions" className="gh-gc-play-btn gh-gc-subscribe-btn" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            🔒 Subscribe to Play
                          </Link>
                        ) : (
                          <div className="gh-gc-locked-badge">
                            👑 Requires {g.access.required_access_level}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recently Played */}
              {recent.length > 0 && (
                <div className="gh-recent-section">
                  <h2 className="gh-section-title">🕐 Recently Played</h2>
                  <div className="gh-recent-list">
                    {recent.map(s => {
                      const meta = GAME_META[s.game_type] || {};
                      return (
                        <div key={s.id} className="gh-recent-item">
                          <div className="gh-ri-icon" style={{ background: meta.gradient }}>
                            {meta.icon}
                          </div>
                          <div className="gh-ri-body">
                            <span className="gh-ri-title">{s.game_title}</span>
                            <span className="gh-ri-meta">
                              Lv.{s.level} · Score {s.score} · {s.correct_count}/{s.correct_count + s.wrong_count} correct
                            </span>
                          </div>
                          <div className="gh-ri-time">{timeAgo(s.completed_at)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════
              LEADERBOARD TAB
              ════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <div className="gh-lb-section">
              {/* Game selector */}
              <div className="gh-lb-selector">
                {games.map(g => {
                  const meta = GAME_META[g.game.game_type] || {};
                  return (
                    <button
                      key={g.game.game_type}
                      className={`gh-lb-game-btn ${lbGame === g.game.game_type ? 'active' : ''}`}
                      onClick={() => setLbGame(g.game.game_type)}
                      style={lbGame === g.game.game_type ? { borderColor: meta.color, color: meta.color } : {}}
                    >
                      {meta.icon} {g.game.title}
                    </button>
                  );
                })}
              </div>

              {lbData && (
                <p className="gh-lb-week">
                  Week of {new Date(lbData.week_start).toLocaleDateString()} – {new Date(lbData.week_end).toLocaleDateString()}
                </p>
              )}

              {lbLoading && <div className="gh-loading">Loading leaderboard...</div>}

              {!lbLoading && lbData && (
                <div className="gh-lb-table-wrap">
                  {(lbData.results || []).length === 0 ? (
                    <div className="gh-lb-empty">No rankings this week yet. Play a game to get on the board!</div>
                  ) : (
                    <table className="gh-lb-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Player</th>
                          <th>Score</th>
                          <th>Accuracy</th>
                          <th>Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(lbData.results || []).map((r, i) => {
                          const isMe = r.student === parseInt(studentId);
                          return (
                            <tr key={r.id} className={isMe ? 'gh-lb-me' : ''}>
                              <td>
                                <span className={`gh-lb-rank ${r.rank <= 3 ? `top-${r.rank}` : ''}`}>
                                  {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                                </span>
                              </td>
                              <td>
                                <span className="gh-lb-name">{r.student_name}</span>
                                {isMe && <span className="gh-lb-you-tag">YOU</span>}
                              </td>
                              <td className="gh-lb-score">{r.total_score.toLocaleString()}</td>
                              <td>{r.avg_accuracy?.toFixed(0) || 0}%</td>
                              <td>{r.best_streak}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════
              BADGES TAB
              ════════════════════════════════════════════════════ */}
          {activeTab === 'badges' && (
            <div className="gh-badges-section">
              <p className="gh-badges-intro">
                Earn badges by reaching high accuracy, advancing levels, and building streaks!
              </p>
              <div className="gh-badges-grid">
                {badges.map(b => {
                  const meta = BADGE_META[b.badge_key] || { icon: '🏅', color: '#6366f1', desc: '' };
                  return (
                    <div key={b.badge_key} className={`gh-badge-card ${b.earned ? 'earned' : 'locked'}`}>
                      <div className="gh-badge-icon" style={b.earned ? { borderColor: meta.color, boxShadow: `0 0 20px ${meta.color}40` } : {}}>
                        <span className="gh-badge-emoji">{b.earned ? meta.icon : '🔒'}</span>
                      </div>
                      <h3 className="gh-badge-title">{b.title}</h3>
                      <p className="gh-badge-desc">{b.description || meta.desc}</p>

                      {/* Criteria */}
                      <div className="gh-badge-criteria">
                        {b.criteria?.min_accuracy && (
                          <span className="gh-badge-crit-item">🎯 {b.criteria.min_accuracy}% accuracy</span>
                        )}
                        {b.criteria?.min_level && (
                          <span className="gh-badge-crit-item">📊 Level {b.criteria.min_level}+</span>
                        )}
                        {b.criteria?.min_streak && (
                          <span className="gh-badge-crit-item">🔥 {b.criteria.min_streak}+ streak</span>
                        )}
                      </div>

                      {b.earned ? (
                        <div className="gh-badge-earned-info">
                          ✅ Earned {timeAgo(b.awarded_at)}
                        </div>
                      ) : (
                        <div className="gh-badge-locked-info">
                          Keep playing to unlock!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGamesHub;
