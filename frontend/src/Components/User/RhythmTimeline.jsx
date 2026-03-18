import React from 'react';

/**
 * SVG Rhythm Timeline — shows note heads on a horizontal timeline
 * with expected beat markers and player tap markers.
 *
 * Props:
 *   noteTypes         — ["quarter","quarter","eighth","quarter", …]
 *   expectedTimestamps — [0, 750, 1125, 1500, …]  (ms from start)
 *   taps              — [12, 760, 1100, …]  (ms from start, player's taps)
 *   toleranceMs       — 130  (tolerance window in ms)
 *   totalDurationMs   — total timeline length in ms (auto-calculated if omitted)
 *   playheadMs        — current time position of the playhead (null = no playhead)
 *   phase             — "idle" | "listening" | "playing" | "result"
 *   width / height    — SVG dimensions
 */

const NOTE_SYMBOLS = {
  quarter: { head: '●', label: '♩', width: 1 },
  eighth:  { head: '●', label: '♪', width: 0.5 },
  half:    { head: '◑', label: '𝅗𝅥', width: 2 },
  whole:   { head: '○', label: '𝅝', width: 4 },
  dotted_quarter: { head: '●·', label: '♩·', width: 1.5 },
};

const RhythmTimeline = ({
  noteTypes = [],
  expectedTimestamps = [],
  taps = [],
  toleranceMs = 130,
  totalDurationMs = null,
  playheadMs = null,
  phase = 'idle',
  width = 600,
  height = 160,
}) => {
  const padL = 50;
  const padR = 30;
  const trackWidth = width - padL - padR;
  const trackY = 80;
  const duration = totalDurationMs || (expectedTimestamps.length > 0
    ? Math.max(...expectedTimestamps) + 800
    : 4000);

  const msToX = (ms) => padL + (ms / duration) * trackWidth;

  // Determine tap accuracy per expected beat
  const tapResults = expectedTimestamps.map(exp => {
    const closest = taps.reduce((best, t) => {
      const d = Math.abs(t - exp);
      return d < Math.abs(best - exp) ? t : best;
    }, Infinity);
    const delta = Math.abs(closest - exp);
    if (delta <= toleranceMs * 0.4) return 'perfect';
    if (delta <= toleranceMs) return 'good';
    return 'miss';
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
         style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="rr-track-bg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <filter id="rr-glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feFlood floodColor="#22c55e" floodOpacity="0.5" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="rr-glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feFlood floodColor="#f59e0b" floodOpacity="0.5" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="rr-glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
          <feFlood floodColor="#ef4444" floodOpacity="0.5" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="#0f172a" rx="12" />

      {/* Track line */}
      <line x1={padL} y1={trackY} x2={padL + trackWidth} y2={trackY}
            stroke="#475569" strokeWidth="2" strokeDasharray="6,4" />

      {/* Beat markers (expected) */}
      {expectedTimestamps.map((ts, i) => {
        const x = msToX(ts);
        const nt = noteTypes[i] || 'quarter';
        const info = NOTE_SYMBOLS[nt] || NOTE_SYMBOLS.quarter;
        const resultColor = phase === 'result'
          ? (tapResults[i] === 'perfect' ? '#22c55e'
            : tapResults[i] === 'good' ? '#f59e0b' : '#ef4444')
          : '#94a3b8';
        const glowId = phase === 'result'
          ? (tapResults[i] === 'perfect' ? 'url(#rr-glow-green)'
            : tapResults[i] === 'good' ? 'url(#rr-glow-yellow)' : 'url(#rr-glow-red)')
          : '';

        return (
          <g key={`beat-${i}`}>
            {/* Vertical tick */}
            <line x1={x} y1={trackY - 18} x2={x} y2={trackY + 18}
                  stroke={resultColor} strokeWidth="1" opacity="0.4" />
            {/* Note head */}
            <circle cx={x} cy={trackY} r={10}
                    fill={phase === 'result' ? resultColor : '#e2e8f0'}
                    stroke={resultColor} strokeWidth="2"
                    filter={glowId} />
            {/* Note type label */}
            <text x={x} y={trackY - 22} textAnchor="middle"
                  fontSize="16" fill={resultColor} fontFamily="serif">
              {info.label}
            </text>
            {/* Beat number */}
            <text x={x} y={trackY + 36} textAnchor="middle"
                  fontSize="10" fill="#64748b">
              {i + 1}
            </text>
            {/* Result label */}
            {phase === 'result' && (
              <text x={x} y={trackY + 50} textAnchor="middle"
                    fontSize="9" fontWeight="bold" fill={resultColor}>
                {tapResults[i] === 'perfect' ? '✓ Perfect'
                  : tapResults[i] === 'good' ? '~ Good' : '✗ Miss'}
              </text>
            )}
          </g>
        );
      })}

      {/* Player tap markers */}
      {taps.map((t, i) => {
        const x = msToX(t);
        return (
          <g key={`tap-${i}`}>
            <circle cx={x} cy={trackY} r={5} fill="#38bdf8" opacity="0.8" />
            <circle cx={x} cy={trackY} r={8} fill="none" stroke="#38bdf8"
                    strokeWidth="1" opacity="0.4">
              {phase !== 'result' && (
                <animate attributeName="r" from="8" to="16" dur="0.6s" fill="freeze" />
              )}
              {phase !== 'result' && (
                <animate attributeName="opacity" from="0.4" to="0" dur="0.6s" fill="freeze" />
              )}
            </circle>
          </g>
        );
      })}

      {/* Playhead */}
      {playheadMs !== null && phase !== 'result' && (
        <g>
          <line x1={msToX(playheadMs)} y1={trackY - 30}
                x2={msToX(playheadMs)} y2={trackY + 30}
                stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
          <polygon
            points={`${msToX(playheadMs) - 5},${trackY - 30} ${msToX(playheadMs) + 5},${trackY - 30} ${msToX(playheadMs)},${trackY - 24}`}
            fill="#38bdf8" />
        </g>
      )}

      {/* BPM / time signature label */}
      <text x={12} y={20} fontSize="11" fill="#64748b">
        Timeline
      </text>
      <text x={width - 12} y={20} textAnchor="end" fontSize="11" fill="#64748b">
        {(duration / 1000).toFixed(1)}s
      </text>
    </svg>
  );
};

export default RhythmTimeline;
