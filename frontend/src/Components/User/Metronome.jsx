import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Metronome.css';

/* ── Web Audio helpers ─────────────────────────────────────── */
let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
};

const playClick = (accent = false) => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accent ? 1000 : 700;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(accent ? 0.45 : 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (_) {}
};

/* ── Time-signature options ────────────────────────────────── */
const TIME_SIGS = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '6/8', beats: 6 },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const Metronome = () => {
  const [bpm, setBpm]           = useState(100);
  const [playing, setPlaying]   = useState(false);
  const [timeSig, setTimeSig]   = useState(TIME_SIGS[2]); // 4/4
  const [activeBeat, setActiveBeat] = useState(-1);

  const intervalRef  = useRef(null);
  const beatIndexRef = useRef(0);

  /* ── Start / Stop ────────────────────────────────────────── */
  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
    setActiveBeat(-1);
    beatIndexRef.current = 0;
  }, []);

  const start = useCallback(() => {
    stop();
    beatIndexRef.current = 0;
    setPlaying(true);

    const tick = () => {
      const idx = beatIndexRef.current;
      const accent = idx === 0;
      playClick(accent);
      setActiveBeat(idx);
      beatIndexRef.current = (idx + 1) % timeSig.beats;
    };

    tick(); // play the first beat immediately
    intervalRef.current = setInterval(tick, 60000 / bpm);
  }, [bpm, timeSig, stop]);

  /* Restart if bpm or timeSig changes while playing */
  useEffect(() => {
    if (playing) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, timeSig]);

  /* Cleanup on unmount */
  useEffect(() => () => { clearInterval(intervalRef.current); }, []);

  /* ── BPM helpers ─────────────────────────────────────────── */
  const nudge = (delta) => setBpm(b => Math.min(300, Math.max(30, b + delta)));

  const tempoLabel = (v) => {
    if (v <= 40)  return 'Grave';
    if (v <= 55)  return 'Largo';
    if (v <= 65)  return 'Adagio';
    if (v <= 76)  return 'Andante';
    if (v <= 108) return 'Moderato';
    if (v <= 120) return 'Allegretto';
    if (v <= 156) return 'Allegro';
    if (v <= 176) return 'Vivace';
    if (v <= 200) return 'Presto';
    return 'Prestissimo';
  };

  useEffect(() => { document.title = 'LMS | Metronome'; }, []);

  /* ═════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════ */
  return (
    <div className="container-fluid" style={{ padding: 0 }}>
      <div className="row" style={{ margin: 0, minHeight: '100vh' }}>
        <Sidebar />
        <section className='col-md-9 ms-sm-auto col-lg-10 px-md-4' style={{ background: '#101C2C', minHeight: '100vh' }}>
          <div className="met-wrapper">

            {/* Header */}
            <div className="met-header">
              <span className="met-icon">🎵</span>
              <h1 className="met-title">Metronome</h1>
              <p className="met-subtitle">Practice your timing with a steady beat</p>
            </div>

            {/* Main card */}
            <div className="met-card">

              {/* Beat dots */}
              <div className="met-dots">
                {Array.from({ length: timeSig.beats }).map((_, i) => (
                  <div
                    key={i}
                    className={`met-dot ${i === activeBeat ? 'met-dot--active' : ''} ${i === 0 ? 'met-dot--accent' : ''}`}
                  />
                ))}
              </div>

              {/* BPM display */}
              <div className="met-bpm-area">
                <button className="met-nudge" onClick={() => nudge(-5)}>−5</button>
                <button className="met-nudge met-nudge--sm" onClick={() => nudge(-1)}>−1</button>
                <div className="met-bpm-display">
                  <span className="met-bpm-num">{bpm}</span>
                  <span className="met-bpm-label">BPM</span>
                </div>
                <button className="met-nudge met-nudge--sm" onClick={() => nudge(1)}>+1</button>
                <button className="met-nudge" onClick={() => nudge(5)}>+5</button>
              </div>

              {/* Tempo name */}
              <div className="met-tempo-name">{tempoLabel(bpm)}</div>

              {/* Slider */}
              <input
                type="range"
                min={30}
                max={300}
                value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="met-slider"
              />
              <div className="met-slider-labels">
                <span>30</span><span>100</span><span>200</span><span>300</span>
              </div>

              {/* Time signature */}
              <div className="met-timesig-row">
                {TIME_SIGS.map(ts => (
                  <button
                    key={ts.label}
                    className={`met-ts-btn ${ts.label === timeSig.label ? 'met-ts-btn--active' : ''}`}
                    onClick={() => setTimeSig(ts)}
                  >
                    {ts.label}
                  </button>
                ))}
              </div>

              {/* Play / Stop */}
              <button className={`met-play-btn ${playing ? 'met-play-btn--stop' : ''}`} onClick={playing ? stop : start}>
                {playing ? '⏹  Stop' : '▶  Start'}
              </button>
            </div>

            {/* Tips */}
            <div className="met-tips">
              <h3>Practice Tips</h3>
              <ul>
                <li>Start slow and build speed gradually</li>
                <li>Use the accent beat (beat 1) to stay oriented</li>
                <li>Try clapping, tapping, or playing along with your instrument</li>
                <li>Common tempos: 60 BPM (slow), 120 BPM (moderate), 180 BPM (fast)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Metronome;
