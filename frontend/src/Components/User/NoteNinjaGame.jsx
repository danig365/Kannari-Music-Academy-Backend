import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import MusicStaff from './MusicStaff';
import {
  startGameSession,
  submitGameAttempt,
  finishGameSession,
  getStudentGamesOverview,
} from '../../services/gameService';
import './NoteNinjaGame.css';

// ─── Web Audio sound effects ────────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new AudioCtx();
  return _audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.18) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playCorrectSound() {
  playTone(523.25, 0.12, 'sine', 0.2);
  setTimeout(() => playTone(659.25, 0.12, 'sine', 0.2), 100);
  setTimeout(() => playTone(783.99, 0.18, 'sine', 0.2), 200);
}

function playIncorrectSound() {
  playTone(200, 0.25, 'sawtooth', 0.12);
  setTimeout(() => playTone(180, 0.3, 'sawtooth', 0.12), 150);
}

function playLevelUpSound() {
  [523.25, 587.33, 659.25, 783.99, 880].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.15, 'sine', 0.15), i * 90)
  );
}

function playStartSound() {
  playTone(440, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(554.37, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(659.25, 0.15, 'sine', 0.15), 160);
}

// ─── Game phases ───────────────────────────────────────────────────────────
const PHASE = {
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  FEEDBACK: 'feedback',
  SUMMARY: 'summary',
};

const GAME_LEVEL_CAP = 20;

const NoteNinjaGame = () => {
  const studentId = localStorage.getItem('studentId');

  // ─── State ──────────────────────────────────────────────
  const [phase, setPhase] = useState(PHASE.MENU);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Level selection
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [maxLevel, setMaxLevel] = useState(1);
  const [maxGameLevel, setMaxGameLevel] = useState(20);
  const [maxAccessibleLevel, setMaxAccessibleLevel] = useState(5);
  const [hasSubscription, setHasSubscription] = useState(true);

  // Session
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Score / streak
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Feedback per question
  const [lastResult, setLastResult] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showStreakBonus, setShowStreakBonus] = useState(false);

  // Summary
  const [summary, setSummary] = useState(null);

  // 3-2-1 countdown
  const [countdownNum, setCountdownNum] = useState(3);

  // Session start timestamp (for total time)
  const sessionStartRef = useRef(null);
  // Guard against double-submit
  const submittingRef = useRef(false);

  // ─── Load overview on mount ──────────────────────────────
  useEffect(() => {
    document.title = 'LMS | Note Ninja';
    if (!studentId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await getStudentGamesOverview(studentId);
        const ov = res.data;
        const nn = ov.games?.find(g => g.game.game_type === 'note_ninja');
        if (nn) {
          setProfile(nn.profile);
          setMaxLevel(nn.profile.highest_level_unlocked || 1);
          setSelectedLevel(nn.profile.highest_level_unlocked || 1);
          setMaxGameLevel(Math.min(nn.game?.max_level || GAME_LEVEL_CAP, GAME_LEVEL_CAP));
          setMaxAccessibleLevel(nn.access?.max_accessible_level || 5);
          setHasSubscription(nn.access?.has_subscription !== false);
        }
      } catch (e) {
        console.error('Failed to load games overview', e);
      }
      setLoading(false);
    })();
  }, [studentId]);

  // ─── Timer logic ─────────────────────────────────────────
  useEffect(() => {
    if (phase === PHASE.PLAYING && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, timeLeft]);

  // Time-out handler (separate effect to avoid stale closure in handleAnswer)
  useEffect(() => {
    if (phase === PHASE.PLAYING && timeLeft === 0 && questions.length > 0 && !submittingRef.current) {
      handleAnswer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  // ─── 3-2-1 Countdown ────────────────────────────────────
  useEffect(() => {
    if (phase !== PHASE.COUNTDOWN) return;
    if (countdownNum <= 0) {
      setPhase(PHASE.PLAYING);
      setQuestionStartTime(Date.now());
      const q = questions[0];
      setTimeLeft(q?.time_limit_seconds || 8);
      return;
    }
    const t = setTimeout(() => setCountdownNum(c => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, countdownNum, questions]);

  // ─── Start game ──────────────────────────────────────────
  const startGame = async () => {
    setError('');
    try {
      const res = await startGameSession(studentId, 'note_ninja', selectedLevel);
      const data = res.data;
      if (!data.bool) {
        setError(data.message || 'Failed to start');
        return;
      }
      playStartSound();
      setSession(data.session);
      setQuestions(data.questions || []);
      setCurrentQIndex(0);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setCorrectCount(0);
      setWrongCount(0);
      setLastResult(null);
      setSelectedAnswer(null);
      setSummary(null);
      setCountdownNum(3);
      submittingRef.current = false;
      sessionStartRef.current = Date.now();
      setPhase(PHASE.COUNTDOWN);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Could not start game session';
      setError(msg);
    }
  };

  // ─── Advance to next question or finish ──────────────────
  const advanceToNext = useCallback(() => {
    const nextIdx = currentQIndex + 1;
    if (nextIdx >= questions.length) {
      // Will be called inside finishSession
      return true; // signal: should finish
    }
    setCurrentQIndex(nextIdx);
    setLastResult(null);
    setSelectedAnswer(null);
    submittingRef.current = false;
    const q = questions[nextIdx];
    setTimeLeft(q?.time_limit_seconds || 8);
    setQuestionStartTime(Date.now());
    setPhase(PHASE.PLAYING);
    return false;
  }, [currentQIndex, questions]);

  // ─── Finish session ──────────────────────────────────────
  const doFinishSession = useCallback(async () => {
    if (!session) return;
    const elapsed = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 60;
    try {
      const res = await finishGameSession(session.id, { time_spent_seconds: elapsed });
      const d = res.data;
      setSummary(d);
      if (d.level_up) {
        playLevelUpSound();
        setMaxLevel(d.profile.highest_level_unlocked);
      }
      setPhase(PHASE.SUMMARY);
    } catch (e) {
      console.error('Finish error', e);
      setSummary({ session: { score, max_streak: maxStreak, correct_count: correctCount, wrong_count: wrongCount }, coins_earned: 0 });
      setPhase(PHASE.SUMMARY);
    }
  }, [session]);

  // ─── Handle answer ───────────────────────────────────────
  const handleAnswer = useCallback(async (choice) => {
    if (phase !== PHASE.PLAYING || !session || submittingRef.current) return;
    submittingRef.current = true;
    clearTimeout(timerRef.current);

    const q = questions[currentQIndex];
    if (!q) return;

    const responseTimeMs = questionStartTime ? Date.now() - questionStartTime : 5000;
    setSelectedAnswer(choice);
    setPhase(PHASE.FEEDBACK);

    try {
      const res = await submitGameAttempt(session.id, {
        question_id: q.id,
        answer: choice || '__timeout__',
        response_time_ms: responseTimeMs,
      });
      const d = res.data;
      const result = d.attempt_result;
      setLastResult(result);
      setScore(d.session.score);
      setStreak(d.session.streak);
      setMaxStreak(d.session.max_streak);

      if (result.is_correct) {
        setCorrectCount(c => c + 1);
        playCorrectSound();
        if (d.session.streak > 1) {
          setShowStreakBonus(true);
          setTimeout(() => setShowStreakBonus(false), 1200);
        }
      } else {
        setWrongCount(c => c + 1);
        playIncorrectSound();
      }

      // Auto-advance after delay
      const delay = result.is_correct ? 1200 : 2000;
      setTimeout(() => {
        const isLast = currentQIndex + 1 >= questions.length;
        if (isLast) {
          doFinishSession();
        } else {
          advanceToNext();
        }
      }, delay);
    } catch (e) {
      console.error('Submit error', e);
      const isNetworkErr = !e.response;
      if (isNetworkErr) {
        setNetworkError('Network error — your answer may not have been recorded.');
        setTimeout(() => clearNetworkError(), 4000);
      }
      setTimeout(() => {
        const isLast = currentQIndex + 1 >= questions.length;
        if (isLast) doFinishSession();
        else advanceToNext();
      }, isNetworkErr ? 2500 : 1500);
    }
  }, [phase, session, questions, currentQIndex, questionStartTime, advanceToNext, doFinishSession]);

  // ─── Derived values ──────────────────────────────────────
  const currentQuestion = questions[currentQIndex] || null;
  const notePayload = currentQuestion?.question_payload || {};
  const noteClef = notePayload.clef || 'treble';
  const noteName = notePayload.note || 'E4';

  let staffHighlight = null;
  if (phase === PHASE.FEEDBACK && lastResult) {
    staffHighlight = lastResult.is_correct ? 'correct' : 'incorrect';
  }

  const timerMax = currentQuestion?.time_limit_seconds || 8;
  const timerPercent = timerMax > 0 ? (timeLeft / timerMax) * 100 : 0;
  const timerColor = timerPercent > 50 ? '#22c55e' : timerPercent > 25 ? '#f59e0b' : '#ef4444';

  // ─── Network error state ──────────────────────────────────
  const [networkError, setNetworkError] = useState('');
  const clearNetworkError = () => setNetworkError('');

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="nn-container">
          <div className="nn-skeleton">
            <div className="nn-skel-line w60" />
            <div className="nn-skel-block" />
            <div className="nn-skel-line w80" />
            <div className="nn-skel-line w40" />
            <div className="nn-skel-row">
              <div className="nn-skel-card" />
              <div className="nn-skel-card" />
              <div className="nn-skel-card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="nn-container">
        {/* ═══ HEADER BAR ═══ */}
        <div className="nn-header">
          <Link to="/student/games" className="nn-back-btn">
            <i className="bi bi-arrow-left"></i> Games
          </Link>
          <h2 className="nn-title">
            <span className="nn-icon">🎵</span> Note Ninja
          </h2>
          <div className="nn-coins">
            <span className="nn-coin-icon">🪙</span>
            {profile?.sonara_coins || 0}
          </div>
        </div>

        {/* Network error banner */}
        {networkError && (
          <div className="nn-network-error">
            ⚠️ {networkError}
            <button className="nn-retry-btn" onClick={clearNetworkError}>Dismiss</button>
          </div>
        )}

        {/* ═══ MENU PHASE ═══ */}
        {phase === PHASE.MENU && (
          <div className="nn-menu">
            <div className="nn-hero-card">
              <div className="nn-hero-visual">
                <MusicStaff clef="treble" note="G4" width={280} height={160} />
              </div>
              <h3>Identify notes on the music staff!</h3>
              <p className="nn-subtitle">
                Test your note reading speed. Score points, build streaks, and earn Kannari Coins.
              </p>

              {!hasSubscription ? (
                <div className="nn-subscribe-prompt">
                  <div className="nn-subscribe-icon">🔒</div>
                  <h4>Subscription Required</h4>
                  <p>Subscribe to unlock Sonara Games and start earning coins!</p>
                  <Link to="/student/subscriptions" className="nn-subscribe-btn">
                    🎵 Subscribe to Play
                  </Link>
                </div>
              ) : (
              <>
              {profile && (
                <div className="nn-stats-row">
                  <div className="nn-stat">
                    <span className="nn-stat-val">{profile.best_score}</span>
                    <span className="nn-stat-lbl">Best Score</span>
                  </div>
                  <div className="nn-stat">
                    <span className="nn-stat-val">{profile.best_streak}</span>
                    <span className="nn-stat-lbl">Best Streak</span>
                  </div>
                  <div className="nn-stat">
                    <span className="nn-stat-val">{profile.accuracy_percent}%</span>
                    <span className="nn-stat-lbl">Accuracy</span>
                  </div>
                  <div className="nn-stat">
                    <span className="nn-stat-val">{profile.sonara_coins}</span>
                    <span className="nn-stat-lbl">Coins</span>
                  </div>
                </div>
              )}

              <div className="nn-level-select">
                <h5>Select Level</h5>
                <div className="nn-levels">
                  {Array.from({ length: Math.min(maxGameLevel || GAME_LEVEL_CAP, GAME_LEVEL_CAP) }, (_, i) => i + 1).map(lvl => {
                    const unlocked = lvl <= maxLevel;
                    const accessible = lvl <= maxAccessibleLevel;
                    const isCurrent = lvl === selectedLevel;
                    let cls = 'nn-level-btn';
                    if (isCurrent) cls += ' nn-level-active';
                    if (!unlocked) cls += ' nn-level-locked';
                    if (!accessible && unlocked) cls += ' nn-level-gated';
                    return (
                      <button
                        key={lvl}
                        className={cls}
                        disabled={!unlocked || !accessible}
                        onClick={() => setSelectedLevel(lvl)}
                        title={
                          !unlocked
                            ? `Reach 70% accuracy on Level ${lvl - 1} to unlock`
                            : !accessible
                            ? 'Upgrade subscription to access'
                            : `Level ${lvl}`
                        }
                      >
                        {unlocked && accessible ? lvl : '🔒'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="nn-play-btn" onClick={startGame}>
                ▶ Play Level {selectedLevel}
              </button>
              {error && <div className="nn-error">{error}</div>}
              </>
              )}
            </div>
          </div>
        )}

        {/* ═══ COUNTDOWN PHASE ═══ */}
        {phase === PHASE.COUNTDOWN && (
          <div className="nn-countdown-overlay">
            <div className="nn-countdown-num" key={countdownNum}>
              {countdownNum > 0 ? countdownNum : 'GO!'}
            </div>
          </div>
        )}

        {/* ═══ PLAYING / FEEDBACK PHASE ═══ */}
        {(phase === PHASE.PLAYING || phase === PHASE.FEEDBACK) && currentQuestion && (
          <div className="nn-game-area">
            <div className="nn-progress-row">
              <span className="nn-q-counter">
                Q {currentQIndex + 1} / {questions.length}
              </span>
              <div className="nn-progress-bar">
                <div
                  className="nn-progress-fill"
                  style={{
                    width: `${((currentQIndex + (phase === PHASE.FEEDBACK ? 1 : 0)) / questions.length) * 100}%`,
                  }}
                />
              </div>
              <span className="nn-level-badge">Lv.{session?.level}</span>
            </div>

            <div className="nn-timer-bar">
              <div
                className="nn-timer-fill"
                style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
              />
              <span className="nn-timer-text">{timeLeft}s</span>
            </div>

            <div className="nn-hud">
              <div className="nn-hud-item">
                <span className="nn-hud-label">Score</span>
                <span className="nn-hud-value nn-score-value">{score}</span>
              </div>
              <div className="nn-hud-item nn-streak-item">
                <span className="nn-hud-label">Streak</span>
                <span className={`nn-hud-value ${streak >= 3 ? 'nn-streak-hot' : ''}`}>
                  {streak > 0 ? '🔥'.repeat(Math.min(streak, 5)) : '—'}
                  {streak > 0 && ` ${streak}`}
                </span>
                {showStreakBonus && (
                  <span className="nn-streak-bonus-popup">+streak bonus!</span>
                )}
              </div>
              <div className="nn-hud-item">
                <span className="nn-hud-label">Correct</span>
                <span className="nn-hud-value">{correctCount}/{correctCount + wrongCount}</span>
              </div>
            </div>

            <div className="nn-staff-container">
              <MusicStaff
                clef={noteClef}
                note={noteName}
                highlight={staffHighlight}
                width={360}
                height={190}
              />
            </div>

            <p className="nn-prompt">{currentQuestion.prompt}</p>

            <div className="nn-choices">
              {(currentQuestion.choices || []).map((choice, i) => {
                let btnClass = 'nn-choice-btn';
                if (phase === PHASE.FEEDBACK && lastResult) {
                  if (lastResult.is_correct && choice === selectedAnswer) {
                    btnClass += ' nn-choice-correct';
                  } else if (!lastResult.is_correct && choice === selectedAnswer) {
                    btnClass += ' nn-choice-incorrect';
                  }
                  btnClass += ' nn-choice-disabled';
                }
                return (
                  <button
                    key={i}
                    className={btnClass}
                    disabled={phase === PHASE.FEEDBACK}
                    onClick={() => handleAnswer(choice)}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {phase === PHASE.FEEDBACK && lastResult && (
              <div className={`nn-feedback-banner ${lastResult.is_correct ? 'nn-fb-correct' : 'nn-fb-incorrect'}`}>
                {lastResult.is_correct ? (
                  <>
                    <span className="nn-fb-icon">✅</span>
                    <span>Correct! +{lastResult.points} pts</span>
                  </>
                ) : selectedAnswer === null ? (
                  <>
                    <span className="nn-fb-icon">⏱️</span>
                    <span>Time's up!</span>
                  </>
                ) : (
                  <>
                    <span className="nn-fb-icon">❌</span>
                    <span>Incorrect</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ SUMMARY PHASE ═══ */}
        {phase === PHASE.SUMMARY && (
          <div className="nn-summary">
            <div className="nn-summary-card">
              <h3 className="nn-summary-title">
                {summary?.level_up ? '🎉 Level Up!' : '🏁 Session Complete!'}
              </h3>

              {summary?.level_up && (
                <div className="nn-level-up-banner">
                  Level {summary.new_level_unlocked} Unlocked!
                </div>
              )}

              <div className="nn-summary-stats">
                <div className="nn-summary-stat">
                  <span className="nn-ss-val">{summary?.session?.score ?? score}</span>
                  <span className="nn-ss-label">Score</span>
                </div>
                <div className="nn-summary-stat">
                  <span className="nn-ss-val">
                    {summary?.session_accuracy ?? 0}%
                  </span>
                  <span className="nn-ss-label">Accuracy</span>
                </div>
                <div className="nn-summary-stat nn-summary-coins">
                  <span className="nn-ss-val">
                    🪙 +{summary?.coins_earned ?? 0}
                  </span>
                  <span className="nn-ss-label">Coins Earned</span>
                </div>
                <div className="nn-summary-stat">
                  <span className="nn-ss-val">
                    🔥 {summary?.session?.max_streak ?? maxStreak}
                  </span>
                  <span className="nn-ss-label">Best Streak</span>
                </div>
              </div>

              <div className="nn-summary-breakdown">
                <span className="nn-sb-correct">✅ {correctCount} correct</span>
                <span className="nn-sb-wrong">❌ {wrongCount} wrong</span>
                <span className="nn-sb-total">out of {questions.length}</span>
              </div>

              {summary?.badges_awarded?.length > 0 && (
                <div className="nn-badges-section">
                  <h5>🏅 Badges Earned!</h5>
                  {summary.badges_awarded.map((b, i) => (
                    <div key={i} className="nn-badge-item">
                      <strong>{b.title || b.badge_key}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="nn-summary-actions">
                <button
                  className="nn-play-btn"
                  onClick={() => {
                    if (summary?.level_up) {
                      setMaxLevel(summary.profile.highest_level_unlocked);
                      setSelectedLevel(summary.profile.highest_level_unlocked);
                    }
                    setProfile(summary?.profile || profile);
                    setPhase(PHASE.MENU);
                  }}
                >
                  {summary?.level_up
                    ? `▶ Play Level ${summary.profile?.highest_level_unlocked ?? selectedLevel + 1}`
                    : '🔄 Play Again'}
                </button>
                <Link to="/student/games" className="nn-secondary-btn">
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

export default NoteNinjaGame;
