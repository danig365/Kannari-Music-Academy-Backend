import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import RhythmTimeline from './RhythmTimeline';
import {
  startGameSession,
  submitGameAttempt,
  finishGameSession,
  getStudentGamesOverview,
} from '../../services/gameService';
import './RhythmRushGame.css';

// ─── Web Audio helpers ─────────────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _ctx = null;
function getCtx() {
  if (!_ctx) _ctx = new AudioCtx();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function playClick(freq = 800, dur = 0.06, vol = 0.25) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

function playMetronomeClick(accent = false) {
  playClick(accent ? 1200 : 800, accent ? 0.08 : 0.05, accent ? 0.35 : 0.25);
}

function playTapSound() {
  playClick(600, 0.04, 0.3);
}

function playResultSound(type) {
  if (type === 'perfect') {
    [523, 659, 784].forEach((f, i) => setTimeout(() => playClick(f, 0.12, 0.2), i * 80));
  } else if (type === 'good') {
    [440, 554].forEach((f, i) => setTimeout(() => playClick(f, 0.1, 0.18), i * 100));
  } else {
    playClick(200, 0.3, 0.15);
    setTimeout(() => playClick(180, 0.35, 0.12), 150);
  }
}

function playCountdownBeep(final = false) {
  playClick(final ? 880 : 440, final ? 0.15 : 0.08, 0.2);
}

// ─── Game phases ────────────────────────────────────────────────────────────
const PHASE = {
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  DEMO: 'demo',
  LISTEN_WAIT: 'listen_wait',
  TAPPING: 'tapping',
  SUBMITTING: 'submitting',
  FEEDBACK: 'feedback',
  SUMMARY: 'summary',
};

const GAME_LEVEL_CAP = 20;

const RhythmRushGame = () => {
  const studentId = localStorage.getItem('studentId');

  // ─── State ───────────────────────────────────────────────
  const [phase, setPhase] = useState(PHASE.MENU);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(1);
  const [maxGameLevel, setMaxGameLevel] = useState(20);
  const [maxAccessibleLevel, setMaxAccessibleLevel] = useState(5);
  const [hasSubscription, setHasSubscription] = useState(true);

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [expectedTs, setExpectedTs] = useState([]);
  const [noteTypes, setNoteTypes] = useState([]);
  const [bpm, setBpm] = useState(60);
  const [toleranceMs, setToleranceMs] = useState(150);
  const [patternDuration, setPatternDuration] = useState(4000);

  const [taps, setTaps] = useState([]);
  const [tapBase, setTapBase] = useState(null);
  const [playheadMs, setPlayheadMs] = useState(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [lastResult, setLastResult] = useState(null);
  const [ripples, setRipples] = useState([]);

  const [summary, setSummary] = useState(null);
  const [countdownNum, setCountdownNum] = useState(3);

  const sessionStartRef = useRef(null);
  const submittingRef = useRef(false);
  const tapTimerRef = useRef(null);
  const animRef = useRef(null);

  // ─── Load overview ───────────────────────────────────────
  useEffect(() => {
    document.title = 'LMS | Rhythm Rush';
    if (!studentId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await getStudentGamesOverview(studentId);
        const rr = res.data.games?.find(g => g.game.game_type === 'rhythm_rush');
        if (rr) {
          setProfile(rr.profile);
          setMaxLevel(rr.profile.highest_level_unlocked || 1);
          setSelectedLevel(rr.profile.highest_level_unlocked || 1);
          setMaxGameLevel(Math.min(rr.game?.max_level || GAME_LEVEL_CAP, GAME_LEVEL_CAP));
          setMaxAccessibleLevel(rr.access?.max_accessible_level || 5);
          setHasSubscription(rr.access?.has_subscription !== false);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [studentId]);

  // ─── Cleanup ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(tapTimerRef.current);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ─── Setup question data ─────────────────────────────────
  const setupQuestion = useCallback((q) => {
    const payload = q.question_payload || {};
    const ts = payload.expected_timestamps || [0, 1000, 2000, 3000];
    const nt = payload.note_types || ts.map(() => 'quarter');
    const b = payload.bpm || 60;
    const tol = payload.tolerance_ms || 150;
    const dur = ts.length > 0 ? Math.max(...ts) + 800 : 4000;
    setExpectedTs(ts);
    setNoteTypes(nt);
    setBpm(b);
    setToleranceMs(tol);
    setPatternDuration(dur);
    setTaps([]);
    setPlayheadMs(null);
    setLastResult(null);
    submittingRef.current = false;
  }, []);

  // ─── 3-2-1 Countdown ────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return;
    if (countdownNum <= 0) {
      startDemo();
      return;
    }
    playCountdownBeep(countdownNum === 1);
    const t = setTimeout(() => setCountdownNum(c => c - 1), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdownNum]);

  // ─── Start game session ──────────────────────────────────
  const startGame = async () => {
    setError('');
    try {
      const res = await startGameSession(studentId, 'rhythm_rush', selectedLevel);
      const data = res.data;
      if (!data.bool) { setError(data.message || 'Failed to start'); return; }
      setSession(data.session);
      setQuestions(data.questions || []);
      setCurrentQIndex(0);
      setScore(0); setStreak(0); setMaxStreak(0);
      setCorrectCount(0); setWrongCount(0);
      setSummary(null);
      sessionStartRef.current = Date.now();
      if (data.questions?.length > 0) setupQuestion(data.questions[0]);
      setCountdownNum(3);
      setPhase(PHASE.COUNTDOWN);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not start session');
    }
  };

  // ─── Demo: play pattern with metronome ───────────────────
  const startDemo = useCallback(() => {
    setPhase(PHASE.DEMO);
    setPlayheadMs(0);
    const startTime = Date.now();
    expectedTs.forEach((ts, i) => {
      setTimeout(() => playMetronomeClick(i === 0), ts);
    });
    const animate = () => {
      const elapsed = Date.now() - startTime;
      setPlayheadMs(elapsed);
      if (elapsed < patternDuration) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPlayheadMs(null);
        setTimeout(() => {
          setPhase(PHASE.LISTEN_WAIT);
          setTimeout(() => startTapping(), 800);
        }, 300);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedTs, patternDuration]);

  // ─── Tapping phase ──────────────────────────────────────
  const startTapping = useCallback(() => {
    setTaps([]);
    setPlayheadMs(0);
    setPhase(PHASE.TAPPING);
    const startTime = Date.now();
    setTapBase(startTime);
    const animate = () => {
      const elapsed = Date.now() - startTime;
      setPlayheadMs(elapsed);
      if (elapsed < patternDuration + 500) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPlayheadMs(null);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternDuration]);

  // ─── Submit attempt ref (for closures) ───────────────────
  const doSubmitRef = useRef(null);

  const doSubmitAttempt = useCallback(async () => {
    if (submittingRef.current || !session) return;
    submittingRef.current = true;
    clearTimeout(tapTimerRef.current);
    cancelAnimationFrame(animRef.current);
    setPhase(PHASE.SUBMITTING);

    const q = questions[currentQIndex];
    if (!q) return;

    try {
      const res = await submitGameAttempt(session.id, {
        question_id: q.id,
        expected_timestamps: expectedTs,
        taps: taps,
        tolerance_ms: toleranceMs,
      });
      const d = res.data;
      const result = d.attempt_result;
      setLastResult(result);
      setScore(d.session.score);
      setStreak(d.session.streak);
      setMaxStreak(d.session.max_streak);

      if (result.is_correct) {
        setCorrectCount(c => c + 1);
        playResultSound(result.feedback);
      } else {
        setWrongCount(c => c + 1);
        playResultSound('try_again');
      }
      setPhase(PHASE.FEEDBACK);

      setTimeout(() => {
        const nextIdx = currentQIndex + 1;
        if (nextIdx >= questions.length) {
          doFinish();
        } else {
          setCurrentQIndex(nextIdx);
          setupQuestion(questions[nextIdx]);
          setCountdownNum(3);
          setPhase(PHASE.COUNTDOWN);
        }
      }, 2500);
    } catch (e) {
      console.error('Submit error', e);
      const isNetworkErr = !e.response;
      if (isNetworkErr) {
        setNetworkError('Network error — your tap may not have been recorded.');
        setTimeout(() => clearNetworkError(), 4000);
      }
      setPhase(PHASE.FEEDBACK);
      setLastResult({ feedback: 'try_again', is_correct: false, points: 0 });
      setTimeout(() => {
        const nextIdx = currentQIndex + 1;
        if (nextIdx >= questions.length) doFinish();
        else {
          setCurrentQIndex(nextIdx);
          setupQuestion(questions[nextIdx]);
          setCountdownNum(3);
          setPhase(PHASE.COUNTDOWN);
        }
      }, isNetworkErr ? 3000 : 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, questions, currentQIndex, expectedTs, taps, toleranceMs, setupQuestion]);

  useEffect(() => { doSubmitRef.current = doSubmitAttempt; }, [doSubmitAttempt]);

  // Auto-submit timer
  useEffect(() => {
    if (phase === PHASE.TAPPING) {
      tapTimerRef.current = setTimeout(() => {
        cancelAnimationFrame(animRef.current);
        setPlayheadMs(null);
        if (doSubmitRef.current) doSubmitRef.current();
      }, patternDuration + 600);
      return () => clearTimeout(tapTimerRef.current);
    }
  }, [phase, patternDuration]);

  // ─── Handle tap ──────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase !== PHASE.TAPPING || !tapBase) return;
    const elapsed = Date.now() - tapBase;
    playTapSound();
    setTaps(prev => [...prev, elapsed]);
    const id = Date.now();
    setRipples(prev => [...prev, id]);
    setTimeout(() => setRipples(prev => prev.filter(r => r !== id)), 600);
  }, [phase, tapBase]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    if (phase === PHASE.TAPPING) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [phase, handleTap]);

  // ─── Finish session ──────────────────────────────────────
  const doFinish = useCallback(async () => {
    if (!session) return;
    const elapsed = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000) : 60;
    try {
      const res = await finishGameSession(session.id, { time_spent_seconds: elapsed });
      const d = res.data;
      setSummary(d);
      if (d.level_up) {
        setMaxLevel(d.profile.highest_level_unlocked);
        playResultSound('perfect');
      }
      setPhase(PHASE.SUMMARY);
    } catch (e) {
      console.error('Finish error', e);
      setSummary({ session: { score, max_streak: maxStreak, correct_count: correctCount, wrong_count: wrongCount }, coins_earned: 0 });
      setPhase(PHASE.SUMMARY);
    }
  }, [session]);

  // ─── Derived ─────────────────────────────────────────────
  const currentQuestion = questions[currentQIndex] || null;
  const isActive = [PHASE.DEMO, PHASE.LISTEN_WAIT, PHASE.TAPPING, PHASE.SUBMITTING, PHASE.FEEDBACK].includes(phase);
  const timelinePhase = phase === PHASE.FEEDBACK ? 'result'
    : phase === PHASE.TAPPING ? 'listening'
    : phase === PHASE.DEMO ? 'playing' : 'idle';

  // ─── Network error state ──────────────────────────────────
  const [networkError, setNetworkError] = useState('');
  const clearNetworkError = () => setNetworkError('');

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="rr-container">
          <div className="rr-skeleton">
            <div className="rr-skel-line w60" />
            <div className="rr-skel-block" />
            <div className="rr-skel-circle" />
            <div className="rr-skel-line w80" />
            <div className="rr-skel-line w40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="rr-container">
        {/* ═══ HEADER ═══ */}
        <div className="rr-header">
          <Link to="/student/games" className="rr-back-btn">
            <i className="bi bi-arrow-left"></i> Games
          </Link>
          <h2 className="rr-title">
            <span className="rr-icon">🥁</span> Rhythm Rush
          </h2>
          <div className="rr-coins">
            <span className="rr-coin-icon">🪙</span>
            {profile?.sonara_coins || 0}
          </div>
        </div>

        {/* Network error banner */}
        {networkError && (
          <div className="rr-network-error">
            ⚠️ {networkError}
            <button className="rr-retry-btn" onClick={clearNetworkError}>Dismiss</button>
          </div>
        )}

        {/* ═══ MENU ═══ */}
        {phase === PHASE.MENU && (
          <div className="rr-menu">
            <div className="rr-hero-card">
              <div className="rr-hero-visual">
                <div className="rr-hero-drum">🥁</div>
                <div className="rr-hero-beats">
                  {['♩', '♩', '♪', '♪', '♩'].map((n, i) => (
                    <span key={i} className="rr-hero-note" style={{ animationDelay: `${i * 0.15}s` }}>{n}</span>
                  ))}
                </div>
              </div>
              <h3>Tap to the rhythm!</h3>
              <p className="rr-subtitle">
                Listen to the pattern, then tap it back with precise timing. Earn points for accuracy!
              </p>

              {!hasSubscription ? (
                <div className="rr-subscribe-prompt">
                  <div className="rr-subscribe-icon">🔒</div>
                  <h4>Subscription Required</h4>
                  <p>Subscribe to unlock Sonara Games and start earning coins!</p>
                  <Link to="/student/subscriptions" className="rr-subscribe-btn">
                    🥁 Subscribe to Play
                  </Link>
                </div>
              ) : (
              <>
              {profile && (
                <div className="rr-stats-row">
                  <div className="rr-stat">
                    <span className="rr-stat-val">{profile.best_score}</span>
                    <span className="rr-stat-lbl">Best Score</span>
                  </div>
                  <div className="rr-stat">
                    <span className="rr-stat-val">{profile.best_streak}</span>
                    <span className="rr-stat-lbl">Best Streak</span>
                  </div>
                  <div className="rr-stat">
                    <span className="rr-stat-val">{profile.accuracy_percent}%</span>
                    <span className="rr-stat-lbl">Accuracy</span>
                  </div>
                  <div className="rr-stat">
                    <span className="rr-stat-val">{profile.sonara_coins}</span>
                    <span className="rr-stat-lbl">Coins</span>
                  </div>
                </div>
              )}

              <div className="rr-level-select">
                <h5>Select Level</h5>
                <div className="rr-levels">
                  {Array.from({ length: Math.min(maxGameLevel || GAME_LEVEL_CAP, GAME_LEVEL_CAP) }, (_, i) => i + 1).map(lvl => {
                    const unlocked = lvl <= maxLevel;
                    const accessible = lvl <= maxAccessibleLevel;
                    const isCurrent = lvl === selectedLevel;
                    let cls = 'rr-level-btn';
                    if (isCurrent) cls += ' rr-level-active';
                    if (!unlocked) cls += ' rr-level-locked';
                    if (!accessible && unlocked) cls += ' rr-level-gated';
                    return (
                      <button key={lvl} className={cls}
                        disabled={!unlocked || !accessible}
                        onClick={() => setSelectedLevel(lvl)}
                        title={!unlocked ? `Reach 70% on Level ${lvl - 1}` : !accessible ? 'Upgrade subscription' : `Level ${lvl}`}>
                        {unlocked && accessible ? lvl : '🔒'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="rr-play-btn" onClick={startGame}>
                ▶ Play Level {selectedLevel}
              </button>
              {error && <div className="rr-error">{error}</div>}
              </>
              )}
            </div>
          </div>
        )}

        {/* ═══ COUNTDOWN ═══ */}
        {phase === PHASE.COUNTDOWN && (
          <div className="rr-countdown-overlay">
            <div className="rr-countdown-num" key={countdownNum}>
              {countdownNum > 0 ? countdownNum : 'GO!'}
            </div>
            <p className="rr-countdown-tip">Pattern {currentQIndex + 1} / {questions.length}</p>
          </div>
        )}

        {/* ═══ ACTIVE GAME ═══ */}
        {isActive && currentQuestion && (
          <div className="rr-game-area">
            <div className="rr-progress-row">
              <span className="rr-q-counter">Pattern {currentQIndex + 1} / {questions.length}</span>
              <div className="rr-progress-bar">
                <div className="rr-progress-fill"
                     style={{ width: `${((currentQIndex + (phase === PHASE.FEEDBACK ? 1 : 0)) / questions.length) * 100}%` }} />
              </div>
              <span className="rr-level-badge">Lv.{session?.level}</span>
            </div>

            <div className="rr-hud">
              <div className="rr-hud-item">
                <span className="rr-hud-label">Score</span>
                <span className="rr-hud-value">{score}</span>
              </div>
              <div className="rr-hud-item">
                <span className="rr-hud-label">BPM</span>
                <span className="rr-hud-value rr-bpm-value">{bpm}</span>
              </div>
              <div className="rr-hud-item">
                <span className="rr-hud-label">Streak</span>
                <span className={`rr-hud-value ${streak >= 2 ? 'rr-streak-hot' : ''}`}>
                  {streak > 0 ? '🔥' + streak : '—'}
                </span>
              </div>
              <div className="rr-hud-item">
                <span className="rr-hud-label">Correct</span>
                <span className="rr-hud-value">{correctCount}/{correctCount + wrongCount}</span>
              </div>
            </div>

            <div className="rr-prompt">{currentQuestion.prompt}</div>

            <div className={`rr-phase-indicator ${phase === PHASE.TAPPING ? 'rr-phase-tap' : phase === PHASE.DEMO ? 'rr-phase-demo' : ''}`}>
              {phase === PHASE.DEMO && '👂 Listen to the pattern...'}
              {phase === PHASE.LISTEN_WAIT && '🎯 Get ready to tap!'}
              {phase === PHASE.TAPPING && '🥁 TAP NOW!'}
              {phase === PHASE.SUBMITTING && '⏳ Analyzing...'}
            </div>

            <div className="rr-timeline-container">
              <RhythmTimeline
                noteTypes={noteTypes}
                expectedTimestamps={expectedTs}
                taps={taps}
                toleranceMs={toleranceMs}
                totalDurationMs={patternDuration}
                playheadMs={playheadMs}
                phase={timelinePhase}
                width={560}
                height={140}
              />
            </div>

            {phase === PHASE.TAPPING && (
              <div className="rr-tap-zone" onClick={handleTap}
                   onTouchStart={(e) => { e.preventDefault(); handleTap(); }}>
                <div className="rr-tap-circle">
                  <span className="rr-tap-label">TAP</span>
                  {ripples.map(id => (
                    <span key={id} className="rr-tap-ripple" />
                  ))}
                </div>
                <p className="rr-tap-hint">Tap here, press Space, or press Enter</p>
                <div className="rr-tap-count">
                  Taps: {taps.length} / {expectedTs.length}
                </div>
              </div>
            )}

            {phase === PHASE.TAPPING && taps.length >= expectedTs.length && (
              <button className="rr-submit-early-btn" onClick={() => {
                clearTimeout(tapTimerRef.current);
                cancelAnimationFrame(animRef.current);
                setPlayheadMs(null);
                if (doSubmitRef.current) doSubmitRef.current();
              }}>
                ✓ Submit Pattern
              </button>
            )}

            {phase === PHASE.FEEDBACK && lastResult && (
              <div className={`rr-feedback-overlay rr-fb-${lastResult.feedback}`}>
                <div className="rr-feedback-icon">
                  {lastResult.feedback === 'perfect' ? '⭐' : lastResult.feedback === 'good' ? '👍' : '🔄'}
                </div>
                <div className="rr-feedback-text">
                  {lastResult.feedback === 'perfect' ? 'PERFECT!'
                    : lastResult.feedback === 'good' ? 'GOOD'
                    : 'TRY AGAIN'}
                </div>
                <div className="rr-feedback-points">+{lastResult.points} pts</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SUMMARY ═══ */}
        {phase === PHASE.SUMMARY && (
          <div className="rr-summary">
            <div className="rr-summary-card">
              <h3 className="rr-summary-title">
                {summary?.level_up ? '🎉 Level Up!' : '🏁 Session Complete!'}
              </h3>

              {summary?.level_up && (
                <div className="rr-level-up-banner">
                  Level {summary.new_level_unlocked} Unlocked!
                </div>
              )}

              <div className="rr-summary-stats">
                <div className="rr-summary-stat">
                  <span className="rr-ss-val">{summary?.session?.score ?? score}</span>
                  <span className="rr-ss-label">Score</span>
                </div>
                <div className="rr-summary-stat">
                  <span className="rr-ss-val">{summary?.session_accuracy ?? 0}%</span>
                  <span className="rr-ss-label">Accuracy</span>
                </div>
                <div className="rr-summary-stat rr-summary-coins">
                  <span className="rr-ss-val">🪙 +{summary?.coins_earned ?? 0}</span>
                  <span className="rr-ss-label">Coins</span>
                </div>
                <div className="rr-summary-stat">
                  <span className="rr-ss-val">🔥 {summary?.session?.max_streak ?? maxStreak}</span>
                  <span className="rr-ss-label">Best Streak</span>
                </div>
              </div>

              <div className="rr-summary-breakdown">
                <span className="rr-sb-correct">✅ {correctCount} correct</span>
                <span className="rr-sb-wrong">❌ {wrongCount} wrong</span>
                <span className="rr-sb-total">of {questions.length} patterns</span>
              </div>

              {summary?.badges_awarded?.length > 0 && (
                <div className="rr-badges-section">
                  <h5>🏅 Badges Earned!</h5>
                  {summary.badges_awarded.map((b, i) => (
                    <div key={i} className="rr-badge-item">
                      <strong>{b.title || b.badge_key}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="rr-summary-actions">
                <button className="rr-play-btn"
                  onClick={() => {
                    if (summary?.level_up) {
                      setMaxLevel(summary.profile.highest_level_unlocked);
                      setSelectedLevel(summary.profile.highest_level_unlocked);
                    }
                    setProfile(summary?.profile || profile);
                    setPhase(PHASE.MENU);
                  }}>
                  {summary?.level_up
                    ? `▶ Play Level ${summary.profile?.highest_level_unlocked ?? selectedLevel + 1}`
                    : '🔄 Play Again'}
                </button>
                <Link to="/student/games" className="rr-secondary-btn">
                  Back to Games
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RhythmRushGame;
