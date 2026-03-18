import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
  startGameSession,
  submitGameAttempt,
  finishGameSession,
  getStudentGamesOverview,
} from '../../services/gameService';
import './MusicChallengeGame.css';

/* ── Web Audio helpers ──────────────────────────────────────── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _ctx = null;
const ctx = () => { if (!_ctx) _ctx = new AudioCtx(); return _ctx; };

function tone(freq, dur, type = 'sine', vol = 0.18) {
  try {
    const c = ctx(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  } catch (_) {}
}
const playCorrect  = () => { tone(523,0.1); setTimeout(()=>tone(659,0.1),80); setTimeout(()=>tone(784,0.15),160); };
const playWrong    = () => { tone(220,0.25,'sawtooth',0.12); };
const playTick     = () => tone(880, 0.04, 'square', 0.08);
const playFinish   = () => { tone(392,0.15); setTimeout(()=>tone(523,0.15),120); setTimeout(()=>tone(784,0.25),240); };
const playCountdown= () => tone(660, 0.08, 'triangle', 0.12);

/* ── Category display helpers ───────────────────────────────── */
const CAT_META = {
  instruments: { icon: '🎸', label: 'Instruments', color: '#f59e0b' },
  symbols:     { icon: '🎵', label: 'Symbols',     color: '#8b5cf6' },
  rhythm:      { icon: '🥁', label: 'Rhythm',      color: '#ef4444' },
  theory:      { icon: '📖', label: 'Theory',      color: '#3b82f6' },
  composers:   { icon: '🎹', label: 'Composers',   color: '#10b981' },
};
const catInfo = (c) => CAT_META[c] || { icon: '⚡', label: c || 'General', color: '#6366f1' };

/* ── Phases ─────────────────────────────────────────────────── */
const PHASE = { MENU: 'MENU', COUNTDOWN: 'COUNTDOWN', PLAYING: 'PLAYING', FEEDBACK: 'FEEDBACK', SUMMARY: 'SUMMARY' };
const GAME_LEVEL_CAP = 20;

const MusicChallengeGame = () => {
  const studentId = localStorage.getItem('studentId');

  /* overview / menu */
  const [loading, setLoading]       = useState(true);
  const [overview, setOverview]     = useState(null);
  const [gameData, setGameData]     = useState(null);  // { game, profile, access }
  const [selectedLevel, setSelectedLevel] = useState(1);

  /* session state */
  const [phase, setPhase]           = useState(PHASE.MENU);
  const [session, setSession]       = useState(null);
  const [questions, setQuestions]    = useState([]);
  const [qIndex, setQIndex]         = useState(0);
  const [question, setQuestion]     = useState(null);
  const [startError, setStartError] = useState('');

  /* timer */
  const [timeLeft, setTimeLeft]     = useState(5);
  const timerRef                    = useRef(null);
  const questionStartRef            = useRef(null);

  /* feedback per question */
  const [fbResult, setFbResult]     = useState(null);   // { is_correct, points, feedback, speed_bonus }
  const [selectedChoice, setSelectedChoice] = useState(null);

  /* running tallies */
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);
  const [maxStreak, setMaxStreak]   = useState(0);
  const [attempts, setAttempts]     = useState([]);    // per-question breakdown

  /* countdown */
  const [countNum, setCountNum]     = useState(3);

  /* summary session data */
  const [finalSession, setFinalSession] = useState(null);

  /* ── Load overview ──────────────────────────────────────── */
  const loadOverview = useCallback(async () => {
    try {
      const res = await getStudentGamesOverview(studentId);
      setOverview(res.data);
      const mc = res.data.games?.find(g => g.game.game_type === 'music_challenge');
      setGameData(mc || null);
      if (mc?.profile) {
        setSelectedLevel(Math.min(mc.profile.highest_level_unlocked || 1, mc.game.max_level));
      }
    } catch (_) {}
    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  /* ── Timer logic ────────────────────────────────────────── */
  const stopTimer = useCallback(() => { clearInterval(timerRef.current); timerRef.current = null; }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    const limit = question?.time_limit_seconds || 5;
    setTimeLeft(limit);
    const t0 = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const rem = Math.max(0, limit - elapsed);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timerRef.current); timerRef.current = null; }
    }, 50);
  }, [question, stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  /* ── Start session ──────────────────────────────────────── */
  const startGame = async () => {
    setStartError('');
    try {
      const res = await startGameSession(studentId, 'music_challenge', selectedLevel);
      const d = res.data;
      setSession(d.session);
      setQuestions(d.questions || [d.question]);
      setQIndex(0);
      setQuestion(d.question || d.questions?.[0]);
      setScore(0); setStreak(0); setMaxStreak(0); setAttempts([]);
      setFinalSession(null);
      setPhase(PHASE.COUNTDOWN);
      setCountNum(3);
    } catch (e) {
      setStartError(e.response?.data?.message || 'Could not start game. Check your connection.');
    }
  };

  /* ── Countdown tick ─────────────────────────────────────── */
  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return;
    if (countNum <= 0) {
      setPhase(PHASE.PLAYING);
      questionStartRef.current = Date.now();
      return;
    }
    playCountdown();
    const t = setTimeout(() => setCountNum(n => n - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countNum]);

  /* ── Start timer when playing ───────────────────────────── */
  useEffect(() => {
    if (phase === PHASE.PLAYING && question) {
      questionStartRef.current = Date.now();
      startTimer();
    }
  }, [phase, question, startTimer]);

  /* ── Time-up auto-submit ────────────────────────────────── */
  useEffect(() => {
    if (phase === PHASE.PLAYING && timeLeft <= 0) {
      handleAnswer(null); // timed out
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  /* ── Submit answer ──────────────────────────────────────── */
  const handleAnswer = async (choice) => {
    if (phase !== PHASE.PLAYING) return;
    stopTimer();
    setSelectedChoice(choice);
    const responseTimeMs = Date.now() - (questionStartRef.current || Date.now());

    try {
      const res = await submitGameAttempt(session.id, {
        question_id: question.id,
        answer: choice || '__TIMEOUT__',
        response_time_ms: responseTimeMs,
      });
      const r = res.data.attempt_result;
      const sess = res.data.session;

      // speed bonus display
      let speedBonus = 0;
      if (r.is_correct) {
        if (responseTimeMs <= 2000) speedBonus = 5;
        else if (responseTimeMs <= 3500) speedBonus = 3;
      }

      const attemptData = {
        question: question.prompt,
        category: question.question_payload?.category || 'general',
        choice,
        is_correct: r.is_correct,
        points: r.points,
        speedBonus,
        responseTimeMs,
        timedOut: !choice,
      };

      setFbResult({ ...r, speedBonus, responseTimeMs });
      setScore(sess.score);
      setStreak(sess.streak);
      setMaxStreak(prev => Math.max(prev, sess.max_streak || sess.streak));
      setAttempts(prev => [...prev, attemptData]);
      setPhase(PHASE.FEEDBACK);

      if (r.is_correct) playCorrect(); else playWrong();
    } catch (e) {
      console.error('Submit error', e);
      const isNetworkErr = !e.response;
      if (isNetworkErr) {
        setNetworkError('Network error — your answer may not have been recorded.');
        setTimeout(() => clearNetworkError(), 4000);
      }
      setFbResult({ is_correct: false, feedback: 'error', points: 0, speedBonus: 0, responseTimeMs });
      setPhase(PHASE.FEEDBACK);
    }
  };

  /* ── Advance after feedback ─────────────────────────────── */
  useEffect(() => {
    if (phase !== PHASE.FEEDBACK) return;
    const delay = 1200;
    const t = setTimeout(() => {
      const nextIdx = qIndex + 1;
      if (nextIdx < questions.length) {
        setQIndex(nextIdx);
        setQuestion(questions[nextIdx]);
        setFbResult(null);
        setSelectedChoice(null);
        setPhase(PHASE.PLAYING);
      } else {
        finishSession();
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Finish session ─────────────────────────────────────── */
  const finishSession = async () => {
    try {
      const elapsed = Math.round(((Date.now() - (session?.started_at ? new Date(session.started_at).getTime() : Date.now())) / 1000));
      const res = await finishGameSession(session.id, { time_spent_seconds: Math.max(1, elapsed) });
      setFinalSession(res.data.session);
      playFinish();
    } catch (e) {
      console.error('Finish error', e);
      setFinalSession({ score, max_streak: maxStreak });
    }
    setPhase(PHASE.SUMMARY);
  };

  /* ── Return to menu ─────────────────────────────────────── */
  const backToMenu = () => {
    setPhase(PHASE.MENU);
    setSession(null); setQuestion(null); setQuestions([]); setQIndex(0);
    setFbResult(null); setSelectedChoice(null);
    loadOverview();
  };

  /* ── Keyboard ───────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (phase === PHASE.PLAYING && question) {
        const idx = parseInt(e.key, 10);
        const choices = question.choices || [];
        if (idx >= 1 && idx <= choices.length) {
          e.preventDefault();
          handleAnswer(choices[idx - 1]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question]);

  /* ── Derived data ───────────────────────────────────────── */
  const profile = gameData?.profile;
  const access  = gameData?.access;
  const maxLevel = Math.min(gameData?.game?.max_level || GAME_LEVEL_CAP, GAME_LEVEL_CAP);
  const highestUnlocked = profile?.highest_level_unlocked || 1;
  const maxAccessible = access?.max_accessible_level || 5;
  const hasSubscription = access?.has_subscription !== false;
  const timerPercent = ((question?.time_limit_seconds || 5) > 0)
    ? (timeLeft / (question?.time_limit_seconds || 5)) * 100 : 0;
  const cat = catInfo(question?.question_payload?.category);

  /* ── Network error state ───────────────────────────────── */
  const [networkError, setNetworkError] = useState('');
  const clearNetworkError = () => setNetworkError('');

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="mc-container">
          <div className="mc-skeleton">
            <div className="mc-skel-line w60" />
            <div className="mc-skel-block" />
            <div className="mc-skel-line w80" />
            <div className="mc-skel-line w40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="mc-container">

        {/* ─── HEADER ───────────────────────────────────────── */}
        <div className="mc-header">
          <Link to="/student/games" className="mc-back-btn">← Games Hub</Link>
          <h1 className="mc-title">⚡ 5-Second Music Challenge</h1>
          {phase !== PHASE.MENU && phase !== PHASE.SUMMARY && (
            <div className="mc-score-pill">
              <span className="mc-score-icon">💰</span>
              <span className="mc-score-val">{score}</span>
              {streak >= 2 && <span className="mc-streak-badge">x{streak} 🔥</span>}
            </div>
          )}
        </div>
        {/* Network error banner */}
        {networkError && (
          <div className="mc-network-error">
            ⚠️ {networkError}
            <button className="mc-retry-btn" onClick={clearNetworkError}>Dismiss</button>
          </div>
        )}
        {/* ─── MENU PHASE ───────────────────────────────────── */}
        {phase === PHASE.MENU && (
          <div className="mc-menu">
            {/* Stats card */}
            <div className="mc-stats-card">
              <h2 className="mc-stats-title">Your Stats</h2>
              <div className="mc-stats-grid">
                <div className="mc-stat">
                  <span className="mc-stat-val">{profile?.total_score || 0}</span>
                  <span className="mc-stat-label">Total Score</span>
                </div>
                <div className="mc-stat">
                  <span className="mc-stat-val">{profile?.accuracy_percent?.toFixed(0) || 0}%</span>
                  <span className="mc-stat-label">Accuracy</span>
                </div>
                <div className="mc-stat">
                  <span className="mc-stat-val">{profile?.best_streak || 0}</span>
                  <span className="mc-stat-label">Best Streak</span>
                </div>
                <div className="mc-stat">
                  <span className="mc-stat-val">{profile?.sonara_coins || 0}</span>
                  <span className="mc-stat-label">Kannari Coins</span>
                </div>
              </div>
            </div>

            {!hasSubscription ? (
              <div className="mc-subscribe-prompt">
                <div className="mc-subscribe-icon">🔒</div>
                <h4>Subscription Required</h4>
                <p>Subscribe to unlock Sonara Games and start earning coins!</p>
                <Link to="/student/subscriptions" className="mc-subscribe-btn">
                  ⚡ Subscribe to Play
                </Link>
              </div>
            ) : (
            <>
            {/* Level selector */}
            <div className="mc-level-card">
              <h2 className="mc-level-title">Select Level</h2>
              <div className="mc-level-grid">
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map(lvl => {
                  const unlocked = lvl <= highestUnlocked;
                  const accessible = lvl <= maxAccessible;
                  const locked = !unlocked;
                  const gated = unlocked && !accessible;
                  return (
                    <button
                      key={lvl}
                      className={`mc-level-btn ${selectedLevel === lvl ? 'selected' : ''} ${locked ? 'locked' : ''} ${gated ? 'gated' : ''}`}
                      onClick={() => { if (unlocked && accessible) setSelectedLevel(lvl); }}
                      disabled={locked || gated}
                      title={locked ? 'Not yet unlocked' : gated ? 'Upgrade subscription' : `Level ${lvl}`}
                    >
                      {locked ? '🔒' : gated ? '👑' : lvl}
                    </button>
                  );
                })}
              </div>
              <p className="mc-level-hint">
                Level {selectedLevel} — {selectedLevel <= 2 ? 'Identification' : selectedLevel <= 5 ? 'Mixed Knowledge' : 'Advanced Theory'}
              </p>
            </div>

            <button className="mc-start-btn" onClick={startGame}>
              ⚡ Start Challenge
            </button>
            {startError && <div className="mc-network-error" style={{ marginTop: 12 }}>⚠️ {startError}</div>}
            </>
            )}
          </div>
        )}

        {/* ─── COUNTDOWN PHASE ──────────────────────────────── */}
        {phase === PHASE.COUNTDOWN && (
          <div className="mc-countdown-overlay">
            <div className="mc-countdown-num" key={countNum}>
              {countNum > 0 ? countNum : 'GO!'}
            </div>
          </div>
        )}

        {/* ─── PLAYING / FEEDBACK PHASE ─────────────────────── */}
        {(phase === PHASE.PLAYING || phase === PHASE.FEEDBACK) && question && (
          <div className="mc-game-area">
            {/* Progress bar */}
            <div className="mc-progress-row">
              <span className="mc-q-counter">Q {qIndex + 1} / {questions.length}</span>
              <div className="mc-progress-track">
                {questions.map((_, i) => (
                  <div key={i} className={`mc-progress-dot ${i < qIndex ? 'done' : ''} ${i === qIndex ? 'current' : ''}`} />
                ))}
              </div>
            </div>

            {/* Timer bar */}
            <div className="mc-timer-wrap">
              <div
                className={`mc-timer-bar ${timeLeft <= 1.5 ? 'danger' : timeLeft <= 3 ? 'warning' : ''}`}
                style={{ width: `${timerPercent}%` }}
              />
              <span className="mc-timer-text">{timeLeft.toFixed(1)}s</span>
            </div>

            {/* Category badge */}
            <div className="mc-cat-badge" style={{ '--cat-color': cat.color }}>
              <span>{cat.icon}</span> {cat.label}
            </div>

            {/* Question prompt */}
            <div className="mc-prompt-card">
              <p className="mc-prompt-text">{question.prompt}</p>
            </div>

            {/* Choices */}
            <div className="mc-choices-grid">
              {(question.choices || []).map((c, i) => {
                let cls = 'mc-choice-btn';
                if (phase === PHASE.FEEDBACK && fbResult) {
                  if (c === selectedChoice && fbResult.is_correct) cls += ' correct';
                  else if (c === selectedChoice && !fbResult.is_correct) cls += ' wrong';
                  else if (fbResult.correct_answer && c === fbResult.correct_answer && !fbResult.is_correct) cls += ' reveal';
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => handleAnswer(c)}
                    disabled={phase === PHASE.FEEDBACK}
                  >
                    <span className="mc-choice-key">{i + 1}</span>
                    <span className="mc-choice-text">{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback flash overlay */}
            {phase === PHASE.FEEDBACK && fbResult && (
              <div className={`mc-fb-flash ${fbResult.is_correct ? 'correct' : 'wrong'}`}>
                <div className="mc-fb-content">
                  <span className="mc-fb-icon">{fbResult.is_correct ? '✅' : (fbResult.feedback === 'timeout' ? '⏰' : '❌')}</span>
                  <span className="mc-fb-label">
                    {fbResult.is_correct ? 'Correct!' : (selectedChoice ? 'Wrong!' : 'Time\'s Up!')}
                  </span>
                  {fbResult.is_correct && (
                    <div className="mc-fb-points">
                      +{fbResult.points} pts
                      {fbResult.speedBonus > 0 && <span className="mc-speed-bonus">⚡+{fbResult.speedBonus} speed</span>}
                      {streak >= 2 && <span className="mc-streak-bonus">🔥 x{streak} streak</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SUMMARY PHASE ───────────────────────────────── */}
        {phase === PHASE.SUMMARY && (
          <div className="mc-summary">
            <div className="mc-summary-header">
              <h2>⚡ Challenge Complete!</h2>
              <p className="mc-summary-subtitle">Level {finalSession?.level || selectedLevel}</p>
            </div>

            {/* Big stats */}
            <div className="mc-summary-stats">
              <div className="mc-summary-stat hero">
                <span className="mc-summary-val">{finalSession?.score || score}</span>
                <span className="mc-summary-label">Total Score</span>
              </div>
              <div className="mc-summary-stat">
                <span className="mc-summary-val">
                  {attempts.filter(a => a.is_correct).length}/{attempts.length}
                </span>
                <span className="mc-summary-label">Correct</span>
              </div>
              <div className="mc-summary-stat">
                <span className="mc-summary-val">{finalSession?.max_streak || maxStreak}</span>
                <span className="mc-summary-label">Max Streak</span>
              </div>
              <div className="mc-summary-stat">
                <span className="mc-summary-val">
                  {attempts.length > 0 ? (attempts.reduce((s,a) => s + a.responseTimeMs, 0) / attempts.length / 1000).toFixed(1) : '0'}s
                </span>
                <span className="mc-summary-label">Avg Speed</span>
              </div>
            </div>

            {/* Coins earned */}
            {finalSession?.sonara_coins_earned > 0 && (
              <div className="mc-coins-earned">
                <span>💰 +{finalSession.sonara_coins_earned} Kannari Coins earned!</span>
              </div>
            )}

            {/* Level up */}
            {finalSession?.leveled_up && (
              <div className="mc-level-up-banner">
                🎉 Level Up! You unlocked Level {finalSession.new_level}!
              </div>
            )}

            {/* Per-question breakdown */}
            <div className="mc-breakdown">
              <h3>Question Breakdown</h3>
              <div className="mc-breakdown-list">
                {attempts.map((a, i) => (
                  <div key={i} className={`mc-breakdown-item ${a.is_correct ? 'correct' : 'wrong'}`}>
                    <div className="mc-bd-num">{i + 1}</div>
                    <div className="mc-bd-body">
                      <p className="mc-bd-question">{a.question}</p>
                      <div className="mc-bd-meta">
                        <span className="mc-bd-cat" style={{ color: catInfo(a.category).color }}>
                          {catInfo(a.category).icon} {catInfo(a.category).label}
                        </span>
                        {a.timedOut ? (
                          <span className="mc-bd-timeout">⏰ Timed out</span>
                        ) : (
                          <span className="mc-bd-time">{(a.responseTimeMs / 1000).toFixed(1)}s</span>
                        )}
                        <span className="mc-bd-pts">+{a.points} pts</span>
                        {a.speedBonus > 0 && <span className="mc-bd-speed">⚡+{a.speedBonus}</span>}
                      </div>
                    </div>
                    <div className="mc-bd-icon">{a.is_correct ? '✅' : '❌'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mc-summary-actions">
              <button className="mc-play-again-btn" onClick={() => { backToMenu(); setTimeout(startGame, 100); }}>
                ⚡ Play Again
              </button>
              <button className="mc-menu-btn" onClick={backToMenu}>Back to Menu</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicChallengeGame;
